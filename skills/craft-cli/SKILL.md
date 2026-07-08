---
name: craft-cli
description: "Manage Craft Space API via CLI - auth, blocks, collection-items, collection-views, collections, comments, connection, documents, folders, tasks, upload, whiteboards. Use when user mentions 'Craft', 'Craft docs', 'Craft space', 'daily notes', 'Craft tasks', 'Craft collections', or wants to interact with the Craft API."
category: "productivity"
---

# craft-cli

## When To Use This Skill

Use the `craft-cli` skill when you need to:

- inspect Craft space metadata, folders, documents, blocks, collections, tasks, or whiteboards.
- search across Craft documents or within one document and fetch matched blocks.
- create, move, update, or delete Craft content using the production Craft Space API.
- add tasks, comments, collection items, collection views, uploads, or whiteboard elements.
- automate Craft workflows with stable `--json` output.

## Capabilities

- **Read operations**: inspect connection metadata, folders, documents, blocks, collections, collection items, collection views, tasks, and whiteboard elements.
- **Search operations**: search documents across the space and search inside one document or page block.
- **Write operations**: create documents, folders, blocks, comments, tasks, collections, collection items, collection views, uploads, and whiteboards.
- **Change operations**: update or move documents, folders, blocks, tasks, collection schemas, collection items, collection views, and whiteboard elements.
- **Automation**: all operational commands expose `--json`; complex bodies can be passed with `--body`, `--body-file <path>`, or `--body-file -`.

## Common Use Cases

- "List my Craft folders and find the documents in a project folder."
- "Search every Craft document for a topic, then fetch context around the matches."
- "Create a Craft task in inbox for tomorrow."
- "Insert this markdown into today's daily note."
- "List items in this Craft collection and update their status."
- "Upload this image into a Craft document."

## Setup

If `craft-cli` is not found, install and build it:

```bash
npx api2cli install Nardjo/craft-cli
```

Authenticate with a Craft bearer token:

```bash
craft-cli auth set "your-token"
craft-cli auth test
```

Token storage: `~/.config/tokens/craft-cli.txt`.

## Working Rules

- Always use `--json` for agent-driven calls.
- Start with read-only commands before mutating production Craft content.
- For complex write operations, prefer `--body-file` so JSON can be reviewed and reused.
- Use `craft-cli <resource> <action> --help` when exact flags are unclear.
- Craft docs warn that this is production data. Do not perform destructive tests unless the rollback path is clear.

## Resources

### connection

| Command | Description |
|---------|-------------|
| `craft-cli connection info --json` | Get space metadata, timezone, current time, and deep-link templates. |

### folders

| Command | Description |
|---------|-------------|
| `craft-cli folders list --json` | List built-in locations and user folders with document counts. |
| `craft-cli folders create --name "Project" --json` | Create one folder. |
| `craft-cli folders create --names "Marketing,Engineering" --json` | Create multiple folders. |
| `craft-cli folders delete --ids folder-1,folder-2 --json` | Delete folders by ID. |
| `craft-cli folders move --ids folder-1 --destination root --json` | Move folders to root. |
| `craft-cli folders move --ids folder-1 --parent-folder-id folder-2 --json` | Move folders inside another folder. |

### documents

| Command | Description |
|---------|-------------|
| `craft-cli documents list --location unsorted --json` | List documents in a built-in location. |
| `craft-cli documents list --folder-id folder-123 --fetch-metadata --json` | List documents inside a folder recursively. |
| `craft-cli documents search --include "API" --json` | Search documents by included terms. |
| `craft-cli documents search --regexps "project|roadmap" --fetch-blocks --json` | Search documents with regex patterns and matched blocks. |
| `craft-cli documents create --title "Project Plan" --json` | Create one document. |
| `craft-cli documents create --titles "One,Two" --folder-id folder-123 --json` | Create multiple documents in a folder. |
| `craft-cli documents delete --ids doc-123,doc-456 --json` | Soft-delete documents by moving them to trash. |
| `craft-cli documents move --ids doc-123 --folder-id folder-456 --json` | Move documents to a folder. |
| `craft-cli documents move --ids doc-123 --destination unsorted --json` | Move documents to a built-in location. |

### blocks

| Command | Description |
|---------|-------------|
| `craft-cli blocks fetch --id doc-123 --json` | Fetch a block or document root as structured JSON. |
| `craft-cli blocks fetch --date today --markdown --json` | Fetch a daily note as rendered markdown. |
| `craft-cli blocks insert --markdown "## Notes" --page-id doc-123 --position end --json` | Insert markdown into a document. |
| `craft-cli blocks insert --body-file payload.json --json` | Insert rich structured blocks from JSON. |
| `craft-cli blocks update --id block-5 --markdown "Updated text" --json` | Update one block's markdown. |
| `craft-cli blocks update --body-file payload.json --json` | Update multiple blocks from JSON. |
| `craft-cli blocks delete --ids block-1,block-2 --json` | Delete blocks by ID. |
| `craft-cli blocks move --ids block-5,block-6 --page-id doc-123 --position end --json` | Move blocks to a document position. |
| `craft-cli blocks search --block-id doc-123 --pattern "API" --before-block-count 1 --json` | Search inside one document or page block. |

### collections

| Command | Description |
|---------|-------------|
| `craft-cli collections list --json` | List collections across the space. |
| `craft-cli collections list --document-ids doc-123 --json` | List collections filtered by document. |
| `craft-cli collections create --body-file collection.json --json` | Create a collection from schema and position JSON. |
| `craft-cli collections schema collection-123 --json` | Get JSON Schema for collection items. |
| `craft-cli collections schema collection-123 --schema-format schema --json` | Get editable collection schema. |
| `craft-cli collections update-schema collection-123 --body-file schema.json --json` | Replace a collection schema. |
| `craft-cli collections set-active-view collection-123 --view-id view-board --json` | Set the active stored view. |

### collection-items

| Command | Description |
|---------|-------------|
| `craft-cli collection-items list collection-123 --json` | List items from a collection. |
| `craft-cli collection-items list collection-123 --max-depth 0 --json` | List collection item properties without nested content. |
| `craft-cli collection-items add collection-123 --body-file items.json --json` | Add items to a collection. |
| `craft-cli collection-items update collection-123 --body-file update.json --json` | Update collection items. |
| `craft-cli collection-items delete collection-123 --ids item-1,item-2 --json` | Delete collection items. |

### collection-views

| Command | Description |
|---------|-------------|
| `craft-cli collection-views list collection-123 --json` | List stored views for a collection. |
| `craft-cli collection-views create collection-123 --body-file view.json --json` | Create a table, gallery, or kanban view definition. |
| `craft-cli collection-views update collection-123 view-board --body-file view.json --json` | Update a view definition. |
| `craft-cli collection-views delete collection-123 view-board --json` | Delete a view definition. |

### comments

| Command | Description |
|---------|-------------|
| `craft-cli comments add --block-id block-123 --content "Please review" --json` | Add one comment to a block. |
| `craft-cli comments add --body-file comments.json --json` | Add multiple comments from JSON. |

### tasks

| Command | Description |
|---------|-------------|
| `craft-cli tasks list --scope active --json` | List active tasks. |
| `craft-cli tasks list --scope document --document-id doc-123 --json` | List tasks in one document. |
| `craft-cli tasks add --markdown "Prepare slides" --location inbox --json` | Add a task to inbox. |
| `craft-cli tasks add --body-file tasks.json --json` | Add one or more tasks from JSON. |
| `craft-cli tasks update --id task-1 --state done --json` | Mark or update one task. |
| `craft-cli tasks update --body-file update.json --json` | Update tasks from JSON. |
| `craft-cli tasks delete --ids task-1,task-2 --json` | Delete tasks by ID. |

### upload

| Command | Description |
|---------|-------------|
| `craft-cli upload file --file image.png --position end --page-id doc-123 --content-type image/png --json` | Upload a file and insert it into a document. |

### whiteboards

| Command | Description |
|---------|-------------|
| `craft-cli whiteboards create --page-id doc-123 --position start --json` | Create an empty whiteboard block. |
| `craft-cli whiteboards elements whiteboard-123 --json` | Get all elements, assets, and app state. |
| `craft-cli whiteboards add-elements whiteboard-123 --body-file elements.json --json` | Append Excalidraw elements. |
| `craft-cli whiteboards update-elements whiteboard-123 --body-file elements.json --json` | Update Excalidraw elements by ID. |
| `craft-cli whiteboards delete-elements whiteboard-123 --ids element-1,element-2 --json` | Delete Excalidraw elements by ID. |

## JSON Bodies

Complex write operations accept JSON:

```bash
craft-cli blocks insert --body '{"markdown":"## Notes","position":{"position":"end","pageId":"doc-123"}}' --json
craft-cli collection-items add collection-123 --body-file items.json --json
cat payload.json | craft-cli tasks add --body-file - --json
```

## Output Format

`--json` returns a standardized envelope:

```json
{ "ok": true, "data": { "...": "..." }, "meta": { "total": 42 } }
```

On error:

```json
{ "ok": false, "error": { "code": 401, "message": "401: Unauthorized", "suggestion": "Check your token: craft-cli auth test" } }
```

## Quick Reference

```bash
craft-cli --help
craft-cli <resource> --help
craft-cli <resource> <action> --help
```

Global flags: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`.

Exit codes: 0 = success, 1 = API error, 2 = usage error.
