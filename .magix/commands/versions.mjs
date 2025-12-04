// .magic/versions.mjs
import { MagixCommand } from "../MagixCommand.mjs"

class VersionsCommand extends MagixCommand {
	run() {
		const cfg = this.getConfig()
		const current = cfg?.version || "(unknown)"

		try {
			this.exec("git fetch boilerplate --tags")
		} catch {
			// ignore
		}

		let tags = ""
		try {
			tags = this.execCapture('git tag --list "v*"')
		} catch {
			tags = ""
		}

		console.log("[Magix] Boilerplate versions")
		console.log("  current:", current)
		console.log("  remote: ", cfg?.remote || "(unknown)")
		console.log("")

		if (!tags.trim()) {
			console.log("No v* tags found. Use git tags or branches directly.")
			return
		}

		console.log("Available tags:")
		for (const line of tags.split("\n")) {
			const mark = line.trim() === current ? "*" : " "
			console.log(` ${mark} ${line.trim()}`)
		}
	}
}

MagixCommand.run(VersionsCommand)
