---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Overall

### Coding style
- Embrace the DRY principle; refactor repeated logic into reusable helpers or classes.
- Keep code concise and expressive—avoid verbosity in implementations and documentation.
- Prioritize human-friendly readability; choose clear naming and straightforward control flow.
- Favor template literals `` `like this` `` for string values whenever syntax allows; avoid semicolons in custom code.
- Write comments sparingly in plain language, focusing on intent rather than restating code.
- Target elegant, modern solutions that leverage current platform capabilities.
- Use `camelCase` for variables, functions, files, and class members; reserve `PascalCase` for class names.
- When adding functionality, split logic into multiple focused files instead of growing very large files.
- Prefer well-supported npm packages (for example, date utilities) over reinventing common helpers.
- Capture implementation details, decisions, and runbooks in `Development.md`; keep `README.md` high-level.
- **Environment files:** Keep runtime secrets in `.env`, track sample values in `.env-example`.
- Do not use semicolons in custom code.
- Use `async/await` for asynchronous code; avoid raw Promises.
- Use `const` and `let`; avoid `var`.
- Use `import`/`export` syntax; avoid `require`/`module.exports`.
- Use `===` and `!==`; avoid `==` and `!=`.
- Avoid refactors unless explicitly requested.
- Do not be verbose; keep code concise and expressive, avoiding unnecessary complexity.
- VS Code Extension - REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
- REST Client is humao.rest-client for VS Code not Jet Brains IDE!

### Project layout
The mono-repo has two source folders: `app/` and `api/`.

```text
- api/
	-- src/
		--- classes/
		--- controllers/
		--- helpers/
		--- routes/
- app/
	-- src/
		--- assets/
		--- components/
			---- fields/      (button, input, select, toggle, etc.)
			---- modules/     (avatar, badge, table, tabs, modal, etc.)
			---- sections/
		--- configs/
		--- lib/
			---- classes/
			---- types/
		--- routes/
		--- styles/
```

### Architecture — global facade pattern
A global facade architecture: the system exposes a small, consistent surface through centralized namespaces, where modules follow uniform verbs and patterns. This creates a predictable, discoverable API that abstracts complexity, centralizes side effects, and keeps implementation details hidden while remaining easy to extend, test, and mock. We like to put classes into global `app.*` or `api.*` namespaces.

Classes should try to be contained within itself, ie. the route class should store and manage its own data, functions, and state. Most classes should be singletons, instantiated once and reused throughout the app. Classes should expose a consistent set of relevant methods (get, set, add, remove, update, find, query, etc) that follow a predictable pattern across the system. Other systems can then interact with these classes through a simple, uniform interface with minimal code.

Below is a set of random made up examples of this pattern & architectual style: (window not required, as it's implied in global scope)

```
window.app.utils.formatDate(date)
window.app.routes.get()
window.app.routes.set()
window.api.routes.add(...)
window.api.db.query(...)
window.api.request.get(...)
window.api.request.post(...)
window.api.request(...)
... etc
```

---

## API (`api/`)
- Source lives in `api/src/` with classes, controllers, helpers, and routes.
- Follows the same global facade pattern under the `api.*` namespace.
- **`api-test-app/`** is a standalone test app with full API integration—reference it for real examples of how the app communicates with the API (auth, requests, data flow, etc.).

---

## App (`app/`)

### Design philosophy
- The app follows a **minimal, dark-themed design**. Respect this aesthetic—avoid heavy decoration, bright backgrounds, or busy layouts.
- Use existing SCSS config variables from `app/src/styles/config.scss` for colours, spacing, borders, radii, font sizes, and animation. Never hard-code values that already have a CSS custom property—check `config.scss` for what's available.
- Sidebar widths, header height, and layout offsets are driven by CSS custom properties + `data-*` attributes on `.app`—do not override these with fixed pixel values.

### Components
- Reusable UI components live in `app/src/components/` split into `fields/` (form inputs) and `modules/` (UI building blocks).
- **Reference `app/src/routes/dev/components/+page.svelte`** for live examples and correct usage of every component—consult it before creating or modifying UI. Look up this file when using components, add to this file when creating new components, and follow its patterns for consistency.
- For notifications and modals, look up their classes in `app/src/lib/classes/`.
- Prefer composing existing components over creating new ones. When a new component is needed, follow the same patterns (props, events, slots) used by the existing set.