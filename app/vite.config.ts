import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type Logger, type Plugin } from "vite"
import { resolve } from "node:path"
import { config as loadEnv } from 'dotenv'
import devtoolsJson from 'vite-plugin-devtools-json'
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator"

loadEnv()
const devPort = Number(process.env.DEV_PORT || process.env.VITE_DEV_PORT || process.env.PORT || 5173)

type ClearScreenArg = Parameters<Logger["clearScreen"]>[0]

function suppressSassLegacyWarning(): Plugin {
	let originalWarn: typeof console.warn | undefined

	const restore = () => {
		if (!originalWarn) return
		console.warn = originalWarn
		originalWarn = undefined
	}

	return {
		name: "suppress-sass-legacy-warning",
		enforce: "pre",
		configResolved() {
			if (originalWarn) return
			originalWarn = console.warn
			console.warn = (message?: unknown, ...args: unknown[]) => {
				if (
					typeof message === "string" &&
					message.includes("legacy-js-api")
				)
					return
				originalWarn?.(message, ...args)
			}
		},
		buildEnd: restore,
		closeBundle: restore,
		configureServer(server) {
			server.httpServer?.once("close", restore)
		},
	}
}

function suppressViteBanner(): Plugin {
	let originalInfo: Logger["info"] | undefined
	let originalClear: Logger["clearScreen"] | undefined

	const shouldHide = (message?: unknown) => {
		if (typeof message !== "string") return false
		const patterns = [
			"ready in",
			"Local:",
			"➜",
			"press",
		]
		return patterns.some(pattern => message.includes(pattern))
	}

	return {
		name: "suppress-vite-banner",
		apply: "serve",
		configureServer(server) {
			if (originalInfo || originalClear) return
			originalInfo = server.config.logger.info
			originalClear = server.config.logger.clearScreen
			server.config.logger.clearScreen = (type?: ClearScreenArg) => { }
			server.config.logger.info = (message, ...args) => {
				if (shouldHide(message)) return
				originalInfo?.(message, ...args)
			}
			server.httpServer?.once("close", () => {
				if (originalInfo) server.config.logger.info = originalInfo
				if (originalClear) server.config.logger.clearScreen = originalClear
				originalInfo = undefined
				originalClear = undefined
			})
		},
	}
}

export default defineConfig({
	plugins: [
		sveltekit(),
		devtoolsJson(),
		suppressSassLegacyWarning(),
		// suppressViteBanner(),
		obfuscatorPlugin({
			apply: "build",
			exclude: [/node_modules/, /\.svelte-kit/],
			options: {
				compact: true,
				controlFlowFlattening: true,
				deadCodeInjection: true,
				stringArray: true,
				stringArrayEncoding: ["base64"],
				stringArrayThreshold: 0.75,
			},
		}),
	],
	build: {
		sourcemap: false,
	},
	resolve: {
		alias: {
			$lib: resolve("./src/lib"),
			$styles: resolve("./src/styles"),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			} as Record<string, unknown>
		}
	},
	server: {
		port: devPort,
		strictPort: true
	}
})