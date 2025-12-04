import { hashPassword, verifyPassword } from "./hashing.js"

export class PasswordHasher {
	hash = (value: string) => hashPassword(value)

	verify = (value: string, digest: string) => verifyPassword(value, digest)
}
