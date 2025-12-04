import { readdir, writeFile, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const filePath = fileURLToPath(import.meta.url)
const scriptsDir = path.dirname(filePath)
const projectRoot = path.resolve(scriptsDir, "..")
const distDir = path.resolve(projectRoot, "dist")

const isExecutableArtifact = async (dir) => {
	try {
		const entries = await readdir(dir)
		const hasExe = entries.some((entry) => entry.toLowerCase().endsWith(".exe"))
		const hasAppBundle = entries.some((entry) => entry.toLowerCase().endsWith(".app"))
		const hasAppImage = entries.some((entry) => entry.toLowerCase().endsWith(".appimage"))
		return hasExe || hasAppBundle || hasAppImage
	} catch (_) {
		return false
	}
}

const findTargetDirs = async () => {
	if (!existsSync(distDir)) return []
	const entries = await readdir(distDir, { withFileTypes: true })
	const targets = []
	for (const entry of entries) {
		if (!entry.isDirectory()) continue
		const fullPath = path.join(distDir, entry.name)
		if (entry.name.endsWith("-unpacked") || await isExecutableArtifact(fullPath)) {
			targets.push(fullPath)
		}
	}
	return targets
}

const writeFlag = async (targetDir) => {
	const flagPath = path.join(targetDir, ".debug")
	await writeFile(flagPath, `debug build generated ${new Date().toISOString()}\n`)
	console.log(`Created debug flag at ${flagPath}`)
}

const main = async () => {
	const targets = await findTargetDirs()
	if (!targets.length) {
		console.warn("No unpacked build outputs found; skipping debug flag creation")
		return
	}
	await Promise.all(targets.map(writeFlag))
}

main().catch((error) => {
	console.error("Failed to create debug flag", error)
	process.exitCode = 1
})
