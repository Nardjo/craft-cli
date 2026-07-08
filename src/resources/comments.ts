import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { requireJsonPayload, writeOutput, type BodyOpts, type OutputOpts } from "../lib/payload.js";

interface AddOpts extends OutputOpts, BodyOpts {
  blockId?: string;
  content?: string;
}

export const commentsResource = new Command("comments").description("Add comments to Craft blocks");

commentsResource
  .command("add")
  .description("Add one or more comments to blocks")
  .option("--block-id <id>", "Block ID for a single comment")
  .option("--content <text>", "Comment content for a single comment")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli comments add --block-id block-123 --content "Please review" --json\n  craft-cli comments add --body-file comments.json --json',
  )
  .action(async (opts: AddOpts) => {
    try {
      const fallback =
        opts.blockId && opts.content
          ? { comments: [{ blockId: opts.blockId, content: opts.content }] }
          : undefined;
      const data = await client.post("/comments", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
