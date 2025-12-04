import nodemailer from "nodemailer"

export class MailService {
	private readonly tableName = ""
	private readonly prefix = "MailService"

	getSmtpConfig = () => {
		return {
			host: api.Config("SMTP_HOST"),
			port: Number(api.Config("SMTP_PORT")),
			user: api.Config("SMTP_USER"),
			password: api.Config("SMTP_PASSWORD"),
			secure: api.Config("SMTP_SECURE") === "true",
		}
	}

	isConfigured = () => {
		const config = this.getSmtpConfig()
		return (
			config.host !== "" && config.user !== "" && config.password !== ""
		)
	}

	private createTransport() {
		const config = this.getSmtpConfig()

		return nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth:
				config.user !== ""
					? {
						user: config.user,
						pass: config.password,
					}
					: undefined,
		})
	}

	async sendTest(to: string) {
		if (!this.isConfigured()) {
			api.Log("SMTP transport is not configured", this.prefix, "error")
			throw new Error("SMTP transport is not configured")
		}

		const transporter = this.createTransport()
		const sender = this.getSmtpConfig().user
		api.Log(`Sending test email to ${to}`, this.prefix)
		return transporter.sendMail({
			to,
			from: sender === "" ? to : sender,
			subject: "SMTP check",
			text: "This is a test message dispatched by MailService.",
		})
	}
}
