import * as store from 'svelte/store'

import { HealthClient } from "./classes/Misc/HealthClient"
import { MetaClient } from "./classes/Meta/MetaClient"
import { WebSocketClient } from "./classes/System/WebSocket"
import { RequestClient } from "./classes/System/Request"
import { AppLogger } from "./classes/System/AppLogger"
import { AuthClient } from "./classes/Auth/AuthClient"
import { CacheClient } from "./classes/Data/CacheClient"

import { UserSettingsClient } from "./classes/Account/UserSettingsClient"
import { AvatarClient } from "./classes/Account/AvatarClient"
import { BillingClient } from "./classes/Account/BillingClient"

import { SettingsResource } from "./classes/Admin/SettingsResource"
import { UsersResource } from "./classes/Admin/UsersResource"

import { Log, ErrorLog, SuccessLog, WarningLog } from "./classes/System/Log"
import { Reactive } from "./classes/Helpers/Reactive"
import { UIManager } from "./classes/UI/UIManager"
import { Notify } from "./classes/UI/Notify"
import { Modal } from "./classes/UI/Modal"

import { EventManager } from "./classes/Events/EventManager"

import type { AppState } from './types/types'

export type AppClient = ReturnType<typeof createAppClient>

export const createAppClient = () => ({

	System: {
		Request: {} as RequestClient,
		WS: new WebSocketClient(),
		Logger: {} as AppLogger,
	},

	Cache: {} as CacheClient,

	Meta: new MetaClient(),

	State: {} as AppState,

	// Domain
	Auth: {} as AuthClient,

	Account: {
		Settings: new UserSettingsClient(),
		Avatar: new AvatarClient(),
		Billing: new BillingClient(),
	},

	Admin: {
		Settings: new SettingsResource(),
		Users: new UsersResource(),
	},

	// Events (cross-domain bus — used by UI, System, and components)
	Events: new EventManager(),

	// UI — UIManager instance with sub-namespaces
	UI: {} as UIManager & { Modal: Modal, Notify: Notify },


	// Helpers
	Helpers: {
		Log,
		Error: ErrorLog,
		Warn: WarningLog,
		Success: SuccessLog,
		Reactive,
		Store: { ...store },
	},
})

// Create singleton and make globally accessible
export const app: AppClient = createAppClient()
;(globalThis as any).app = app

// Initialize typed state stores
app.State.currentUser = store.writable(null)
app.State.UI = {
	isDragging: store.writable(false),
	dragData: store.writable(null),
	isClicking: store.writable(false),
	clickData: store.writable(null),
	sidebar1: store.writable(null),
	sidebar2: store.writable(null),
	sidebar0Visible: store.writable(true),
	sidebar1Visible: store.writable(true),
	sidebar2Visible: store.writable(false),
	notificationsOpen: store.writable(false),
	menuOpen: store.writable(false),
}

// Phase 2 — deferred instances (depend on app existing at runtime via globalThis)
app.System.Request = new RequestClient()
app.Cache = new CacheClient()
app.Cache.checkVersion()
app.Meta.init()
app.Auth = new AuthClient()

const uiManager = new UIManager()
;(uiManager as any).Modal = new Modal()
;(uiManager as any).Notify = new Notify()
app.UI = uiManager as UIManager & { Modal: Modal, Notify: Notify }

app.System.Logger = new AppLogger({ ws: app.System.WS, events: app.Events })

// Restore authentication state
app.Auth.restore()
