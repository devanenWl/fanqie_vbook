# AGENTS.md — vBook Extension Development Guide

## Project Overview

This is a **vBook extension plugin** for the vBook novel reader app (Android). The extension provides a source for reading novels from Fanqie (fanqienovel.com) with optional Chinese-to-Vietnamese translation via OpenAI.

## Repository Structure

This repo hosts multiple vBook plugins. Each plugin lives in its own subfolder.
`repository.json` at the root lists all plugins for discovery.

```
├── repository.json        # Plugin registry (consumed by vBook app to list all plugins)
├── fanqie/                # Fanqie API plugin
│   ├── plugin.json        # Plugin metadata, config definitions, script mappings
│   ├── icon.png           # Plugin icon
│   ├── plugin.zip         # Built plugin ZIP (committed after each build)
│   └── src/
│       ├── config.js      # Shared config: reads plugin.json config values at runtime
│       ├── home.js        # Homepage categories → list of book sources
│       ├── gen.js         # Book list from Fanqie API (rankings, latest, etc.)
│       ├── gen2.js        # Book list from category/genre API (paginated)
│       ├── detail.js      # Book detail page: info, genres, suggests, comments
│       ├── search.js      # Search by keyword
│       ├── genre.js       # Genre/category listing
│       ├── toc.js         # Table of contents (chapter list)
│       ├── chap.js        # Chapter content (with optional OpenAI translation)
│       ├── comment.js     # Book comments/reviews
│       └── suggest.js     # Suggestions (same author books)
├── another-plugin/        # (future) another plugin follows the same layout
│   ├── plugin.json
│   ├── icon.png
│   ├── plugin.zip
│   └── src/
```

### Adding a New Plugin

1. Create a new subfolder (e.g., `myplugin/`) with `plugin.json`, `icon.png`, `src/`, and `plugin.zip`.
2. Add a new entry to `repository.json` → `data[]` with `path` and `icon` pointing to the raw GitHub URLs for that subfolder.
3. Commit and push — the plugin is immediately available in the vBook store.

## vBook Script Runtime

Scripts run inside the **vBook app's embedded JavaScript runtime** on Android. Key APIs available:

- `fetch(url)` / `fetch(url, options)` — HTTP client (returns `{ok, status, text(), json()}`)
- `load('filename.js')` — Load another script from `src/` (like `require`)
- `Response.success(data)` — Return successful result
- `Response.success(data, nextPage)` — Return paginated result
- `Response.error(message)` — Return error
- `UserAgent.android()` — Get Android user-agent string
- `typeof someVar !== "undefined"` — Check if plugin config variable exists

### Script Entry Point Convention

Every script exports an `execute()` function. Parameters are positional (vararg):

```javascript
function execute() { }           // home, genre — no args
function execute(url) { }        // detail, toc, suggest — single URL
function execute(url, page) { }  // gen, gen2, search, comment — URL + pagination
function execute(url) { }        // chap — chapter URL
```

## How Debug/Test Works (Modern API)

The VS Code extension (`vbook-vscode-tester`) communicates with the vBook app on the phone via **HTTP REST API**:

### Connection

- Default server: `http://127.0.0.1:8080` (phone IP, same WiFi or ADB port-forward)
- Health check: `GET /connect`

### Test a Script

```
POST /extension/test
Content-Type: application/json
```

Body:
```json
{
  "plugin": "<stringified plugin.json with icon base64>",
  "src": "<stringified map: {\"home.js\": \"...source...\", \"toc.js\": \"...\"}>",
  "input": "<stringified: {\"script\": \"toc.js\", \"vararg\": [\"https://fanqienovel.com/page/123\"]}>"
}
```

The extension:
1. Reads `plugin.json` from the extension folder
2. Reads all `.js` files from `src/`
3. Reads `icon.png` as base64
4. Sends everything + script name + input args to the phone
5. The phone's vBook app executes the script in its runtime and returns the result

Response:
```json
{
  "code": 200,
  "log": "optional execution log",
  "exception": "optional error message",
  "data": { ... }
}
```

### Install Extension

```
POST /extension/install
Content-Type: application/json
```

Same body as test but without `input`. Installs the full plugin into vBook.

### Build (Local ZIP)

Done entirely in VS Code — creates a valid ZIP file containing `plugin.json`, `icon.png`, and `src/*.js`. Saved as `plugin.zip` in the extension folder.

## Response Data Formats

Each script type must return a specific format via `Response.success()`:

### home.js / genre.js — List of sources
```javascript
[
  { title: "Category Name", input: "url", script: "gen.js" }
]
```

### gen.js / gen2.js / search.js — List of books
```javascript
[
  {
    name: "Book Title",
    link: "https://fanqienovel.com/page/123",
    cover: "https://...",
    description: "Author or desc",
    host: "https://fanqienovel.com"
  }
]
// With pagination: Response.success(data, nextPageString)
```

### detail.js — Book detail
```javascript
{
  name: "Title",
  cover: "url",
  author: "Author",
  description: "HTML description",
  genres: [{ title: "Genre", input: "url", script: "gen2.js" }],
  detail: "HTML string with metadata",
  suggests: [{ title: "Label", input: "url", script: "suggest.js" }],
  comment: { input: "url", script: "comment.js" },
  ongoing: true
}
```

### toc.js — Chapter list
```javascript
[
  { name: "Chapter Title", url: "https://...", host: "https://..." }
]
```

### chap.js — Chapter content
```javascript
Response.success("HTML content with <br> line breaks")
```

### comment.js — Comments
```javascript
[
  { name: "User", content: "HTML", description: "Date" }
]
// With pagination
```

### suggest.js — Suggested books (same format as gen.js)

## Config System (`plugin.json` → `config.js`)

`plugin.json` defines user-configurable fields under `"config"`. These become global variables at runtime. `config.js` reads them:

```javascript
// plugin.json config key → global variable name
// "baseUrl" → typeof baseUrl !== "undefined"
// "openaiApiKey" → typeof openaiApiKey !== "undefined"
```

Always `load('config.js')` at the top of scripts that need config values.

## Translation Feature (chap.js)

When `enableTranslation` is set to `"true"` in plugin config:
1. Fetches chapter content from `chap_host` (FanqieAPI proxy at `http://localhost:9999`)
2. Sends content to OpenAI API for Chinese → Vietnamese translation
3. Supports name mapping via `nameMapping` config (JSON map of Chinese → Vietnamese names)

## Key Patterns

- Always use `load('config.js')` as the first line in scripts that need `config_host`, `replaceCover()`, or translation config
- `replaceCover(url)` rewrites Fanqie cover URLs through a proxy (`i0.wp.com/p6-novel.byteimg.com`)
- `decodeText(text)` in gen.js decodes Fanqie's custom character encoding (Unicode range 58344-58715)
- URLs use `{{page}}` placeholder for pagination, replaced at runtime
- `host` field is required in book/chapter results so the app can construct full URLs

## Testing with vBook Tester Extension

1. Open VS Code with this extension folder in workspace
2. Open vBook Tester sidebar panel
3. Set server URL to phone's IP:port (e.g. `http://192.168.1.100:8080`)
4. Select the extension folder and script
5. Enter arguments (auto-detected from `execute()` function signature)
6. Click "Run" to test single script or "TestAll" to run the full pipeline:
   - home.js → gen.js → detail.js → page.js (optional) → toc.js → chap.js → track.js (optional)

## Lint / Validation

No linter configured. Validate manually by:
1. Checking syntax with `node --check src/*.js`
2. Testing via the vBook Tester extension against the phone
