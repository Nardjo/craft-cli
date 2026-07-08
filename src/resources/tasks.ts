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
  scope?: string;
  documentId?: string;
}

interface AddOpts extends OutputOpts, BodyOpts {
  markdown?: string;
  location?: string;
  date?: string;
  documentId?: string;
  scheduleDate?: string;
  deadlineDate?: string;
}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

interface UpdateOpts extends OutputOpts, BodyOpts {
  id?: string;
  markdown?: string;
  state?: string;
  scheduleDate?: string;
  deadlineDate?: string;
}

export const tasksResource = new Command("tasks").description(
  "List, add, update, and delete Craft tasks",
);

tasksResource
  .command("list")
  .description("Retrieve tasks from active, upcoming, inbox, logbook, document, or all scopes")
  .requiredOption("--scope <scope>", "active, upcoming, inbox, logbook, document, or all")
  .option("--document-id <id>", "Required when scope is document")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli tasks list --scope active --json\n  craft-cli tasks list --scope document --document-id doc-123 --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = await client.get(
        "/tasks",
        paramsFrom(opts, [
          ["scope", "scope"],
          ["documentId", "documentId"],
        ]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

tasksResource
  .command("add")
  .description("Create tasks in inbox, daily notes, or documents")
  .option("--markdown <text>", "Task markdown for a single task")
  .option("--location <type>", "inbox, dailyNote, or document", "inbox")
  .option("--date <date>", "Daily note date when location is dailyNote")
  .option("--document-id <id>", "Document ID when location is document")
  .option("--schedule-date <date>", "Task schedule date")
  .option("--deadline-date <date>", "Task deadline date")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli tasks add --markdown "Prepare slides" --location inbox --json\n  craft-cli tasks add --body-file tasks.json --json',
  )
  .action(async (opts: AddOpts) => {
    try {
      const fallback = opts.markdown
        ? {
            tasks: [
              {
                markdown: opts.markdown,
                taskInfo: {
                  ...(opts.scheduleDate && { scheduleDate: opts.scheduleDate }),
                  ...(opts.deadlineDate && { deadlineDate: opts.deadlineDate }),
                },
                location: taskLocation(opts),
              },
            ],
          }
        : undefined;
      const data = await client.post("/tasks", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

tasksResource
  .command("update")
  .description("Update tasks across the space")
  .option("--id <id>", "Task ID for a simple update")
  .option("--markdown <text>", "Updated markdown")
  .option("--state <state>", "Task state, for example todo, done, or canceled")
  .option("--schedule-date <date>", "Updated schedule date")
  .option("--deadline-date <date>", "Updated deadline date")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli tasks update --id task-1 --state done --json\n  craft-cli tasks update --body-file update.json --json",
  )
  .action(async (opts: UpdateOpts) => {
    try {
      const taskInfo = {
        ...(opts.state && { state: opts.state }),
        ...(opts.scheduleDate && { scheduleDate: opts.scheduleDate }),
        ...(opts.deadlineDate && { deadlineDate: opts.deadlineDate }),
      };
      const fallback = opts.id
        ? {
            tasksToUpdate: [
              {
                id: opts.id,
                ...(opts.markdown && { markdown: opts.markdown }),
                ...(Object.keys(taskInfo).length > 0 && { taskInfo }),
              },
            ],
          }
        : undefined;
      const data = await client.put("/tasks", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

tasksResource
  .command("delete")
  .description("Delete tasks by ID")
  .option("--ids <ids>", "Comma-separated task IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli tasks delete --ids task-1,task-2 --json")
  .action(async (opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { idsToDelete: csv(opts.ids, "ids") };
      const data = await client.delete("/tasks", payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

function taskLocation(opts: AddOpts): Record<string, string> {
  if (opts.location === "dailyNote") {
    return { type: "dailyNote", date: opts.date ?? "today" };
  }
  if (opts.location === "document") {
    return { type: "document", documentId: opts.documentId ?? "" };
  }
  return { type: "inbox" };
}
