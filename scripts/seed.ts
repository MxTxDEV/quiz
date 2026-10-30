import "dotenv/config";
import { installBuiltinTemplates } from "@/lib/services/templates";
import { sql } from "@/lib/db";

const count = await installBuiltinTemplates();
console.log(`${count} modelos embutidos instalados/atualizados.`);
await sql.end();
