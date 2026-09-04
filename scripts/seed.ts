/**
 * Seed: imports the exams.ro export into Postgres and uploads files to R2.
 * Implemented in Stage 2 (docs/PLAN.md section 6). Flags: --dry-run, --only-db, --only-media.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const args = new Set(process.argv.slice(2));
console.log("seed: not implemented yet (Stage 2). Flags:", [...args].join(" ") || "none");
console.log("EXPORT_DIR =", process.env.EXPORT_DIR ?? "(unset)");
process.exit(0);
