import api from '@api/core';

const cb = ($: any, req: Request, res: Response) => {
	return {
		weeee: true,
		sanitizedParams: api.Router.getParams(req, 'settings')
	};
}


const cbErr = ($: any) => {
	return {
		code: 404,
		// error: true
	};
}


api.Router.set("GET", "dev/test", cb, { protected: false, register: false });

api.Router.set("GET", "dev/test2", cb, { protected: false, register: false });

api.Router.set("GET", "dev/test/:ID", cb, { protected: false, register: false });

api.Router.register()


api.Router.set("GET", "user/:id/settings", cb, {
	protected: true,
	tableName: "user_settings",
	perms: ["user", "edit_self", "edit_self_settings"],
	register: true,
	params: [{ id: "number" }, { slug: "string" }]
})

// Fix User -> Perms class