import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto"

const iterations = (() => {
	const raw = process.env.BCRYPT_ROUNDS ?? "12"
	const parsed = Number(raw)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return 12
	}
	return Math.max(1, Math.floor(parsed))
})()

const deriveHash = (value: string, salt: string, rounds: number) =>
	pbkdf2Sync(value, salt, rounds, 64, "sha512").toString("hex")

export const hashPassword = async (value: string) => {
	const salt = randomBytes(16).toString("hex")
	const hash = deriveHash(value, salt, iterations)
	return `pbkdf2$${iterations}$${salt}$${hash}`
}

export const verifyPassword = async (value: string, digest: string) => {
	if (!digest || typeof digest !== "string") {
		return false
	}
	const [scheme, roundsRaw, salt, stored] = digest.split("$")
	if (scheme !== "pbkdf2" || !salt || !stored) {
		return false
	}
	const rounds = Number(roundsRaw)
	if (!Number.isFinite(rounds) || rounds <= 0) {
		return false
	}
	const computed = deriveHash(value, salt, Math.floor(rounds))
	const safeStored = Buffer.from(stored, "hex")
	const safeComputed = Buffer.from(computed, "hex")
	if (safeStored.length !== safeComputed.length) {
		return false
	}
	return timingSafeEqual(safeStored, safeComputed)
}
