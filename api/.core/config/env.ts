import "dotenv/config"
import { normalize } from "path"

const resolvedApiBaseUrl = process.env.API_BASE_URL && process.env.API_BASE_URL.length > 0
	? process.env.API_BASE_URL
	: `http://localhost:${process.env.PORT ?? 4000}`

const envDefaults: Record<string, string | number | boolean> = {
	NODE_ENV: "development",

	PORT: 4000,
	API_BASE_URL: resolvedApiBaseUrl,
	APP_URL: resolvedApiBaseUrl,
	WEB_URL: resolvedApiBaseUrl,
	CORS_DOMAIN_WHITELIST: "",

	API_BASE_PATH: "/api",
	API_VERSION: "v1",
	APP_NAME: "Project Magix",
	APP_TAGLINE: "Fullstack Framework + Boilerplate",
	APP_COLOR: "#813eceff",
	APP_COLOR_SECONDARY: "#a777dfff",
	DB_HOST: "",
	DB_PORT: 3306,
	DB_USER: "",
	DB_PASSWORD: "",
	DB_NAME: "",

	SMTP_HOST: "",
	SMTP_PORT: 587,
	SMTP_USER: "",
	SMTP_PASSWORD: "",
	SMTP_SECURE: false,

	FS_UPLOAD_DIR: "uploads",
	FS_IMAGE_SIZES: "128,256,1024,1400",
	FS_BLOCKED_EXTENSIONS: "exe,bat,cmd,sh,msi,dll,com,scr,ps1,vbs,wsf,jar,app,action,csh,inf,reg,lnk,pif,hta",
	BCRYPT_ROUNDS: 12,

	JWT_SECRET: "change-me",
	JWT_ACCESS_AUD: "web",
	JWT_ISS: "api",
	JWT_ACCESS_TTL: "15m",
	JWT_REFRESH_TTL: "30d",

	GOOGLE_CLIENT_ENABLED: false,
	GOOGLE_CLIENT_ID: "",
	GOOGLE_CLIENT_SECRET: "",
	GOOGLE_REDIRECT_URI: "",

	DISCORD_CLIENT_ENABLED: false,
	DISCORD_CLIENT_ID: "",
	DISCORD_CLIENT_SECRET: "",
	DISCORD_REDIRECT_URI: "",

	OPENROUTER_MODEL: 'openai/gpt-4.1',
	OPENROUTER_MAX_TOKENS_SMALL: 5000,
	OPENROUTER_MAX_TOKENS_LARGE: 10000,
	OPENROUTER_TEMPERATURE: 0.7,
	OPENROUTER_ENABLE_VISION_IMAGES: false,
	OPENROUTER_MAX_VISION_IMAGES: 2
}

export const env = {
	...envDefaults,
	...process.env,
}

export const Config = (key: string = ''): string | Record<string, unknown> => {
	const normalizedKey = key.toUpperCase().trim()

	if(normalizedKey === "") {
		return env as Record<string, unknown>
	}

	// Get record from partial match with *
	if (normalizedKey.includes("*")) {
		const regex = new RegExp(`^${normalizedKey.replace(/\*/g, ".*")}$`)
		const matchedKeys = Object.keys(env).filter(k => regex.test(k))
		const result: Record<string, string> = {}
		matchedKeys.forEach(k => {
			result[k] = env[k] as string
		})
		return result
	}

	const envValue = env[normalizedKey]

	if (envValue === undefined) {
		api.Error(`Environment variable ${normalizedKey} is not defined.`, "env")
	}

	return envValue as string
}
