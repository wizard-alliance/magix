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

api.Router.set("GET", "dev/parentz/test3", cb, { protected: false, register: false });

api.Router.register()