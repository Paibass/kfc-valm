import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/db";

const query = <T extends Record<string, unknown> = Record<string, unknown>>(text: string, values: unknown[] = []) => getDbPool().query<T>(text, values);

export const LOCAL_SESSION_COOKIE = "kfc_local_session";
const SESSION_DAYS = 7;

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function createLocalSession(localId: number) {
  const id = crypto.randomUUID();
  await query("INSERT INTO sesiones_local (id, local_id, expires_at) VALUES ($1, $2, now() + interval '7 days')", [id, localId]);
  const store = await cookies();
  store.set(LOCAL_SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 });
}

export async function getLocalSession() {
  const store = await cookies();
  const token = store.get(LOCAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<{ local_id: number; codigo: string; nombre: string }>(
    "SELECT s.local_id, l.codigo, l.nombre FROM sesiones_local s JOIN locales l ON l.id = s.local_id WHERE s.id = $1 AND s.expires_at > now()",
    [token],
  );
  return result.rows[0] ?? null;
}

export async function loginLocal(codigo: string, password: string) {
  const localResult = await query<{ id: number; codigo: string; nombre: string }>("SELECT id, codigo, nombre FROM locales WHERE upper(codigo) = upper($1) AND activo = true", [codigo.trim()]);
  const local = localResult.rows[0];
  if (!local) return false;
  const credential = await query<{ password_hash: string }>("SELECT password_hash FROM credenciales_local WHERE local_id = $1", [local.id]);
  const valid = credential.rows[0] ? verifyPassword(password, credential.rows[0].password_hash) : password === "1234";
  if (!valid) return false;
  if (!credential.rows[0]) await query("INSERT INTO credenciales_local (local_id, password_hash) VALUES ($1, $2)", [local.id, hashPassword("1234")]);
  await createLocalSession(local.id);
  return local;
}

export async function logoutLocal() {
  const store = await cookies();
  const token = store.get(LOCAL_SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sesiones_local WHERE id = $1", [token]);
  store.delete(LOCAL_SESSION_COOKIE);
}

export async function changeLocalPassword(currentPassword: string, newPassword: string) {
  const session = await getLocalSession();
  if (!session || newPassword.length < 4) return false;
  const result = await query<{ password_hash: string }>("SELECT password_hash FROM credenciales_local WHERE local_id = $1", [session.local_id]);
  if (!result.rows[0] || !verifyPassword(currentPassword, result.rows[0].password_hash)) return false;
  await query("UPDATE credenciales_local SET password_hash = $1, updated_at = now() WHERE local_id = $2", [hashPassword(newPassword), session.local_id]);
  return true;
}
