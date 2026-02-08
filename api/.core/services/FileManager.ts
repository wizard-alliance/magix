import sharp from "sharp"
import { fileTypeFromBuffer } from "file-type"
import { createHash } from "node:crypto"
import { mkdir, writeFile, unlink, readdir, stat as fsStat } from "node:fs/promises"
import path from "node:path"

// -- Types --

export type ImageVariantInfo = {
	url: string
	path: string
	width: number
	height: number
	size: number
	format: string
}

export type FileMeta = {
	filename: string
	hash: string
	ext: string
	category: string
	type: `image` | `file`
	mimetype: string
	userId: number | string
	filesize: number
	created: string
	modified: string
}

export type FileRecord = {
	meta: FileMeta
	variants: Record<string, ImageVariantInfo>
	srcset?: string
}

export type UploadOptions = {
	category: string
	userId: number | string
	mimetype: string
}

// -- Service --

export class FileManager {

	// Configured via FS_IMAGE_SIZES in .env — everything else adapts automatically
	get sizes(): number[] {
		const raw = api.Config(`FS_IMAGE_SIZES`) as string
		return raw.split(`,`).map(s => Number(s.trim())).filter(n => n > 0)
	}

	private readonly imageMimes = new Set([`image/png`, `image/jpeg`, `image/avif`])

	// Configured via FS_BLOCKED_EXTENSIONS in .env
	get blockedExts(): Set<string> {
		const raw = api.Config(`FS_BLOCKED_EXTENSIONS`) as string
		return new Set(raw.split(`,`).map(s => s.trim().toLowerCase()).filter(Boolean))
	}

	private get uploadsDir() {
		return path.join(process.cwd(), api.Config(`FS_UPLOAD_DIR`) || `uploads`)
	}

	// -- Startup --

	async init() {
		const base = this.uploadsDir
		const types = [`original`, ...this.sizes.map(String)]
		// Create base upload dir + common category dirs
		await mkdir(base, { recursive: true })
		// Pre-create avatar folders (extend this array with new categories)
		for (const category of [`avatar`]) {
			for (const type of types) {
				await mkdir(path.join(base, category, type), { recursive: true })
			}
		}
	}

	// -- Private helpers --

	private resolvePath(category: string, type: string, filename: string) {
		const relative = `${category}/${type}/${filename}`
		const full = path.join(this.uploadsDir, relative)
		const uploadDir = api.Config(`FS_UPLOAD_DIR`) || `uploads`
		const url = `/static/${uploadDir}/${relative}`
		return { relative, full, url }
	}

	private extFromMime(mime: string): string {
		if (mime === `image/png`) return `png`
		if (mime === `image/avif`) return `avif`
		if (mime === `image/jpeg`) return `jpg`
		return mime.split(`/`).pop() || `bin`
	}

	private formatFromExt(ext: string): string {
		if (ext === `jpg` || ext === `jpeg`) return `jpeg`
		return ext
	}

	private isImage(mime: string): boolean {
		return this.imageMimes.has(mime)
	}

	private async validate(buffer: Buffer, declaredMime: string) {
		const detected = await fileTypeFromBuffer(buffer)

		if (detected && this.blockedExts.has(detected.ext)) {
			throw Object.assign(new Error(`File type "${detected.ext}" is not allowed`), { code: 415 })
		}

		const declaredExt = this.extFromMime(declaredMime)
		if (this.blockedExts.has(declaredExt)) {
			throw Object.assign(new Error(`File type "${declaredExt}" is not allowed`), { code: 415 })
		}

		if (detected) {
			const declaredBase = declaredMime.split(`/`)[0]
			const detectedBase = detected.mime.split(`/`)[0]
			if (declaredBase !== detectedBase) {
				throw Object.assign(new Error(`File content does not match declared type`), { code: 415 })
			}
		}

		// Enforce size limits from config
		const isImg = this.isImage(detected?.mime || declaredMime)
		const maxSize = Number(api.Config(isImg ? `FS_MAX_FILE_SIZE_IMAGE` : `FS_MAX_FILE_SIZE`) || 0)
		if (maxSize > 0 && buffer.length > maxSize) {
			const limitMB = (maxSize / 1_000_000).toFixed(0)
			throw Object.assign(new Error(`File exceeds the ${limitMB}MB size limit`), { code: 413 })
		}

		return { ext: detected?.ext || declaredExt, mime: detected?.mime || declaredMime }
	}

	private async getImageInfo(filePath: string): Promise<{ width: number, height: number, size: number, format: string }> {
		const meta = await sharp(filePath).metadata()
		const fileStat = await fsStat(filePath)
		return {
			width: meta.width || 0,
			height: meta.height || 0,
			size: fileStat.size,
			format: meta.format || `unknown`,
		}
	}

	private async buildImageVariant(category: string, type: string, filename: string): Promise<ImageVariantInfo> {
		const resolved = this.resolvePath(category, type, filename)
		const info = await this.getImageInfo(resolved.full)
		return { url: resolved.url, path: resolved.relative, ...info }
	}

	private buildSrcset(variants: Record<string, ImageVariantInfo>): string {
		return Object.entries(variants)
			.filter(([key]) => key !== `original`)
			.sort(([, a], [, b]) => a.width - b.width)
			.map(([, v]) => `${v.url} ${v.width}w`)
			.join(`, `)
	}

	private async ensureDir(filePath: string) {
		await mkdir(path.dirname(filePath), { recursive: true })
	}

	async upload(buffer: Buffer, opts: UploadOptions): Promise<FileRecord> {
		const { category, userId, mimetype } = opts
		const validated = await this.validate(buffer, mimetype)

		const hash = createHash(`md5`).update(buffer).digest(`hex`).slice(0, 8)
		const ext = this.extFromMime(validated.mime)
		const filename = `${hash}.${userId}.${ext}`
		const basename = `${hash}.${userId}`
		const isImg = this.isImage(validated.mime)
		const isAvif = validated.mime === `image/avif`
		const avifFilename = `${basename}.avif`
		const now = new Date().toISOString()

		// Write raw original (kept as archive, never served)
		const origPath = this.resolvePath(category, `original`, filename)
		await this.ensureDir(origPath.full)
		await writeFile(origPath.full, buffer)

		const meta: FileMeta = {
			filename, hash, ext, category,
			type: isImg ? `image` : `file`,
			mimetype: validated.mime,
			userId,
			filesize: buffer.length,
			created: now,
			modified: now,
		}

		if (!isImg) {
			const origVariant: ImageVariantInfo = {
				url: origPath.url, path: origPath.relative,
				width: 0, height: 0, size: buffer.length,
				format: ext,
			}
			return { meta, variants: { original: origVariant } }
		}

		// Write AVIF original
		const avifOrigPath = this.resolvePath(category, `original`, avifFilename)
		await this.ensureDir(avifOrigPath.full)
		if (!isAvif) {
			const avifBuffer = await sharp(buffer).avif({ quality: 65 }).toBuffer()
			await writeFile(avifOrigPath.full, avifBuffer)
		} else {
			// Source is already AVIF — original and avif are the same file
		}

		// Get source dimensions
		const sourceMeta = await sharp(buffer).metadata()
		const longestEdge = Math.max(sourceMeta.width || 0, sourceMeta.height || 0)

		// Resize all variants as AVIF
		await Promise.all(this.sizes.map(async (size) => {
			const sizeKey = String(size)
			if (longestEdge > size) {
				const resized = await sharp(buffer).resize(size, size, { fit: `inside`, withoutEnlargement: true }).avif({ quality: 65 }).toBuffer()
				const sizePath = this.resolvePath(category, sizeKey, avifFilename)
				await this.ensureDir(sizePath.full)
				await writeFile(sizePath.full, resized)
			}
		}))

		// Build full record with real metadata from disk
		return this.getFile(category, filename)
	}

	async getFile(category: string, filename: string): Promise<FileRecord> {
		const basename = filename.replace(/\.[^.]+$/, ``)
		const ext = filename.split(`.`).pop() || ``
		const hash = basename.split(`.`)[0] || ``
		const userId = basename.split(`.`).slice(1).join(`.`)
		const avifFilename = `${basename}.avif`

		// Check raw original exists
		const origPath = this.resolvePath(category, `original`, filename)
		const origStat = await fsStat(origPath.full).catch(() => null)
		if (!origStat) {
			throw Object.assign(new Error(`File not found`), { code: 404 })
		}

		const isImg = this.imageMimes.has(this.mimeFromExt(ext))

		// Build meta
		const meta: FileMeta = {
			filename, hash, ext, category,
			type: isImg ? `image` : `file`,
			mimetype: this.mimeFromExt(ext),
			userId,
			filesize: origStat.size,
			created: origStat.birthtime.toISOString(),
			modified: origStat.mtime.toISOString(),
		}

		if (!isImg) {
			const origVariant: ImageVariantInfo = {
				url: origPath.url, path: origPath.relative,
				width: 0, height: 0, size: origStat.size, format: ext,
			}
			return { meta, variants: { original: origVariant } }
		}

		// All served variants are AVIF — resolve the avif original
		const isAvif = ext === `avif`
		const avifOrigFile = isAvif ? filename : avifFilename
		const avifOrigPath = this.resolvePath(category, `original`, avifOrigFile)
		const avifOrigExists = await fsStat(avifOrigPath.full).then(() => true).catch(() => false)

		if (!avifOrigExists) {
			throw Object.assign(new Error(`AVIF original not found`), { code: 404 })
		}

		const origVariant = await this.buildImageVariant(category, `original`, avifOrigFile)
		const variants: Record<string, ImageVariantInfo> = { original: origVariant }

		// Check each size — all stored as avif
		await Promise.all(this.sizes.map(async (size) => {
			const sizeKey = String(size)
			const sizePath = this.resolvePath(category, sizeKey, avifFilename)
			const exists = await fsStat(sizePath.full).then(() => true).catch(() => false)

			if (exists) {
				variants[sizeKey] = await this.buildImageVariant(category, sizeKey, avifFilename)
			} else {
				// Fallback to original for sizes larger than source
				variants[sizeKey] = { ...origVariant }
			}
		}))

		const srcset = this.buildSrcset(variants)
		return { meta, variants, srcset }
	}

	async getFiles(category: string, userId?: number | string): Promise<FileRecord[]> {
		const origDir = path.join(this.uploadsDir, category, `original`)
		const exists = await fsStat(origDir).then(() => true).catch(() => false)
		if (!exists) return []

		const entries = await readdir(origDir)
		let files = entries.filter(f => !f.startsWith(`.`))

		if (userId !== undefined) {
			const userTag = `.${userId}.`
			files = files.filter(f => f.includes(userTag))
		}

		// Filter out .avif duplicates — only return original-format filenames
		files = files.filter(f =>
			!f.endsWith(`.avif`) ||
			!entries.some(e => e === f.replace(/\.avif$/, `.jpg`) || e === f.replace(/\.avif$/, `.png`))
		)

		return Promise.all(files.map(f => this.getFile(category, f)))
	}

	async delete(category: string, filename: string): Promise<void> {
		const basename = filename.replace(/\.[^.]+$/, ``)
		const avifFilename = `${basename}.avif`
		const types = [`original`, ...this.sizes.map(String)]

		await Promise.all(types.flatMap(type => [
			unlink(this.resolvePath(category, type, filename).full).catch(() => null),
			unlink(this.resolvePath(category, type, avifFilename).full).catch(() => null),
		]))
	}

	private mimeFromExt(ext: string): string {
		if (ext === `png`) return `image/png`
		if (ext === `avif`) return `image/avif`
		if (ext === `jpg` || ext === `jpeg`) return `image/jpeg`
		return `application/octet-stream`
	}
}
