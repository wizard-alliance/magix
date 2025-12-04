// .magic/info.mjs
import { MagixCommand } from "../MagixCommand.mjs"

class InfoCommand extends MagixCommand {
	run() {
		const cfg = this.getConfig()

		console.log("[Magix] Info\n")

		console.log("boilerplate.json:")
		if (cfg) {
			console.log(JSON.stringify(cfg, null, 2))
		} else {
			console.log("  (no .boilerplate.json found)")
		}
		console.log("")

		console.log("git remotes:")
		try {
			this.exec("git remote -v")
		} catch {
			console.log("  (no git remotes?)")
		}
		console.log("")

		console.log("git status:")
		try {
			this.exec("git status -sb")
		} catch {
			console.log("  (not a git repo?)")
		}
		console.log("")

		if (cfg && cfg.branch) {
			console.log("core diff vs boilerplate:")
			try {
				this.exec(`git diff --stat boilerplate/${cfg.branch} -- api/.core app/.core electron/.core`)
			} catch {
				console.log("  (could not diff core against boilerplate)")
			}
			console.log("")
		}
	}
}

MagixCommand.run(InfoCommand)
