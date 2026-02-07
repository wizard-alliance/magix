import * as store from 'svelte/store'

import { HealthClient } from "./classes/Misc/HealthClient"
import { SettingsClient } from "./classes/Misc/SettingsClient"
import { NavigationRegistry } from "./classes/Misc/NavigationRegistry"
import { WebSocketClient } from "./classes/WebSocket"
import { RequestClient } from "./classes/Request"
import { UIManager } from "./classes/UIManager"
import { AuthClient } from "./classes/Auth/AuthClient"

import { UserSettingsClient } from "./classes/Account/UserSettingsClient"
import { AvatarClient } from "./classes/Account/AvatarClient"
import { BillingClient } from "./classes/Account/BillingClient"

import { Log, ErrorLog, SuccessLog, WarningLog } from "./classes/Helpers/Log"
import { Reactive } from "./classes/Helpers/Reactive"
import { AppLogger } from "./classes/Helpers/AppLogger"
import { Notify } from "./classes/Notify"
import { Modal } from "./classes/Modal"

// Event signals
import { EventManager } from "./classes/Events/EventManager"

import { PUBLIC_APP_TARGET } from '$env/static/public'

type AppRuntime = 'web' | 'electron'
const runtime: AppRuntime = PUBLIC_APP_TARGET === 'electron' ? 'electron' : 'web'

type AppClient = ReturnType<typeof createAppClient>

export const createAppClient = () => ({

	Config: {
		name: `App`,
		tagline: `Framework: Front-end app`,
		pageTitle: `Loading...`,
		pageTitleFull: (pageTitle?: string) => `${app.Config.name} - ${pageTitle || app.Config.pageTitle}`,
		runtime,
		apiBaseUrl: runtime !== 'electron' ? 'http://localhost:4000/api/v1' : '/api/v1',
	},
	
	Settings: new SettingsClient(),

	// Account
	Account: {
		Settings: new UserSettingsClient(),
		Avatar: new AvatarClient(),
		Billing: new BillingClient(),
	},

	// Misc
	Misc: {
		Health: new HealthClient(),
		Navigation: new NavigationRegistry(),
	},

	// 
	State: {} as any,
	Request: {} as RequestClient,
	UI: {} as UIManager,
	Auth: {} as AuthClient,

	// Events, WebSocket, and Polling methods
	ws: new WebSocketClient(),
	Events: new EventManager(),
	Polling: {},

	// Helpers
	$ : {
		Log: Log,
		Error: ErrorLog,
		Warn: WarningLog,
		Success: SuccessLog,
		Reactive: Reactive,
		Store: { ...store }
	},

	Logger: {} as AppLogger,
	Notify: new Notify,
	Modal: new Modal,
})

// Make global
export const app: AppClient = createAppClient()

// if (typeof window !== 'undefined' && window.app === undefined) {
//     ;(window as any).app = app
// }

;(globalThis as any).app = app

// Initialize state stores
app.State.currentUser = store.writable(null)
app.State.ui = {
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

app.Request = new RequestClient()
app.Auth = new AuthClient()

app.UI = new UIManager()
app.Logger = new AppLogger({ ws: app.ws, events: app.Events })

// Restore authentication state
app.Auth.restore()
