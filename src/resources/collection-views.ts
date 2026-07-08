import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { requireJsonPayload, writeOutput, type BodyOpts, type OutputOpts } from "../lib/payload.js";

interface BodyOutputOpts extends OutputOpts, BodyOpts {}

export const collectionViewsResource = new Command("collection-views").description(
  "Manage Craft collection view definitions",
);

collectionViewsResource
  .command("list")
  .description("List view definitions for a collection")
  .argument("<collection-id>", "Collection block ID")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli collection-views list collection-123 --json")
  .action(async (collectionId: string, opts: OutputOpts) => {
    try {
      const data = await client.get(`/collections/${collectionId}/views`);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionViewsResource
  .command("create")
  .description("Create a collection view definition")
  .argument("<collection-id>", "Collection block ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-views create collection-123 --body-file view.json --json",
  )
  .action(async (collectionId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.post(`/collections/${collectionId}/views`, requireJsonPayload(opts));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionViewsResource
  .command("update")
  .description("Update a collection view definition")
  .argument("<collection-id>", "Collection block ID")
  .argument("<view-id>", "View ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-views update collection-123 view-board --body-file view.json --json",
  )
  .action(async (collectionId: string, viewId: string, opts: BodyOutputOpts) => {
    try {
      const data = await client.put(
        `/collections/${collectionId}/views/${viewId}`,
        requireJsonPayload(opts),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

collectionViewsResource
  .command("delete")
  .description("Delete a collection view definition")
  .argument("<collection-id>", "Collection block ID")
  .argument("<view-id>", "View ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli collection-views delete collection-123 view-board --json",
  )
  .action(async (collectionId: string, viewId: string, opts: OutputOpts) => {
    try {
      const data = await client.delete(`/collections/${collectionId}/views/${viewId}`);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
