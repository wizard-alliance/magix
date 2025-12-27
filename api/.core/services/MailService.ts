import nodemailer from "nodemailer"
import { readFileSync, readdirSync, existsSync } from "fs"
import { join, basename } from "path"
import { randomUUID } from "crypto"

type EmailRecipient = string | string[]

type SendOptions = {
	id?: string
	to: EmailRecipient
	cc?: EmailRecipient
	bcc?: EmailRecipient
	subject: string
	template?: string
	text?: string
	html?: string
	data?: Record<string, any>
	schedule?: Date | null
}

type ScheduledEmail = {
	id: string
	options: SendOptions
	scheduledFor: Date
	createdAt: Date
}

type SendResult = {
	success: boolean
	id?: string
	scheduled?: boolean
	error?: string
}

export class MailService {
	private readonly prefix = "Mail"
	private readonly templateDirs = [
		join(process.cwd(), ".core/templates/email"),
		join(process.cwd(), "src/templates/email"),
	]
	private templates = new Map<string, string>()
	private layout: string | null = null
	private scheduled = new Map<string, ScheduledEmail>()
	private tickUnsubscribe: (() => void) | null = null

	constructor() {
		this.loadTemplates()
		this.startScheduler()
	}

	/** Load templates from .core and src directories (src overrides .core) */
	private loadTemplates() {
		this.templates.clear()
		this.layout = null
		for (const dir of this.templateDirs) {
			if (!existsSync(dir)) continue
			try {
				const files = readdirSync(dir).filter(f => f.endsWith(".html"))
				for (const file of files) {
					const name = basename(file, ".html")
					const content = readFileSync(join(dir, file), "utf-8")
					if (name === "_layout") {
						this.layout = content
						api.Log(`Loaded layout from ${dir}`, this.prefix)
					} else {
						this.templates.set(name, content)
						api.Log(`Loaded template: ${name}`, this.prefix)
					}
				}
			} catch (err) {
				api.Warning(`Failed to read templates from ${dir}`, this.prefix)
			}
		}
	}

	/** Parse template variables: {{var.path}} or {{var.path, 'fallback'}} */
	private parseTemplate(template: string, data: Record<string, any> = {}): string {
		return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
			const [path, fallback] = expr.split(",").map((s: string) => s.trim())
			const value = this.getNestedValue(data, path)
			if (value !== undefined && value !== null) return String(value)
			if (fallback) return fallback.replace(/^['"]|['"]$/g, "")
			return ""
		})
	}

	/** Get nested value from object by dot path */
	private getNestedValue(obj: Record<string, any>, path: string): any {
		return path.split(".").reduce((acc, key) => acc?.[key], obj)
	}

	/** Normalize recipient to array */
	private normalizeRecipient(value?: EmailRecipient): string[] {
		if (!value) return []
		return Array.isArray(value) ? value : [value]
	}

	/** Start scheduler tick */
	private startScheduler() {
		if (typeof api?.Tickrate?.Event !== "function") return
		this.tickUnsubscribe = api.Tickrate.Event("tick:1min", () => this.processScheduled())
	}

	/** Process scheduled emails */
	private async processScheduled() {
		const now = Date.now()
		for (const [id, email] of this.scheduled) {
			if (email.scheduledFor.getTime() <= now) {
				this.scheduled.delete(id)
				const result = await this.sendNow({ ...email.options, schedule: null })
				if (result.success) {
					api.Success(`Scheduled email sent: ${id}`, this.prefix)
				} else {
					api.Warning(`Scheduled email failed: ${id} - ${result.error}`, this.prefix)
				}
			}
		}
	}

	/** SMTP config from env */
	private getConfig() {
		const port = Number(api.Config("SMTP_PORT") || 587)
		const secureEnv = api.Config("SMTP_SECURE")
		// Auto-detect: port 465 = SSL, 587/25 = STARTTLS
		const secure = secureEnv !== undefined && secureEnv !== ""
			? secureEnv == "true"
			: port === 465

		return {
			host: api.Config("SMTP_HOST") ?? "",
			port,
			user: api.Config("SMTP_USER") ?? "",
			password: api.Config("SMTP_PASSWORD") ?? "",
			secure,
			from: api.Config("SMTP_FROM") || api.Config("SMTP_USER") || "",
		}
	}

	/** Create nodemailer transport */
	private createTransport() {
		const config = this.getConfig()
		return nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: config.user ? { user: config.user, pass: config.password } : undefined,
		})
	}

	/** Check if SMTP is configured */
	isConfigured = (): boolean => {
		const config = this.getConfig()
		return !!(config.host && config.user && config.password)
	}

	/** Get list of available templates */
	getTemplates = (): string[] => {
		return Array.from(this.templates.keys())
	}

	/** Reload templates from disk */
	reloadTemplates = () => {
		this.loadTemplates()
		return this.getTemplates()
	}

	/** Get scheduled emails */
	getScheduled = (id?: string): ScheduledEmail | ScheduledEmail[] | null => {
		if (id) return this.scheduled.get(id) ?? null
		return Array.from(this.scheduled.values())
	}

	/** Cancel a scheduled email */
	unschedule = (id: string): boolean => {
		return this.scheduled.delete(id)
	}

	/** Strip alpha from 8-char hex colors (email clients don't support them) */
	private normalizeColor(color: string): string {
		if (color.startsWith("#") && color.length === 9) {
			return color.slice(0, 7)
		}
		return color
	}

	/** Build template data with app defaults */
	private buildTemplateData(options: SendOptions) {
		const color = this.normalizeColor(api.Config("APP_COLOR") || "#813ece")
		const colorSecondary = this.normalizeColor(api.Config("APP_COLOR_SECONDARY") || "#a777df")
		// Filter out undefined values from options.data.app so they don't override defaults
		const appOverrides = options.data?.app || {}
		const filteredAppOverrides = Object.fromEntries(
			Object.entries(appOverrides).filter(([_, v]) => v !== undefined && v !== null && v !== "")
		)
		return {
			...options.data,
			subject: options.subject,
			year: new Date().getFullYear(),
			app: {
				name: api.Config("APP_NAME") || "MagiX",
				tagline: api.Config("APP_TAGLINE") || "",
				color,
				colorSecondary,
				...filteredAppOverrides,
			},
		}
	}

	/** Wrap content in layout if available */
	private wrapInLayout(content: string, data: Record<string, any>): string {
		if (!this.layout) return content
		return this.parseTemplate(this.layout, { ...data, content })
	}

	/** Send email immediately */
	private async sendNow(options: SendOptions): Promise<SendResult> {
		if (!this.isConfigured()) {
			return { success: false, error: "SMTP not configured" }
		}

		const config = this.getConfig()
		const templateData = this.buildTemplateData(options)
		let html = options.html
		let text = options.text

		// Load template if specified
		if (options.template) {
			const templateContent = this.templates.get(options.template)
			if (!templateContent) {
				return { success: false, error: `Template not found: ${options.template}` }
			}
			const parsed = this.parseTemplate(templateContent, templateData)
			html = this.wrapInLayout(parsed, templateData)
		}
		// Use default template if text provided but no template/html
		else if (text && !html && this.templates.has("default")) {
			const defaultTemplate = this.templates.get("default")!
			const parsedContent = this.parseTemplate(text, templateData)
			const parsed = this.parseTemplate(defaultTemplate, { ...templateData, content: parsedContent })
			html = this.wrapInLayout(parsed, templateData)
		}
		// Wrap raw html in layout if provided
		else if (html) {
			html = this.wrapInLayout(html, templateData)
		}

		// Auto-detect: if html provided but no text, strip tags for text version
		if (html && !text) {
			text = html.replace(/<[^>]*>/g, "").trim()
		}

		try {
			const transport = this.createTransport()
			await transport.sendMail({
				from: config.from,
				to: this.normalizeRecipient(options.to).join(", "),
				cc: this.normalizeRecipient(options.cc).join(", ") || undefined,
				bcc: this.normalizeRecipient(options.bcc).join(", ") || undefined,
				subject: options.subject,
				text,
				html,
			})
			api.Success(`Email sent to ${options.to}`, this.prefix)
			return { success: true, id: options.id }
		} catch (err: any) {
			api.Warning(`Failed to send email: ${err.message}`, this.prefix)
			return { success: false, error: err.message }
		}
	}

	/** Main send method - immediate or scheduled */
	send = async (options: SendOptions): Promise<SendResult> => {
		const id = options.id ?? randomUUID()

		// Schedule for later
		if (options.schedule && options.schedule.getTime() > Date.now()) {
			this.scheduled.set(id, {
				id,
				options: { ...options, id },
				scheduledFor: options.schedule,
				createdAt: new Date(),
			})
			api.Log(`Email scheduled: ${id} for ${options.schedule.toISOString()}`, this.prefix)
			return { success: true, id, scheduled: true }
		}

		// Send immediately
		return this.sendNow({ ...options, id })
	}

	/** Send test email */
	test = async (to: string, template?: string): Promise<SendResult> => {
		return this.send({
			to,
			subject: "Test email from " + (api.Config("APP_NAME") || "Magix"),
			template,
			text: template ? undefined : "Hello {{name, 'Admin'}},<br><br>This is a <b>HTML test</b> message dispatched by MailService. 🥳",
			data: {
				name: "Developer",
				user: { name: "Test User" },
				reset: { url: "https://example.com/reset?token=abc123", expiresIn: "1 hour" },
				verify: { url: "https://example.com/verify?token=abc123", expiresIn: "24 hours" },
			},
		})
	}

	/** Alias for send (capital S) */
	Send = this.send
}
