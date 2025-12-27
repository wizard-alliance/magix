import api from '@api/core'

const cb = ($: any, req: Request, res: Response) => {
	return {
		weeee: true,
		sanitizedParams: api.Router.getParams(req, 'settings')
	}
}

api.Router.set("GET", "user/:id/settings", cb, {
	protected: true,
	tableName: "user_settings",
	perms: ["user", "edit_self", "edit_self_settings"],
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