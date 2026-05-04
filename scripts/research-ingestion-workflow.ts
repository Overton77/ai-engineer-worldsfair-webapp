/// <reference types="node" />

import { parseCli, loadWorkflowConfig } from "./research-ingestion-workflow/config";
import { doctor, printPlan, runWorkflow } from "./research-ingestion-workflow/runner";

async function main() {
  const options = parseCli();
  const config = await loadWorkflowConfig(options);

  if (options.command === "doctor") {
    await doctor(config, options);
    return;
  }

  if (options.command === "plan") {
    await printPlan(config, options);
    return;
  }

  if (options.command === "run" || options.command === "resume") {
    await runWorkflow(config, options);
    return;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
