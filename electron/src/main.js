import { app, BrowserWindow, dialog } from "electron"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { appendFileSync, mkdirSync, existsSync } from "node:fs"

// Determine environment mode
let DEBUG = process.env.NODE_ENV === "debug"
if(DEBUG || app.isPackaged) { process.env.NODE_ENV = "production" }
let NODE_ENV = (process.env.NODE_ENV || "production").toLowerCase().trim()
const isDev = !app.isPackaged && NODE_ENV !== "production"

// Define important paths
const filePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(filePath)
const repoRoot = path.resolve(currentDir, "..", "..")
const appDir = path.resolve(repoRoot, "app")
const packagedAppDist = path.resolve(process.resourcesPath ?? "", "app-dist")
const runtimeRoot = app.isPackaged ? path.dirname(process.execPath) : path.resolve(currentDir, "..")
const debugFlagPath = path.resolve(runtimeRoot, ".debug")
if (!DEBUG && existsSync(debugFlagPath)) {
	DEBUG = true
}
const logsDir = path.resolve(runtimeRoot, "logs")
const logFile = path.resolve(logsDir, "app.log")

try {
	mkdirSync(logsDir, { recursive: true })
} catch (_) {}

const formatArg = (arg) => {
	if (typeof arg === "string") {
		try {
			const parsed = JSON.parse(arg)
			if (typeof parsed === "object" && parsed !== null) return `\n${JSON.stringify(parsed, null, 2)}`
		} catch (_) {}
		return arg
	}
	if (typeof arg === "object" && arg !== null) {
		try {
			return `\n${JSON.stringify(arg, null, 2)}`
		} catch (_) {
			return String(arg)
		}
	}
	try {
		return JSON.stringify(arg)
	} catch (_) {
		return String(arg)
	}
}

const writeLog = (...args) => {
	const line = `[${new Date().toISOString()}] ${args.map(formatArg).join(" ")}`
	console.log(line)
	try { appendFileSync(logFile, `${line}\n`) } catch (_) {}
}

const log = (...args) => {
	if(!DEBUG) return
	writeLog(...args)
}

const forceLog = (...args) => {
	writeLog(...args)
}


const host = process.env.APP_HOST || "localhost"
const defaultPort = isDev ? 5173 : 4173
const port = Number(process.env.APP_PORT || process.env.PORT || defaultPort)
const appUrl = process.env.APP_URL || `http://${host}:${port}`

let serverProcess
let serverModule
let mainWindow
let originalCwd

forceLog("App state: ", {
	NODE_ENV : NODE_ENV,
	DEBUG : DEBUG,
	logsDir : logsDir,
	port : port,
	appUrl : appUrl,
	host : host,
	enableLogging : DEBUG,
	logsDir: logsDir
})

log("Development Logs directory ready at", logsDir)


const ensurePath = (target, label) => {
	if (existsSync(target)) return
	const message = `${label} missing at ${target}`
	log(message)
	throw new Error(message)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForServer = async () => {
	const maxAttempts = 60
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		try {
			const response = await fetch(appUrl, { method: "HEAD", redirect: "manual" })
			log("Server responded", response.status)
			return
		} catch (error) {
			log("Waiting for server...", error.message)
		}

		await wait(500)
	}

	throw new Error(`App server is unavailable at ${appUrl}`)
}

const getAppDistDir = () => (app.isPackaged ? packagedAppDist : path.resolve(appDir, ".dist"))

const startProdServer = async () => {
	const distDir = getAppDistDir()
	const entryFile = path.join(distDir, "index.js")
	ensurePath(distDir, "App build directory")
	ensurePath(entryFile, "App entry file")

	if (app.isPackaged) {
		originalCwd = process.cwd()
		process.chdir(distDir)
		process.env.PORT = `${port}`
		process.env.HOST = host

		if (DEBUG) {
			process.env.VITE_SSR_DEBUG = "stack"
			process.env.SVELTEKIT_DEV = "true"
			log("Development error mode enabled")
		} else {
			delete process.env.VITE_SSR_DEBUG
			delete process.env.SVELTEKIT_DEV
			log("Production error mode enabled")
		}

		try {
			log("Importing server module", entryFile)
			serverModule = await import(pathToFileURL(entryFile).href)
			log("Server module loaded")
			if (serverModule.port) log("Server configured port", serverModule.port)
			if (serverModule.server?.server) {
				serverModule.server.server.on("listening", () => {
					const address = serverModule.server.server.address()
					log("Svelte server listening", JSON.stringify(address))
				})
				serverModule.server.server.on("error", (error) => {
					log("Svelte server error", error.stack || error.message)
				})
			}
			return serverModule
		} catch (error) {
			console.error("Failed to boot bundled app server", error)
			log("Failed to boot server", error.stack || error.message)
			if (originalCwd) process.chdir(originalCwd)
			originalCwd = undefined
			throw error
		}
	}

	const child = spawn("node", [entryFile], {
		cwd: distDir,
		env: { ...process.env, NODE_ENV: "production", PORT: `${port}` },
		stdio: "inherit",
	})

	child.on("exit", (code) => {
		if (!app.isReady()) return
		if (code && code !== 0) {
			console.error(`App server exited with code ${code}`)
			log("Server process exited", `${code}`)
			app.quit()
		}
	})

	child.on("error", (error) => {
		console.error("Failed to launch app server", error)
		log("Failed to launch server process", error.stack || error.message)
		app.quit()
	})

	return child
}

const cleanupServer = () => {
	if (serverProcess && "kill" in serverProcess && !serverProcess.killed) serverProcess.kill()

	if (serverModule?.server?.server) {
		try {
			serverModule.server.server.close()
		} catch (error) {
			console.error("Failed to stop bundled app server", error)
			log("Failed to stop server", error.stack || error.message)
		}
		serverModule = undefined
	}

	if (originalCwd) {
		process.chdir(originalCwd)
		originalCwd = undefined
	}

	serverProcess = undefined
}

const createWindow = async () => {
	log("Waiting for HTTP server at", appUrl)
	await waitForServer()
	log("Creating browser window")

	const window = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 640,
		backgroundColor: "#050505",
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
		},
	})

	log("Loading app URL", appUrl)
	await window.loadURL(appUrl)
	log("App URL loaded")

	if (isDev || DEBUG) window.webContents.openDevTools({ mode: "detach" })
	else log("Running in packaged mode, devtools disabled")

	return window
}

log("Electron App starting", `env=${NODE_ENV}`)

app.whenReady().then(async () => {
	try {
		if (!isDev) serverProcess = await startProdServer()
		log("Server started, building window")
		mainWindow = await createWindow()
		log("Window created successfully")
	} catch (error) {
		console.error("Failed to start application window", error)
		log("Failed to start window", error.stack || error.message)
		dialog.showErrorBox("App", `Failed to start local server: ${error.message}`)
		app.quit()
		return
	}

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on("window-all-closed", () => {
	cleanupServer()
	if (process.platform !== "darwin") app.quit()
})

app.on("before-quit", cleanupServer)

process.on("exit", cleanupServer)

process.on("SIGINT", () => {
	cleanupServer()
	process.exit(0)
})

process.on("SIGTERM", () => {
	cleanupServer()
	process.exit(0)
})
