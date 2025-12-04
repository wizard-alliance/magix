import chalk from "chalk"
import type { ChalkInstance } from "chalk"

export type LogLevel = "default" | "warning" | "error" | "success"

export type logData = {
	message: string
	prefix?: string
	type?: LogLevel
}

export const typeColors: Record<LogLevel, ChalkInstance> = {
	default: chalk.gray,
	warning: chalk.yellow,
	error: chalk.red,
	success: chalk.green,
}

export const LogData = (message: string, prefix = "", type: LogLevel = "default") : logData => {
	prefix = prefix ? chalk.white(`[API → ${prefix}]`) : ""
	message = type === "default" ? chalk.gray(message) : message
	message = message.charAt(0).toUpperCase() + message.slice(1)

	const coloredType =
		type !== "default" ? (typeColors[type] ?? typeColors.default)(`[${type}]`) : ""
	let content = `${prefix} ${coloredType} ${message}`

	// grey timestamp prefix
	const time = new Date().toISOString().substr(11, 8)
	content = chalk.gray(`[${time}] `) + content

	content = content.trim().replace(/\s+/g, " ").trim()

	return <logData>{ message: content, prefix, type }
}


export const Log = (message: string, prefix = "", type: LogLevel = "default") => {
	const data = LogData(message, prefix, type)

	// eslint-disable-next-line no-console
	if (type === "error") console.error(data.message)
	else if (type === "warning") console.warn(data.message)
	else console.log(data.message)
}


// Throw a new error with the help of logger
export const ThrowError = (message: string, prefix = "") => {
	Log(message, prefix, "error")
}

export const ThrowWarning = (message: string, prefix = "") => {
	Log(message, prefix, "warning")
}

export const SuccessLog = (message: string, prefix = "") => {
	Log(message, prefix, "success")
}