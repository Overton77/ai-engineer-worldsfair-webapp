/// <reference types="node" />

import { spawn } from "node:child_process";

export async function runCommand(
  label: string,
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  console.log(`\n========== ${label} ==========`);
  console.log(`> ${command} ${args.join(" ")}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited ${code}`));
    });
  });
}

export async function captureCommand(
  label: string,
  command: string,
  args: string[],
  cwd: string,
): Promise<string> {
  console.log(`\n========== ${label} ==========`);
  console.log(`> ${command} ${args.join(" ")}`);

  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${label} exited ${code}\n${stderr}`));
    });
  });
}
