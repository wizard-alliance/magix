// .magic/resolve-streams.mjs
import { MagixCommand } from "../MagixCommand.mjs"

class ResolveStreamsCommand extends MagixCommand {
	run() {
		const cfg = this.requireConfig()
		const boilerplateUrl = cfg.remote
		const branch = cfg.branch || "main"

		console.log("[Magix] Resolving remotes / streams...")

		// Ensure boilerplate remote
		try {
			this.exec("git remote get-url boilerplate", { stdio: "ignore" })
			this.exec(`git remote set-url boilerplate ${boilerplateUrl}`)
		} catch {
			this.exec(`git remote add boilerplate ${boilerplateUrl}`)
		}

		// Ensure origin exists (can't auto-guess URL here)
		try {
			this.exec("git remote get-url origin", { stdio: "ignore" })
		} catch {
			console.warn("[Magix] WARNING: origin remote missing. Add it manually: git remote add origin <url>")
		}

		// Ensure branch tracks origin/<branch>
		const currentBranch = this.getCurrentBranch()
		try {
			this.exec(`git branch --set-upstream-to=origin/${branch} ${currentBranch}`)
		} catch {
			console.warn(`[Magix] WARNING: could not set upstream to origin/${branch}. Check your branches.`)
		}

		console.log("[Magix] Remotes / streams resolved.")
	}
}

MagixCommand.run(ResolveStreamsCommand)
