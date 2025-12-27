import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(utc)

export const nowUtcDateTime = () => dayjs().utc().format("YYYY-MM-DD HH:mm:ss")

export const formatUtcDateTime = (value: Date | string | number) =>
	dayjs(value).utc().format("YYYY-MM-DD HH:mm:ss")

export const extractInsertId = (result: any): number | null => {
	const raw = result?.insertId ?? result?.insertedId
	if (typeof raw === "bigint") return Number(raw)
	if (typeof raw === "number") return raw
	return null
}
