import crypto from "node:crypto";
import readline from "node:readline";
import { Pool } from "pg";

const [codigo] = process.argv.slice(2);
if (!codigo || process.argv.length !== 3) {
  throw new Error("Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/set-local-password.mjs CODIGO_LOCAL");
}

function promptHidden(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const wasRaw = input.isRaw;
    let value = "";
    process.stderr.write(prompt);
    readline.emitKeypressEvents(input);
    if (input.isTTY) input.setRawMode(true);
    const cleanup = () => {
      input.removeListener("data", onData);
      if (input.isTTY) input.setRawMode(Boolean(wasRaw));
    };
    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === "\u0003") {
        cleanup();
        process.stderr.write("\n");
        reject(new Error("Operación cancelada"));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        process.stderr.write("\n");
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (!key.startsWith("\u001b")) {
        value += key;
      }
    };
    input.on("data", onData);
  });
}

const password = await promptHidden("Nueva contraseña (mínimo 8 caracteres): ");
if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
const confirmation = await promptHidden("Repetir contraseña: ");
if (password !== confirmation) throw new Error("Las contraseñas no coinciden");

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const local = await pool.query("SELECT id FROM locales WHERE upper(codigo) = upper($1) AND activo = TRUE", [codigo]);
  if ((local.rowCount ?? 0) === 0) throw new Error("Local inexistente o inactivo");
  await pool.query(`INSERT INTO credenciales_local (local_id, password_hash) VALUES ($1, $2)
    ON CONFLICT (local_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`, [local.rows[0].id, `${salt}:${hash}`]);
  console.log(`Contraseña actualizada para ${codigo.toUpperCase()}.`);
} finally {
  await pool.end();
}
