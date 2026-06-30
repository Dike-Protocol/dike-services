import { mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const contractsRoot =
  process.env.DIKE_CONTRACTS_ROOT ?? "/Users/sachplayz/Projects/Dike_Stellar/dike-contracts";
const wasmRoot = path.join(contractsRoot, "target", "stellar");
const outputRoot = path.join(process.cwd(), "src", "contracts", "generated");

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const files = (await readdir(wasmRoot)).filter((file) => file.endsWith(".wasm"));

  for (const file of files) {
    const contractName = file.replace(/\.wasm$/, "");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `dike-${contractName}-`));

    await execFileAsync("stellar", [
      "contract",
      "bindings",
      "typescript",
      "--wasm",
      path.join(wasmRoot, file),
      "--output-dir",
      tempDir,
      "--overwrite",
    ]);

    await rename(
      path.join(tempDir, "src", "index.ts"),
      path.join(outputRoot, `${contractName}.ts`),
    );
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
