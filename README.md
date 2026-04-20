# trello-mcp-plus

[![npm version](https://img.shields.io/npm/v/trello-mcp-plus.svg)](https://www.npmjs.com/package/trello-mcp-plus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server for **[Trello](https://trello.com)**. Lets Claude / Claude Code / any MCP client drive a Trello workspace end-to-end — read boards and cards, create and move cards, assign members, attach labels, set due dates, and archive — directly from an agent.

> Works against the official Trello REST API (`https://api.trello.com/1/`). Read the full API reference at [developer.atlassian.com/cloud/trello](https://developer.atlassian.com/cloud/trello/rest/).

> Originally forked from [lioarce01/trello-mcp-plus-server](https://github.com/lioarce01/trello-mcp-plus-server) (MIT, © 2025 Lionel Arce). This build extends the upstream toolset with member-assignment, labels, card description, and due-date operations.

## Features

- **Boards** — `list_boards`, `read_board`, `delete_board`, `list_board_members`, `list_board_labels`
- **Lists** — `create_list`, `update_list_name`, `archive_list`
- **Cards** — `create_card`, `update_card_name`, `update_card_description`, `move_card`, `archive_card`, `add_comment`, `set_card_due_date`
- **Members** — `assign_card_member`, `unassign_card_member`
- **Labels** — `add_card_label`, `remove_card_label`

All responses come back as JSON text blocks, ready for the agent to parse or echo.

## Install

```bash
npm install -g trello-mcp-plus
# or run ad-hoc with npx
npx trello-mcp-plus
```

Or build from source:

```bash
git clone https://github.com/sewon-supernova/trello-mcp-plus.git
cd trello-mcp-plus
npm install
npm run build
```

## Configure

Grab an API key and token from [trello.com/app-key](https://trello.com/app-key), then set:

```bash
export TRELLO_API_KEY=your_api_key
export TRELLO_TOKEN=your_token
export TRELLO_BASE_URL=https://api.trello.com/1   # optional, this is the default
```

A reference `.env` layout:

```env
TRELLO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TRELLO_TOKEN=ATTAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TRELLO_BASE_URL=https://api.trello.com/1
```

## Use with Claude Code / Claude Desktop

Add this to your MCP config (e.g. `~/.claude/config.json`, `.mcp.json`, or the Claude Desktop config):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "trello-mcp-plus"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_token",
        "TRELLO_BASE_URL": "https://api.trello.com/1"
      }
    }
  }
}
```

Then prompt the agent:

> Find the card "Design review" on the Sprint board, assign it to @alice, add the "urgent" label, and set the due date to this Friday 5pm.

## Tool reference

### Boards

| Tool | Purpose |
|------|---------|
| `list_boards` | `GET /members/me/boards` — list all open boards you can see |
| `read_board` | Walk a board's open lists and their cards (id + name only) |
| `list_board_members` | `GET /boards/{id}/members` — returns `id`, `fullName`, `username` |
| `list_board_labels` | `GET /boards/{id}/labels` — returns `id`, `name`, `color` |
| `delete_board` | `DELETE /boards/{id}` — irreversible, use carefully |

### Lists

| Tool | Purpose |
|------|---------|
| `create_list` | `POST /lists` — create a list on a board |
| `update_list_name` | `PUT /lists/{id}` — rename |
| `archive_list` | `PUT /lists/{id}` with `closed: true` |

### Cards

| Tool | Purpose |
|------|---------|
| `create_card` | `POST /cards` — create in a list with name + optional desc |
| `update_card_name` | `PUT /cards/{id}` — rename |
| `update_card_description` | `PUT /cards/{id}` — overwrite `desc` (markdown) |
| `move_card` | `PUT /cards/{id}` with `idList` — move between lists |
| `set_card_due_date` | `PUT /cards/{id}` with ISO-8601 `due`, or null/empty to clear |
| `archive_card` | `PUT /cards/{id}` with `closed: true` |
| `add_comment` | `POST /cards/{id}/actions/comments` |

### Members

| Tool | Purpose |
|------|---------|
| `assign_card_member` | `POST /cards/{id}/idMembers?value={memberId}` |
| `unassign_card_member` | `DELETE /cards/{id}/idMembers/{memberId}` |

### Labels

| Tool | Purpose |
|------|---------|
| `add_card_label` | `POST /cards/{id}/idLabels?value={labelId}` |
| `remove_card_label` | `DELETE /cards/{id}/idLabels/{labelId}` |

## Development

```bash
npm run dev     # tsx hot-run against src/index.ts
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

The project is tiny and deliberately flat:

```
src/
  api/trelloApi.ts         — axios wrapper (get/post/put/delete with auth params)
  handlers/toolHandlers.ts — one handler function per tool
  handlers/MCPHandlers.ts  — MCP request dispatch + switch on tool name
  metadata/toolsMetadata.ts— JSONSchema for each tool (exposed via ListTools)
  config/config.ts         — env parsing
  index.ts                 — stdio transport bootstrap
```

To add a new Trello operation: edit all three (`toolsMetadata`, `toolHandlers`, `MCPHandlers` switch), then `npm run build` and restart your MCP client so the tool list is re-fetched.

## License

MIT. Original work © 2025 Lionel Arce. Additional contributions © 2026 sewon-supernova. See [LICENSE](LICENSE).
