import path from 'node:path'
import cors from "cors"
import chalk from "chalk"
import type { Response } from "express"

type ResponseContext = Response & {
	__start?: number
	__prefix?: string
}

export class AppServer {
	private readonly prefix = "AppServer"
	private loaded: boolean = false;

	constructor() {
		this.configure()
		this.listen()
		this.initialize()
	}

	async initialize() {
		if (!api.DB.isConfigured()) {
			api.Log("Database not configured", this.prefix, "warning")
		}

		await api.Router.discoverRoutes(['.core/routes', 'src/routes'])

		api.Router.getAll().forEach(({ method, path }: any) =>
			api.Log(`${method} ${path}`, api.Router.prefix)
		)

		this.loaded = true;
	}

	configure = () => {
		api.Express.disable("x-powered-by")
		api.Express.set("trust proxy", 1)

		const parseList = (value: string) =>
			value
				.split(",")
				.map((item) => item.trim())
				.filter((item) => item.length > 0)

		const appOrigins = parseList(api.Config("APP_URL"))
		const webOrigins = parseList(api.Config("WEB_URL"))
		const explicitOrigins = [...appOrigins, ...webOrigins]
		const corsDomainWhitelist = parseList(api.Config("CORS_DOMAIN_WHITELIST"))

		const parseHostname = (value: string) => {
			try {
				return new URL(value).hostname
			} catch (_) {
				try {
					return new URL(`http://${value}`).hostname
				} catch (_) {
					return value.includes(".") ? value : null
				}
			}
		}

		const allowedHostnames = Array.from(new Set([
			...explicitOrigins,
			...corsDomainWhitelist,
		]))
			.map((value) => parseHostname(value))
			.filter((value): value is string => Boolean(value))
		api.Express.use(
			cors({
				credentials: true,
				methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
				allowedHeaders: [
					"Content-Type",
					"Authorization",
					"X-CSRF-Token",
					"X-Requested-With",
					"X-Device-Id",
				],
				origin: (origin, callback) => {
					if (explicitOrigins.length === 0) {
						callback(null, true)
						return
					}
					if (!origin) {
						callback(null, true)
						return
					}
					if (explicitOrigins.includes(origin)) {
						callback(null, true)
						return
					}

					try {
						const hostname = new URL(origin).hostname
						if (allowedHostnames.includes(hostname)) {
							callback(null, true)
							return
						}
					} catch (_) { }

					callback(new Error(`Origin ${origin} not allowed`))
				},
			})
		)

		api.Express.use(api.$Express.json({
			verify: (req: any, _res: any, buf: Buffer) => {
				// Store raw body for webhook signature verification
				req.rawBody = buf.toString()
			}
		}))
		api.Express.use(api.$Express.urlencoded({ extended: true }))

		// Enable uploads directory serving
		const uploadsDir = path.join(process.cwd(), (api.Config('FS_UPLOAD_DIR') || '/uploads'))
		api.Express.use(`/static/${api.Config('FS_UPLOAD_DIR')}`, api.$Express.static(uploadsDir))

		// request logging (pre-route)
		api.Express.use((req, res, next) => {
			const scopedRes = res as ResponseContext
			scopedRes.__start = Date.now()
			scopedRes.__prefix = this.prefix
			next()
		})
	}

	listen = () => {
		const parseList = (value: string) =>
			value.split(",").map((item) => item.trim()).filter((item) => item.length > 0)

		const formatUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`)

		const logOriginGroup = (label: string, urls: string[], painter: (value: string) => string) => {
			if (!urls.length) return
			console.log(chalk.gray(`| ${chalk.whiteBright(`${label}: `)}`))
			urls.forEach((url) => {
				console.log(
					chalk.gray(`| ${chalk.gray(`➜  Listening on`)}: ${painter(formatUrl(url))}`)
				)
			})
			console.log(chalk.gray(`| `))
		}

		const electronOrigins = parseList(api.Config("APP_URL"))
		const webOrigins = parseList(api.Config("WEB_URL"))

		if (!this.loaded) {
			console.log(chalk.gray(` `))
			console.log(chalk.gray(` `))
			console.log(chalk.gray(` ----------------------------------------------`))
			console.log(chalk.gray(`| ${chalk.whiteBright(`LOADING API: `)}`))
			console.log(chalk.gray(` ----------------------------------------------`))
			console.log(chalk.gray(` `))

			return setTimeout(() => {
				this.listen();
			}, 200);
		}

		this.loaded = true;

		api.Express.listen(api.Config("PORT"), () => {
			// Create fancy title
			let appColor = api.Config("APP_COLOR") || "#813eceff"
			let appColorSecondary = api.Config("APP_COLOR_SECONDARY") || "#a777dfff"
			let tagLine = api.Config("APP_TAGLINE") || ""
			let title = api.Config("APP_NAME") || "Project unnamed"
			let titleSpaces = ""
			const emoji = "♦" // ♦

			// Add flame emoji in the middle based on space
			if (title.includes(" ")) {
				const parts = title.split(" ")
				const midIndex = Math.floor(parts.length / 2)
				parts.splice(midIndex, 0, emoji)
				title = parts.join(" ")
			} else {
				title = `${emoji} ${title} ${emoji}`
			}

			title = title.toLocaleUpperCase()

			// Add space between letters EXCEPT emoji
			const chars = Array.from(title)
			title = chars
				.map((char, index) => {
					if (char === emoji) return `${char} `
					if (index === chars.length - 1) return char
					return `${char} `
				})
				.join('')

			title = `  ${title}  `
			const titleWidth = title.length
			titleSpaces = ' '.repeat(titleWidth)
			title = title.replaceAll(emoji, chalk.hex(appColorSecondary).bold(emoji))

			tagLine = tagLine.trim()
			const totalSpaces = Math.max(0, titleWidth - tagLine.length)
			const leftSpaces = Math.floor(totalSpaces / 2)
			const rightSpaces = totalSpaces - leftSpaces

			tagLine = `${' '.repeat(leftSpaces)}${tagLine}${' '.repeat(rightSpaces)}`


			// italic and light purple
			tagLine = chalk.hex(appColorSecondary).italic(tagLine)

			// Start output
			const fancyTitle = chalk.bgHex(appColor).hex('#fdf4ff').bold(title)
			const fancyTitleSpace = chalk.bgHex(appColor).hex('#fdf4ff').bold(titleSpaces)

			console.log(chalk.gray(` `))
			console.log(chalk.gray(` `))
			console.log(chalk.gray(` ----------------------------------------------`))

			console.log(chalk.gray(`| `))
			console.log(chalk.gray(`| ${fancyTitleSpace}`))
			console.log(chalk.gray(`| ${fancyTitle}`))
			console.log(chalk.gray(`| ${fancyTitleSpace}`))
			console.log(chalk.gray(`| `))
			console.log(chalk.gray(`| ${tagLine}`))
			console.log(chalk.gray(`| `))
			console.log(chalk.gray(`| `))

			console.log(chalk.gray(`| ${chalk.whiteBright(`REST API: `)}`))
			console.log(
				chalk.gray(`| ${chalk.gray(`➜  Listening on`)}: ${chalk.cyanBright(
					`http://localhost:${api.Config("PORT")}${api.Config("API_BASE_PATH")}`
				)}`)
			)

			console.log(chalk.gray(`| `))
			console.log(chalk.gray(`| ${chalk.whiteBright(`API WebSocket: `)}`))
			if (api.WS.enabled) {
				console.log(chalk.gray(`| ${chalk.gray(`Status`)}: ${chalk.greenBright(`ENABLED`)}`))
				console.log(chalk.gray(`| ${chalk.gray(`➜  Listening on`)}: ${chalk.greenBright(api.WS.url)}`))
			}
			else {
				console.log(chalk.gray(`| ${chalk.gray(`Status`)}: ${chalk.redBright(`DISABLED`)}`))
			}

			console.log(chalk.gray(`| `))
			logOriginGroup("Desktop / Mobile App" + (electronOrigins.length > 1 ? 's' : ''), electronOrigins, chalk.magentaBright)
			logOriginGroup("Web App" + (webOrigins.length > 1 ? 's' : ''), webOrigins, chalk.blueBright)
			console.log(chalk.gray(` ----------------------------------------------`))
			console.log(chalk.gray(` `))
			console.log(chalk.gray(` `))
		})
	}
}
