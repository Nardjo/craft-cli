import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import {
  csv,
  readJsonPayload,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface CreateOpts extends OutputOpts, BodyOpts {
  name?: string;
  names?: string;
  parentFolderId?: string;
}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

interface MoveOpts extends OutputOpts, BodyOpts {
  ids?: string;
  destination?: string;
  parentFolderId?: string;
}

export const foldersResource = new Command("folders").description(
  "List, create, move, and delete Craft folders",
);

foldersResource
  .command("list")
  .description("List built-in locations and user folders with document counts")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli folders list --json")
  .action(async (opts: OutputOpts) => {
    try {
      const data = await client.get("/folders");
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

foldersResource
  .command("create")
  .description("Create one or more folders")
  .option("--name <name>", "Folder name")
  .option("--names <names>", "Comma-separated folder names")
  .option("--parent-folder-id <id>", "Create folders inside this parent folder")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli folders create --name "Project" --json\n  craft-cli folders create --names "Marketing,Engineering" --json',
  )
  .action(async (opts: CreateOpts) => {
    try {
      const names = opts.names ? csv(opts.names, "names") : opts.name ? [opts.name] : undefined;
      const fallback = names
        ? {
            folders: names.map((name) => ({
              name,
              ...(opts.parentFolderId && { parentFolderId: opts.parentFolderId }),
            })),
          }
        : undefined;
      const data = await client.post("/folders", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

foldersResource
  .command("delete")
  .description("Delete folders by ID")
  .option("--ids <ids>", "Comma-separated folder IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli folders delete --ids folder-1,folder-2 --json")
  .action(async (opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { folderIds: csv(opts.ids, "ids") };
      const data = await client.delete("/folders", payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

foldersResource
  .command("move")
  .description("Move folders to root or inside another folder")
  .option("--ids <ids>", "Comma-separated folder IDs")
  .option("--destination <destination>", "Destination, usually root")
  .option("--parent-folder-id <id>", "Destination parent folder ID")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli folders move --ids folder-1 --destination root --json\n  craft-cli folders move --ids folder-1 --parent-folder-id folder-2 --json",
  )
  .action(async (opts: MoveOpts) => {
    try {
      const destination = opts.parentFolderId
        ? { parentFolderId: opts.parentFolderId }
        : (opts.destination ?? "root");
      const fallback = opts.ids ? { folderIds: csv(opts.ids, "ids"), destination } : undefined;
      const data = await client.put("/folders/move", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
