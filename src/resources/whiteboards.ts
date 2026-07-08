import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import {
  csv,
  positionFrom,
  readJsonPayload,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface CreateOpts extends OutputOpts, BodyOpts {
  position?: string;
  pageId?: string;
  date?: string;
  siblingId?: string;
}

interface BodyOutputOpts extends OutputOpts, BodyOpts {}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

export const whiteboardsResource = new Command("whiteboards").description(
  "Create whiteboards and manage whiteboard elements",
);

whiteboardsResource
  .command("create")
  .description("Create an empty whiteboard block")
  .option("--position <pos>", "Position: start, end, before, or after", "start")
  .option("--page-id <id>", "Page block ID")
  .option("--date <date>", "Daily note date")
  .option("--sibling-id <id>", "Sibling block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli whiteboards create --page-id doc-123 --position start --json",
  )
  .action(async (opts: CreateOpts) => {
    try {
      const fallback =
        opts.pageId || opts.date || opts.siblingId ? { position: positionFrom(opts) } : undefined;
      const data = await client.post("/whiteboards", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

whiteboardsResource
  .command("elements")
  .description("Get whiteboard elements")
  .argument("<whiteboard-block-id>", "Whiteboard block ID")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli whiteboards elements whiteboard-123 --json")
  .action(async (whiteboardBlockId: string, opts: OutputOpts) => {
    try {
      const data = await client.get(`/whiteboards/${whiteboardBlockId}/elements`);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

whiteboardsResource
  .command("add-elements")
  .description("Append elements to a whiteboard")
  .argument("<whiteboard-block-id>", "Whiteboard block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli whiteboards add-elements whiteboard-123 --body-file elements.json --json",
  )
  .action(async (whiteboardBlockId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.post(
        `/whiteboards/${whiteboardBlockId}/elements`,
        requireJsonPayload(opts),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

whiteboardsResource
  .command("update-elements")
  .description("Update whiteboard elements by ID")
  .argument("<whiteboard-block-id>", "Whiteboard block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli whiteboards update-elements whiteboard-123 --body-file elements.json --json",
  )
  .action(async (whiteboardBlockId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.put(
        `/whiteboards/${whiteboardBlockId}/elements`,
        requireJsonPayload(opts),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

whiteboardsResource
  .command("delete-elements")
  .description("Delete whiteboard elements by Excalidraw element ID")
  .argument("<whiteboard-block-id>", "Whiteboard block ID")
  .option("--ids <ids>", "Comma-separated element IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli whiteboards delete-elements whiteboard-123 --ids element-1,element-2 --json",
  )
  .action(async (whiteboardBlockId: string, opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { elementIds: csv(opts.ids, "ids") };
      const data = await client.delete(`/whiteboards/${whiteboardBlockId}/elements`, payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
