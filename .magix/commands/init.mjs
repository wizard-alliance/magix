// .magic/init.mjs
import fs from "node:fs"
import { MagixCommand } from "../MagixCommand.mjs"

class InitCommand extends MagixCommand {
	run() {
		const repoUrl = this.argv[0]

		if (!repoUrl) {
			throw new Error("Usage: npm run init -- git@github.com:YOU/your-app.git")
		}

		if (this.hasConfig() && !this.force) {
			throw new Error(".boilerplate.json already exists. Use npm run reinit if you really want to reset.")
		}

		// Capture original origin URL (boilerplate) if it exists
		let originUrl = null
		try {
			originUrl = this.execCapture("git remote get-url origin")
		} catch {
			originUrl = "git@github.com:WizardOfTheVoid/magix.git"
		}

		// Rename origin -> boilerplate (ignore errors)
		try {
			this.exec("git remote rename origin boilerplate")
		} catch {
			// no-op
		}

		// Ensure boilerplate remote URL is correct
		try {
			this.exec(`git remote set-url boilerplate ${originUrl}`)
		} catch {
			this.exec(`git remote add boilerplate ${originUrl}`)
		}

		// Add new origin
		try {
			this.exec(`git remote add origin ${repoUrl}`)
		} catch {
			// origin may already exist
		}

		const branch = this.getCurrentBranch()
		try {
			this.exec(`git push -u origin ${branch}`)
		} catch {
			// ignore if push fails (e.g. empty remote not ready yet)
		}

		// Create core config if missing
		const coreConfigPath = this.resolve(".coreconfig.ts")
		if (!fs.existsSync(coreConfigPath)) {
			fs.writeFileSync(
				coreConfigPath,
				`export default {
  features: {
    auth: true,
    payments: false,
    api: true,
    ws: true,
    electron: false,
  },
  payments: {
    provider: "stripe",
  },
} as const;
`,
				"utf8"
			)
		}

		// Create src entrypoints if missing
		this.ensureFile(
			"api/src/index.ts",
			`import "../.core/index";

console.log("[Magix] API src booted.");
`
		)

		this.ensureFile(
			"app/src/main.ts",
			`import "../.core/index";

console.log("[Magix] App src booted.");
`
		)

		this.ensureFile(
			"electron/src/main.ts",
			`import "../.core/index";

console.log("[Magix] Electron src booted.");
`
		)

		// Detect current boilerplate version/tag
		let version = null
		try {
			version = this.execCapture("git describe --tags --exact-match")
		} catch {
			version = this.execCapture("git rev-parse HEAD")
		}

		const boilerplateUrl = this.getBoilerplateRemoteUrl()

		this.saveConfig({
			remote: boilerplateUrl,
			branch: process.env.BOILERPLATE_BRANCH || "main",
			version,
		})

		console.log("\n[Magix] Init complete.")
		console.log("  boilerplate:", boilerplateUrl)
		console.log("  origin:     ", repoUrl)
		console.log("  branch:     ", branch)
		console.log("  version:    ", version)
	}
}

MagixCommand.run(InitCommand)
