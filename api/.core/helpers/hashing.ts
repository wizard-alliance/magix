import { createHash, pbkdf2, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"

const pbkdf2Async = promisify(pbkdf2)

const iterations = (() => {
	const raw = process.env.PBKDF2_ITERATIONS ?? "1337000"
	const parsed = Number(raw)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return 1337000
	}
	return Math.max(10000, Math.floor(parsed))
})()

const deriveHash = (value: string, salt: string, rounds: number) =>
	pbkdf2Sync(value, salt, rounds, 64, "sha512").toString("hex")

export const hashPassword = async (value: string) => {
	const salt = randomBytes(24).toString("hex")
	const derived = await pbkdf2Async(value, salt, iterations, 64, "sha512")
	const hash = derived.toString("hex")
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


export const generateHash = (input: any): string => {
	const hash = createHash('sha256')
	hash.update(JSON.stringify(input))
	return hash.digest('hex')
}