import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import solc from "solc";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const contractsDir = path.join(projectRoot, "contracts");
const sourceFiles = ["ABPPoint.sol", "ABPMarketEscrow.sol", "ABPHybridCheckout.sol"];

const sources = Object.fromEntries(sourceFiles.map((file) => [file, { content: fs.readFileSync(path.join(contractsDir, file), "utf8") }]));
const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

function findImports(importPath) {
  try {
    const resolved = require.resolve(importPath, { paths: [projectRoot] });
    return { contents: fs.readFileSync(resolved, "utf8") };
  } catch (error) {
    return { error: `Unable to resolve import ${importPath}: ${error.message}` };
  }
}

const result = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
for (const diagnostic of result.errors ?? []) {
  const stream = diagnostic.severity === "error" ? console.error : console.warn;
  stream(diagnostic.formattedMessage.trim());
}
if ((result.errors ?? []).some((diagnostic) => diagnostic.severity === "error")) process.exit(1);

const outputDir = path.join(contractsDir, "artifacts");
fs.mkdirSync(outputDir, { recursive: true });
for (const [sourceFile, contracts] of Object.entries(result.contracts)) {
  for (const [contractName, artifact] of Object.entries(contracts)) {
    if (!sourceFiles.includes(sourceFile)) continue;
    fs.writeFileSync(path.join(outputDir, `${contractName}.json`), JSON.stringify({ contractName, sourceFile, compiler: solc.version(), abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` }, null, 2));
  }
}
console.log(`CONTRACT COMPILE PASS compiler=${solc.version()} artifacts=${outputDir}`);
