// .magic/update.mjs
import { MagixCommand } from "../MagixCommand.mjs"

class UpdateCommand extends MagixCommand {
	run() {
		const cfg = this.requireConfig()
		const argRef = this.argv[0]
		const branch = cfg.branch || "main"

		this.exec("git fetch boilerplate --tags")

		const target = argRef && argRef !== "latest" ? argRef : `boilerplate/${process.env.BOILERPLATE_BRANCH || branch}`

		console.log(`[Magix] Updating .core from: ${target}`)

		const coreDirs = ["api/.core", "app/.core", "electron/.core"]

		for (const dir of coreDirs) {
			if (this.exists(dir)) {
				this.exec(`git checkout ${target} -- ${dir}`)
			}
		}

		let newVersion = argRef && argRef !== "latest" ? argRef : null
		if (!newVersion) {
			try {
				newVersion = this.execCapture(`git rev-parse ${target}`)
			} catch {
				newVersion = cfg.version || target
			}
		}

		this.saveConfig({ version: newVersion })

		console.log("[Magix] Update complete.")
		console.log("  new version:", newVersion)
		console.log("  remember to commit the .core changes.")
	}
}

MagixCommand.run(UpdateCommand)
