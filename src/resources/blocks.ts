import { Command } from "commander";
import { readFileSync } from "fs";
import { client } from "../lib/client.js";
import { CliError, handleError } from "../lib/errors.js";
import {
  csv,
  paramsFrom,
  positionFrom,
  readJsonPayload,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface FetchOpts extends OutputOpts {
  id?: string;
  date?: string;
  maxDepth?: string;
  fetchMetadata?: boolean;
  markdown?: boolean;
}

interface InsertOpts extends OutputOpts, BodyOpts {
  markdown?: string;
  markdownFile?: string;
  position?: string;
  pageId?: string;
  date?: string;
  siblingId?: string;
}

interface UpdateOpts extends OutputOpts, BodyOpts {
  id?: string;
  markdown?: string;
  markdownFile?: string;
  font?: string;
}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

interface MoveOpts extends OutputOpts, BodyOpts {
  ids?: string;
  position?: string;
  pageId?: string;
  date?: string;
  siblingId?: string;
}

interface SearchOpts extends OutputOpts {
  blockId?: string;
  pattern?: string;
  caseSensitive?: boolean;
  beforeBlockCount?: string;
  afterBlockCount?: string;
  fetchBlocks?: boolean;
}

export const blocksResource = new Command("blocks").description(
  "Fetch, search, insert, update, move, and delete Craft blocks",
);

blocksResource
  .command("fetch")
  .description("Fetch a block, document root block, or daily note")
  .option("--id <id>", "Block or document root block ID")
  .option("--date <date>", "Daily note date: today, tomorrow, yesterday, or YYYY-MM-DD")
  .option("--max-depth <n>", "Maximum descendant depth to fetch")
  .option("--fetch-metadata", "Include comments, authors, and timestamps")
  .option("--markdown", "Request rendered markdown instead of structured JSON")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli blocks fetch --id doc-123 --json\n  craft-cli blocks fetch --date today --markdown --json",
  )
  .action(async (opts: FetchOpts) => {
    try {
      if (!opts.id && !opts.date) throw new CliError(2, "Provide --id or --date.");
      if (opts.id && opts.date) throw new CliError(2, "Use --id or --date, not both.");

      const data = await client.get(
        "/blocks",
        paramsFrom(opts, [
          ["id", "id"],
          ["date", "date"],
          ["maxDepth", "maxDepth"],
          ["fetchMetadata", "fetchMetadata"],
        ]),
        opts.markdown
          ? { headers: { Accept: "text/markdown" }, responseType: "text" }
          : {},
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

blocksResource
  .command("insert")
  .description("Insert blocks or markdown into a document or daily note")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--markdown <text>", "Markdown content to insert")
  .option("--markdown-file <path>", "Read markdown content from a file")
  .option("--position <pos>", "Position: start, end, before, or after", "end")
  .option("--page-id <id>", "Page block ID for start/end insertion")
  .option("--date <date>", "Daily note date for start/end insertion")
  .option("--sibling-id <id>", "Sibling block ID for before/after insertion")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli blocks insert --markdown "## Notes" --page-id doc-123 --position end --json\n  craft-cli blocks insert --body-file payload.json --json',
  )
  .action(async (opts: InsertOpts) => {
    try {
      const markdown = opts.markdown ?? readOptionalFile(opts.markdownFile);
      const fallback = markdown
        ? { markdown, position: positionFrom(opts) }
        : undefined;
      const data = await client.post("/blocks", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

blocksResource
  .command("update")
  .description("Update existing blocks")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--id <id>", "Block ID for a simple markdown update")
  .option("--markdown <text>", "Markdown content for a simple update")
  .option("--markdown-file <path>", "Read markdown content from a file")
  .option("--font <font>", "Optional font for a simple update")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli blocks update --id block-5 --markdown "Updated text" --json\n  craft-cli blocks update --body-file payload.json --json',
  )
  .action(async (opts: UpdateOpts) => {
    try {
      const markdown = opts.markdown ?? readOptionalFile(opts.markdownFile);
      const fallback =
        opts.id && markdown
          ? { blocks: [{ id: opts.id, markdown, ...(opts.font && { font: opts.font }) }] }
          : undefined;
      const data = await client.put("/blocks", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

blocksResource
  .command("delete")
  .description("Delete blocks by ID")
  .option("--ids <ids>", "Comma-separated block IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli blocks delete --ids block-1,block-2 --json\n  craft-cli blocks delete --body '{\"blockIds\":[\"block-1\"]}' --json",
  )
  .action(async (opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { blockIds: csv(opts.ids, "ids") };
      const data = await client.delete("/blocks", payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

blocksResource
  .command("move")
  .description("Move blocks within or across documents")
  .option("--ids <ids>", "Comma-separated block IDs")
  .option("--position <pos>", "Position: start, end, before, or after", "end")
  .option("--page-id <id>", "Page block ID for start/end")
  .option("--date <date>", "Daily note date for start/end")
  .option("--sibling-id <id>", "Sibling block ID for before/after")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli blocks move --ids block-5,block-6 --page-id doc-123 --position end --json\n  craft-cli blocks move --body-file payload.json --json",
  )
  .action(async (opts: MoveOpts) => {
    try {
      const fallback = opts.ids
        ? { blockIds: csv(opts.ids, "ids"), position: positionFrom(opts) }
        : undefined;
      const data = await client.put("/blocks/move", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

blocksResource
  .command("search")
  .description("Search inside one document or page block")
  .requiredOption("--block-id <id>", "Document or page block ID to search within")
  .requiredOption("--pattern <pattern>", "RE2-compatible search pattern")
  .option("--case-sensitive", "Use case-sensitive search")
  .option("--before-block-count <n>", "Number of preceding blocks to include")
  .option("--after-block-count <n>", "Number of following blocks to include")
  .option("--fetch-blocks", "Include full matched blocks with styling")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  craft-cli blocks search --block-id doc-123 --pattern "API" --before-block-count 1 --json',
  )
  .action(async (opts: SearchOpts) => {
    try {
      const data = await client.get(
        "/blocks/search",
        paramsFrom(opts, [
          ["blockId", "blockId"],
          ["pattern", "pattern"],
          ["caseSensitive", "caseSensitive"],
          ["beforeBlockCount", "beforeBlockCount"],
          ["afterBlockCount", "afterBlockCount"],
          ["fetchBlocks", "fetchBlocks"],
        ]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

function readOptionalFile(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return readFileSync(path, "utf8");
}
