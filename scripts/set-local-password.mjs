import crypto from "node:crypto";
import { Pool } from "pg";

const [codigo, password] = process.argv.slice(2);
if (!codigo || !password || password.length < 8) throw new Error("Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/set-local-password.mjs CODIGO CONTRASEÑA (mínimo 8 caracteres)");
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const local = await pool.query("SELECT id FROM locales WHERE upper(codigo) = upper($1) AND activo = TRUE", [codigo]);
  if (local.rowCount === 0) throw new Error("Local inexistente o inactivo");
  await pool.query(`INSERT INTO credenciales_local (local_id, password_hash) VALUES ($1, $2)
    ON CONFLICT (local_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`, [local.rows[0].id, `${salt}:${hash}`]);
  console.log(`Contraseña actualizada para ${codigo.toUpperCase()}.`);
} finally { await pool.end(); }
