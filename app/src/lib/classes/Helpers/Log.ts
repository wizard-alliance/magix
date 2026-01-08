import type { LogLevel } from "$lib/types/types"

const levelColors: Record<LogLevel, string> = {
	default: "#9ca3af", // gray-400
	warning: "#f59e0b", // amber-500
	error: "#ef4444", // red-500
	success: "#22c55e", // green-500
};


export const Log = (message: string, prefix = "", type: LogLevel = "default") => {
	const time = new Date().toISOString().substr(11, 8);

	const tsSeg = `%c[${time}]`;
	const tsStyle = "color:#6b7280"; // gray-500

	const prefixSeg = prefix ? `%c[App → ${prefix}]` : "";
	const prefixStyle = "color:#ffffff";

	const typeSeg = type !== "default" ? `%c[${type}]` : "";
	const typeStyle = `color:${levelColors[type]}`;

	const parts = [tsSeg];
	const styles: string[] = [tsStyle];

	if (prefixSeg) {
		parts.push(prefixSeg);
		styles.push(prefixStyle);
	}
	if (typeSeg) {
		parts.push(typeSeg);
		styles.push(typeStyle);
	}

	// Capitalize first letter of message to match server formatting
	const normalized = message.charAt(0).toUpperCase() + message.slice(1);
	parts.push(normalized);

	const text = parts.join(" ").replace(/\s+/g, " ").trim();

	if (type === "error") console.error(text, ...styles);
	else if (type === "warning") console.warn(text, ...styles);
	else console.log(text, ...styles);
}

export const ErrorLog = (message: string, prefix = "") => {
	return Log(message, prefix, "error");
}

export const WarningLog = (message: string, prefix = "") => {
	return Log(message, prefix, "warning");
}

export const SuccessLog = (message: string, prefix = "") => {
	return Log(message, prefix, "success");
}