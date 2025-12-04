// .magic/MagixCommand.mjs
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

export class MagixCommand {
	constructor(argv) {
		this.argv = argv.slice(2)
		this.cwd = process.cwd()
		this.force = process.env.FORCE === "1"
	}

	static run(CommandClass) {
		try {
			const cmd = new CommandClass(process.argv)
			const res = cmd.run()
			if (res instanceof Promise) {
				res.catch((err) => MagixCommand.handleError(err))
			}
		} catch (err) {
			MagixCommand.handleError(err)
		}
	}

	static handleError(err) {
		console.error("\n[Magix] ERROR:", err.message || err)
		process.exit(1)
	}

	resolve(relPath) {
		return path.resolve(this.cwd, relPath)
	}

	exists(relPath) {
		return fs.existsSync(this.resolve(relPath))
	}

	readJson(relPath, fallback = null) {
		const full = this.resolve(relPath)
		if (!fs.existsSync(full)) return fallback
		const raw = fs.readFileSync(full, "utf8")
		return JSON.parse(raw)
	}

	writeJson(relPath, data) {
		const full = this.resolve(relPath)
		fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8")
	}

	exec(cmd, options = {}) {
		execSync(cmd, { stdio: "inherit", ...options })
	}

	execCapture(cmd, options = {}) {
		return execSync(cmd, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "inherit"],
			...options,
		}).trim()
	}

	get configPath() {
		return this.resolve(".boilerplate.json")
	}

	hasConfig() {
		return fs.existsSync(this.configPath)
	}

	getConfig() {
		return this.readJson(".boilerplate.json", null)
	}

	requireConfig() {
		const cfg = this.getConfig()
		if (!cfg) {
			throw new Error("This repo is not initialised as a Magix app. Run: npm run init -- <git-url>")
		}
		return cfg
	}

	saveConfig(partial) {
		const current = this.getConfig() || {}
		const merged = { ...current, ...partial }
		this.writeJson(".boilerplate.json", merged)
		return merged
	}

	getCurrentBranch() {
		return this.execCapture("git rev-parse --abbrev-ref HEAD")
	}

	getBoilerplateRemoteUrl() {
		try {
			return this.execCapture("git remote get-url boilerplate")
		} catch {
			return "git@github.com:WizardOfTheVoid/magix.git"
		}
	}

	ensureDir(relPath) {
		const full = this.resolve(relPath)
		fs.mkdirSync(full, { recursive: true })
	}

	ensureFile(relPath, contents) {
		const full = this.resolve(relPath)
		if (fs.existsSync(full)) return
		this.ensureDir(path.dirname(relPath))
		fs.writeFileSync(full, contents, "utf8")
	}
}
