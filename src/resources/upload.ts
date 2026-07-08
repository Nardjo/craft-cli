import { Command } from "commander";
import { readFileSync } from "fs";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { paramsFrom, writeOutput, type OutputOpts } from "../lib/payload.js";

interface UploadOpts extends OutputOpts {
  file?: string;
  contentType?: string;
  position?: string;
  pageId?: string;
  date?: string;
  siblingId?: string;
}

export const uploadResource = new Command("upload").description(
  "Upload a file and insert it into Craft",
);

uploadResource
  .command("file")
  .description("Upload a file to a page, daily note, or sibling position")
  .requiredOption("--file <path>", "File to upload")
  .option("--content-type <type>", "Content-Type header", "application/octet-stream")
  .requiredOption("--position <pos>", "start, end, before, or after")
  .option("--page-id <id>", "Page block ID for start/end")
  .option("--date <date>", "Daily note date for start/end")
  .option("--sibling-id <id>", "Sibling block ID for before/after")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  craft-cli upload file --file image.png --position end --page-id doc-123 --content-type image/png --json",
  )
  .action(async (opts: UploadOpts) => {
    try {
      const data = await client.postRaw("/upload", readFileSync(opts.file!), {
        params: paramsFrom(opts, [
          ["position", "position"],
          ["pageId", "pageId"],
          ["date", "date"],
          ["siblingId", "siblingId"],
        ]),
        headers: { "Content-Type": opts.contentType ?? "application/octet-stream" },
      });
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
