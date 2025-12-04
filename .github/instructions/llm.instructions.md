---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Project Context
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
- The mono-repo has two source folders: app/ and api/
- Do not use semicolons in custom code.
- Use `async/await` for asynchronous code; avoid raw Promises.
- Use `const` and `let`; avoid `var`.
- Use `import`/`export` syntax; avoid `require`/`module.exports`.
- Use `===` and `!==`; avoid `==` and `!=`.
- Avoid refactors unless explicitly requested.
- Separate logic into multiple focused files instead of growing very large files.
- Do not be verbose; keep code concise and expressive, avoiding unnecessary complexity.
- VS Code Extension - REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
- REST Client is humao.rest-client for VS Code not Jet Brains IDE!

## Project layout

```text
- ...
- api/
	-- src/
		--- classes/
		--- controllers/
		--- helpers/
		--- routes/
		--- ...
- app/
	-- src/
		--- assets/
		--- lib/
		----classes/
		--- routes/
		--- styles/
		--- ...
```

## Class/Function style examples:
A global facade architecture: the system exposes a small, consistent surface through centralized namespaces, where modules follow uniform verbs and patterns. This creates a predictable, discoverable API that abstracts complexity, centralizes side effects, and keeps implementation details hidden while remaining easy to extend, test, and mock. We like to put classes into global `app.*` or `api.*` namespaces.

Classes should try to be contained within itself, ie. the route class should store and manage its own data, functions, and state. Most classes should be singletons, instantiated once and reused throughout the app. Classes should expose a consistent set of relevant methods (get, set, add, remove, update, find, query, etc) that follow a predictable pattern across the system. Other systems can then interact with these classes through a simple, uniform interface with minimal code.

Below is a set of random made up examples of this pattern & architectual style: (window not required, as it's implied in global scope)

```
window.api.Character.create({ ... })
window.api.Character.get({ ... }) // Params to filter, or number for ID
window.api.Character.set({ ... }) // Create user with params
window.api.Character.getMeta(ID, 'email') // Gets single meta value
window.api.Character.getMeta(ID) // Gets all meta (Multi purpose functions)
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