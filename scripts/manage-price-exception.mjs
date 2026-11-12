import { Pool } from "pg";

const [action, localCode, productCode, price] = process.argv.slice(2);
const usage = "Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/manage-price-exception.mjs set|deactivate CODIGO_LOCAL CODIGO_PRODUCTO [PRECIO]";
if (!['set', 'deactivate'].includes(action) || !localCode || !productCode || (action === 'set' && (!price || !/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) > 9999999999.99)) || (action === 'deactivate' && price !== undefined)) {
  throw new Error(usage);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const local = await pool.query("SELECT id FROM locales WHERE upper(codigo) = upper($1) AND activo = TRUE", [localCode]);
  const product = await pool.query("SELECT id FROM productos WHERE upper(codigo) = upper($1) AND activo = TRUE", [productCode]);
  if (local.rowCount !== 1) throw new Error(`Local no encontrado o inactivo: ${localCode}`);
  if (product.rowCount !== 1) throw new Error(`Producto no encontrado o inactivo: ${productCode}`);

  if (action === 'set') {
    const result = await pool.query(`INSERT INTO precios_excepciones (local_id, producto_id, precio, activo)
      VALUES ($1, $2, $3::numeric(12,2), TRUE)
      ON CONFLICT (local_id, producto_id) DO UPDATE SET precio = EXCLUDED.precio, activo = TRUE, updated_at = now()
      RETURNING id`, [local.rows[0].id, product.rows[0].id, price]);
    if (result.rowCount !== 1) throw new Error("No se pudo guardar la excepción");
  } else {
    const result = await pool.query(`UPDATE precios_excepciones SET activo = FALSE, updated_at = now()
      WHERE local_id = $1 AND producto_id = $2 AND activo = TRUE RETURNING id`, [local.rows[0].id, product.rows[0].id]);
    if (result.rowCount !== 1) throw new Error("No existe una excepción activa para ese local y producto");
  }
  console.log(action === 'set' ? `Excepción de precio activada para ${localCode}/${productCode}.` : `Excepción desactivada para ${localCode}/${productCode}.`);
} finally {
  await pool.end();
}
