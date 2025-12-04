import express from "express"
import { AppServer } from "@api/core/classes/AppServer.js"

// Schema
import * as Schema from "@api/core/schema/Schema.js"

// Core controllers & helpers
import { Log, ThrowError, ThrowWarning, SuccessLog } from "@api/core/helpers/Console.js"
import { Logger, registerAppLoggerBridge } from "@api/core/helpers/Logger.js"
import {
	maybeJSONString, maybeJSONDecode,
	removeKeysDeep, removeEmptyValuesDeep,
	encapsulate, splitFromTags, createSlug
} from "@api/core/helpers/Utils.js"

import { convertRecursiveObjToStr, convertObjToStr } from "@api/core/helpers/Obj.js"

import { RouteController } from "@api/core/controllers/RouteController.js"
import { sendError, sendSuccess } from "@api/core/helpers/ApiResponder.js"

// Controllers
import { DataManager } from "@api/core/controllers/DataManager.js"

// Services
import { DatabaseClient } from "@api/core/services/DatabaseClient.js"
import { MailService } from "@api/core/services/MailService.js"
import { WebSocketServerManager } from "@api/core/services/WebSocketServer.js"
import { Tickrate } from "@api/core/services/Tickrate.js"
import { AuthService } from "@api/core/services/Auth/AuthService.js"

import { Config } from "@api/core/config/env.js"
import { magixConfig } from "@magix/config" 

// Expose API globally
const scope: any = globalThis
scope.api = {} as ApiGlobal

scope.api.Magix = magixConfig
scope.api.Config = Config
scope.api.Schema = Schema

scope.api.Log = Log
scope.api.Error = ThrowError
scope.api.Warning = ThrowWarning
scope.api.Success = SuccessLog

scope.api.getParams = (request: express.Request) => {
	return { ...(request.params || {}), ...(request.query || {}), ...(request.body || {}) }
}


scope.api.Router = new RouteController()

scope.api.Utils = {
	sendSuccess,
	sendError,
	maybeJSONString,
	maybeJSONDecode,
	removeKeysDeep,
	removeEmptyValuesDeep,
	encapsulate,
	splitFromTags,
	convertRecursiveObjToStr,
	convertObjToStr,
	createSlug,
}

scope.api.Services = {
	DB: new DatabaseClient(),
	Mail: new MailService(),
	Tickrate: new Tickrate(),
} as const

scope.api.Auth = new AuthService()
scope.api.Data = new DataManager()
scope.api.WS = new WebSocketServerManager()

scope.api.Logger = new Logger({ basePath: "../.logs", scope: 'api', label: 'API' })
scope.api.LoggerApp = new Logger({ basePath: "../.logs", scope: 'app', label: 'App' })
registerAppLoggerBridge(scope.api.LoggerApp)


// Start Express server
scope.api.Server = new AppServer()


process.on("unhandledRejection", (reason) => {
	console.error("Unhandled rejection", reason)
})

process.on("uncaughtException", (error) => {
	console.error("Uncaught exception", error)
})


export default scope.api