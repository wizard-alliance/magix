import * as store from 'svelte/store'

import { HealthClient } from "./classes/Misc/HealthClient"
import { SettingsClient } from "./classes/Misc/SettingsClient"
import { NavigationRegistry } from "./classes/Misc/NavigationRegistry"
import { WebSocketClient } from "./classes/System/WebSocket"
import { RequestClient } from "./classes/System/Request"
import { AppLogger } from "./classes/System/AppLogger"
import { AuthClient } from "./classes/Auth/AuthClient"

import { UserSettingsClient } from "./classes/Account/UserSettingsClient"
import { AvatarClient } from "./classes/Account/AvatarClient"
import { BillingClient } from "./classes/Account/BillingClient"

import { Log, ErrorLog, SuccessLog, WarningLog } from "./classes/System/Log"
import { Reactive } from "./classes/Helpers/Reactive"
import { UIManager } from "./classes/UI/UIManager"
import { Notify } from "./classes/UI/Notify"
import { Modal } from "./classes/UI/Modal"

import { EventManager } from "./classes/Events/EventManager"

import { PUBLIC_APP_TARGET } from '$env/static/public'

import type { AppState } from './types/types'

type AppRuntime = 'web' | 'electron'
const runtime: AppRuntime = PUBLIC_APP_TARGET === 'electron' ? 'electron' : 'web'

export type AppClient = ReturnType<typeof createAppClient>

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

	State: {} as AppState,

	// Domain
	Auth: {} as AuthClient,
	Account: {
		Settings: new UserSettingsClient(),
		Avatar: new AvatarClient(),
		Billing: new BillingClient(),
	},

	// Events (cross-domain bus — used by UI, System, and components)
	Events: new EventManager(),

	// UI — UIManager instance with sub-namespaces
	UI: {} as UIManager & { Modal: Modal, Notify: Notify, Navigation: NavigationRegistry },

	// System — infrastructure layer
	System: {
		Request: {} as RequestClient,
		WS: new WebSocketClient(),
		Logger: {} as AppLogger,
		Health: new HealthClient(),
	},

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
app.Auth = new AuthClient()

const uiManager = new UIManager()
;(uiManager as any).Modal = new Modal()
;(uiManager as any).Notify = new Notify()
;(uiManager as any).Navigation = new NavigationRegistry()
app.UI = uiManager as UIManager & { Modal: Modal, Notify: Notify, Navigation: NavigationRegistry }

app.System.Logger = new AppLogger({ ws: app.System.WS, events: app.Events })

// Restore authentication state
app.Auth.restore()
