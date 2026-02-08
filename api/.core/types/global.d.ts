export {}

declare global {

	interface BigInt {
        toJSON(): Number;
    }
	
	interface ApiGlobal {
		Config: ( key: string ) => string
		Schema: import('../schema/Schema.ts').SchemaType
		Express: import('express').Express
		$Express: typeof import('express').Express
		Server: import('../servers/AppServer.ts').AppServer

		// Utils
		Log: typeof import('../helpers/Console.js').Log
		Error: typeof import('../helpers/Console.js').Error
		Warning: typeof import('../helpers/Console.js').Warning
		Success: typeof import('../helpers/Console.js').Success
		getParams: (request: import('express').Request) => any
		Logger: import('../helpers/Logger.js').Logger

		Utils: {
			maybeJSONString: typeof import('../helpers/Utils.js').maybeJSONString
			maybeJSONDecode: typeof import('../helpers/Utils.js').maybeJSONDecode
			removeKeysDeep: typeof import('../helpers/Utils.js').removeKeysDeep
			removeEmptyValuesDeep: typeof import('../helpers/Utils.js').removeEmptyValuesDeep
			encapsulate: typeof import('../helpers/Utils.js').encapsulate
			splitFromTags: typeof import('../helpers/Text.js').splitFromTags
			convertRecursiveObjToStr: typeof import('../helpers/Obj.js').convertRecursiveObjToStr
			convertObjToStr: typeof import('../helpers/Obj.js').convertObjToStr
			createSlug: typeof import('../helpers/Utils.js').createSlug
			generateHash: typeof import('../helpers/hashing.js').generateHash
			hashPassword: typeof import('../helpers/hashing.js').hashPassword
			verifyPassword: typeof import('../helpers/hashing.js').verifyPassword
			cloneValue: typeof import('../helpers/Utils.js').cloneValue
			applyWhere: typeof import('../helpers/Utils.js').applyWhere
			applyOptions: typeof import('../helpers/Utils.js').applyOptions,
			toNumber: typeof import('../helpers/Utils.js').toNumber,
		}

		// Services
		Router: import('../services/RouteService.ts').RouteController
		Cache: import('../services/CacheManager.ts').CacheMethods
		DB: import('../services/DatabaseClient.js').DatabaseClient
		Mail: import('../services/MailService.js').MailService
		Tickrate: import('../services/Tickrate.js').Tickrate
		User: import('../services/UserService.js').UserService
		WS: import('../services/WebSocketServer.js').WebSocketServerManager
		Billing: import('../services/BillingService.js').BillingService
		Organization: import('../services/OrganizationService.js').OrganizationService
		FileManager: import('../services/FileManager.js').FileManager
	}

	var api: ApiGlobal
}
