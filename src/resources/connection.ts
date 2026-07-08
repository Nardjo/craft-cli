import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { writeOutput, type OutputOpts } from "../lib/payload.js";

export const connectionResource = new Command("connection").description(
  "Inspect Craft connection metadata",
);

connectionResource
  .command("info")
  .description("Get space metadata, timezone, current time, and deep-link templates")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli connection info --json")
  .action(async (opts: OutputOpts) => {
    try {
      const data = await client.get("/connection");
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
