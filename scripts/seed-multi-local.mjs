import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const products = JSON.parse(await readFile(new URL("../public/products.json", import.meta.url), "utf8"));

try {
  await pool.query("BEGIN");
  const { rows: lists } = await pool.query(
    `INSERT INTO listas_precios (nombre, activa)
     VALUES ('Lista actual', TRUE), ('Lista 2', TRUE)
     ON CONFLICT (nombre) DO UPDATE SET activa = EXCLUDED.activa
     RETURNING id, nombre`,
  );
  const currentList = lists.find((item) => item.nombre === "Lista actual");
  if (!currentList) throw new Error("Lista actual was not created");

  const { rows: locations } = await pool.query(
    `INSERT INTO locales (codigo, nombre, activo, lista_precios_id)
     VALUES ('LINIERS', 'KFC Liniers', TRUE, $1)
     ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, lista_precios_id = EXCLUDED.lista_precios_id
     RETURNING id`,
    [currentList.id],
  );
  const localId = locations[0].id;

  const cashiers = [
    ["Sabri", ""], ["Vanina", "retuerto.vainina"], ["Paiva", "paiva.joaquin"],
    ["Mia", "quiroz.mia"], ["Cande", ""], ["Santi", "crinigan.santiago"],
    ["Kiara", "isasi.kiara"], ["Emma", "mazza.lara"],
  ];
  for (const [nombre, usuarioPos] of cashiers) {
    await pool.query(
      `INSERT INTO cajeros (local_id, nombre, usuario_pos, es_referente, activo)
       VALUES ($1, $2, NULLIF($3, ''), FALSE, TRUE)
       ON CONFLICT (local_id, nombre) DO UPDATE SET usuario_pos = EXCLUDED.usuario_pos, activo = TRUE`,
      [localId, nombre, usuarioPos],
    );
  }

  for (const product of products) {
    const { rows } = await pool.query(
      `INSERT INTO productos (codigo, nombre, categoria, tipo, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria, tipo = EXCLUDED.tipo, activo = TRUE
       RETURNING id`,
      [product.id, product.nombre, product.categoria, product.tipo],
    );
    await pool.query(
      `INSERT INTO precios_producto (producto_id, lista_precios_id, precio, activo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [rows[0].id, currentList.id, product.precio],
    );
  }

  await pool.query("COMMIT");
  console.log(JSON.stringify({ ok: true, local: "LINIERS", products: products.length }));
} catch {
  await pool.query("ROLLBACK");
  console.error("Database seed failed");
  process.exitCode = 1;
} finally {
  await pool.end();
}
