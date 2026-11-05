import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const locals = [
  ["MATADEROS", "KFC Mataderos", 1],
  ["RAMOS_MEJIA", "KFC Ramos Mejía", 1],
  ["CABILDO_1", "KFC Cabildo 1", 1],
  ["CABILDO_2", "KFC Cabildo 2", 1],
  ["FLORES", "KFC Flores", 2],
];

try {
  for (const [codigo, nombre, listaId] of locals) {
    await pool.query(
      `INSERT INTO locales (codigo, nombre, lista_precios_id, activo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, lista_precios_id = EXCLUDED.lista_precios_id, activo = TRUE`,
      [codigo, nombre, listaId],
    );
  }
  console.log("Locales inicializados sin modificar LINIERS.");
} finally {
  await pool.end();
}
