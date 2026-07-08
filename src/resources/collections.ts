import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import {
  paramsFrom,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface ListOpts extends OutputOpts {
  documentIds?: string;
}

interface SchemaOpts extends OutputOpts {
  schemaFormat?: string;
}

interface BodyOutputOpts extends OutputOpts, BodyOpts {}

interface ActiveViewOpts extends BodyOutputOpts {
  viewId?: string;
}

export const collectionsResource = new Command("collections").description(
  "Manage Craft collections and collection schemas",
);

collectionsResource
  .command("list")
  .description("List collections across the space")
  .option("--document-ids <ids>", "Document IDs to filter")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli collections list --json")
  .action(async (opts: ListOpts) => {
    try {
      const data = await client.get(
        "/collections",
        paramsFrom(opts, [["documentIds", "documentIds"]]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionsResource
  .command("create")
  .description("Create a collection from a JSON schema and position")
  .requiredOption("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--body <json>", "Raw JSON request body")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli collections create --body-file collection.json --json")
  .action(async (opts: BodyOutputOpts) => {
    try {
      const data = await client.post("/collections", requireJsonPayload(opts));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionsResource
  .command("schema")
  .description("Get a collection schema")
  .argument("<collection-id>", "Collection block ID")
  .option("--schema-format <format>", "schema or json-schema-items")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli collections schema collection-123 --json\n  craft-cli collections schema collection-123 --schema-format schema --json",
  )
  .action(async (collectionId: string, opts: SchemaOpts) => {
    try {
      const data = await client.get(
        `/collections/${collectionId}/schema`,
        paramsFrom(opts, [["schemaFormat", "format"]]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionsResource
  .command("update-schema")
  .description("Replace a collection schema")
  .argument("<collection-id>", "Collection block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collections update-schema collection-123 --body-file schema.json --json",
  )
  .action(async (collectionId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.put(`/collections/${collectionId}/schema`, requireJsonPayload(opts));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionsResource
  .command("set-active-view")
  .description("Set the active view for a collection")
  .argument("<collection-id>", "Collection block ID")
  .option("--view-id <id>", "View ID to mark active")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collections set-active-view collection-123 --view-id view-board --json",
  )
  .action(async (collectionId: string, opts: ActiveViewOpts) => {
    try {
      const fallback = opts.viewId ? { viewId: opts.viewId } : undefined;
      const data = await client.put(
        `/collections/${collectionId}/active-view`,
        requireJsonPayload(opts, fallback),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
