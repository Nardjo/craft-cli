import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import {
  csv,
  paramsFrom,
  readJsonPayload,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface ListOpts extends OutputOpts {
  maxDepth?: string;
}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

interface BodyOutputOpts extends OutputOpts, BodyOpts {}

export const collectionItemsResource = new Command("collection-items").description(
  "Manage items inside Craft collections",
);

collectionItemsResource
  .command("list")
  .description("Get items from a collection")
  .argument("<collection-id>", "Collection block ID")
  .option("--max-depth <n>", "Maximum nested content depth to fetch")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli collection-items list collection-123 --json")
  .action(async (collectionId: string, opts: ListOpts) => {
    try {
      const data = await client.get(
        `/collections/${collectionId}/items`,
        paramsFrom(opts, [["maxDepth", "maxDepth"]]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionItemsResource
  .command("add")
  .description("Add items to a collection")
  .argument("<collection-id>", "Collection block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-items add collection-123 --body-file items.json --json",
  )
  .action(async (collectionId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.post(`/collections/${collectionId}/items`, requireJsonPayload(opts));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionItemsResource
  .command("update")
  .description("Update collection items")
  .argument("<collection-id>", "Collection block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-items update collection-123 --body-file update.json --json",
  )
  .action(async (collectionId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.put(`/collections/${collectionId}/items`, requireJsonPayload(opts));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionItemsResource
  .command("delete")
  .description("Delete collection items")
  .argument("<collection-id>", "Collection block ID")
  .option("--ids <ids>", "Comma-separated item IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-items delete collection-123 --ids item-1,item-2 --json",
  )
  .action(async (collectionId: string, opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { idsToDelete: csv(opts.ids, "ids") };
      const data = await client.delete(`/collections/${collectionId}/items`, payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
