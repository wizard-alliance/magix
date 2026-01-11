import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(utc)

export const nowUtcDateTime = () => dayjs().utc().format("YYYY-MM-DD HH:mm:ss")

export const futureUtcDateTime = (ms: number) =>
	dayjs().utc().add(ms, "millisecond").format("YYYY-MM-DD HH:mm:ss")

export const formatUtcDateTime = (value: Date | string | number) =>
	dayjs(value).utc().format("YYYY-MM-DD HH:mm:ss")

export const parseUtcDateTimeMs = (value: Date | string | number): number => {
	const ms = dayjs.utc(value).valueOf()
	return Number.isFinite(ms) ? ms : 0
}

export const extractInsertId = (result: any): number | null => {
	const raw = result?.insertId ?? result?.insertedId
	return raw ? Number(raw) : null
}
