import api from '@api/core'
import dayjs from 'dayjs'

const cb = ($: any, req: Request, res: Response) => {
	return {
		weeee: true,
		sanitizedParams: api.Router.getParams(req, 'settings')
	}
}

api.Router.set("GET", "user/:id/settings", cb, {
	protected: true,
	tableName: "user_settings",
	perms: ["user", "user.edit.self", "user.edit.self.settings"],
	register: true,
	params: [{ id: "number" }, { slug: "string" }]
})

api.User.Auth.permissions.grant(93, [
	"administrator", 
	"user.manage", 
	"user.view", 
	"user.edit", 
	"user.delete",
])

// api.Mail.test("user@example.com")
// api.Mail.test("user@example.com", "welcome")
// api.Mail.test("user@example.com", "password-reset")
// api.Mail.test("user@example.com", "verify-email")