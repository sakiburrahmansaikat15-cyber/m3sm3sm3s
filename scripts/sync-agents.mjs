// Copies CLAUDE.md → AGENTS.md and GEMINI.md so every coding agent reads the same guide.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("CLAUDE.md", "utf8");
const note = "<!-- Auto-generated from CLAUDE.md by `npm run sync-agents`. Edit CLAUDE.md instead. -->\n\n";
for (const f of ["AGENTS.md", "GEMINI.md"]) writeFileSync(f, note + src);
console.log("Synced AGENTS.md and GEMINI.md from CLAUDE.md");
