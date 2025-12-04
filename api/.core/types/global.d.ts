export {}

declare global {

	interface BigInt {
        toJSON(): Number;
    }
	
	interface ApiGlobal {
		Config: ( key: string ) => string
		Schema: import('../schema/Schema.ts').SchemaType
		Router: import('../controllers/RouteController.ts').RouteController
		Data: import('../controllers/DataManager.ts').DataManager

		Utils: {
			sendSuccess: typeof import('../helpers/ApiResponder.js').sendSuccess
			sendError: typeof import('../helpers/ApiResponder.js').sendError
			maybeJSONString: typeof import('../helpers/Utils.js').maybeJSONString
			maybeJSONDecode: typeof import('../helpers/Utils.js').maybeJSONDecode
			removeKeysDeep: typeof import('../helpers/Utils.js').removeKeysDeep
			removeEmptyValuesDeep: typeof import('../helpers/Utils.js').removeEmptyValuesDeep
			encapsulate: typeof import('../helpers/Utils.js').encapsulate
			splitFromTags: typeof import('../helpers/Text.js').splitFromTags
			convertRecursiveObjToStr: typeof import('../helpers/Obj.js').convertRecursiveObjToStr
			convertObjToStr: typeof import('../helpers/Obj.js').convertObjToStr
			createSlug: typeof import('../helpers/Utils.js').createSlug
		}

		Services: {
			DB: import('../services/DatabaseClient.js').DatabaseClient
			Mail: import('../services/MailService.js').MailService
			Tickrate: import('../services/Tickrate.js').Tickrate
		}

		Auth: import('../services/Auth/AuthService.ts').AuthService
		AI: import('../services/AI.ts').AIManager
		WS: import('../services/WebSocketServer.js').WebSocketServerManager
		
		Log: typeof import('../helpers/Console.js').Log
		Error: typeof import('../helpers/Console.js').Error
		Warning: typeof import('../helpers/Console.js').Warning
		Success: typeof import('../helpers/Console.js').Success
		getParams: (request: import('express').Request) => any
		Logger: import('../helpers/Logger.js').Logger
	}

	var api: ApiGlobal
}
