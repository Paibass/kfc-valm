import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const googleFormFields = {
  fecha: "entry.133549451",
  chk4: "entry.978360335",
  cajero: "entry.237002527",
  detalle: "entry.529180955",
  total: "entry.718068187",
};
try {
  await pool.query(`INSERT INTO integraciones_local (local_id, google_form_action, google_form_fields, apps_script_url, spreadsheet_url)
    SELECT id, $1, $2::jsonb, $3, $4
    FROM locales WHERE upper(codigo) = 'LINIERS'
    ON CONFLICT (local_id) DO UPDATE SET google_form_action = EXCLUDED.google_form_action, google_form_fields = EXCLUDED.google_form_fields, apps_script_url = EXCLUDED.apps_script_url, spreadsheet_url = COALESCE(EXCLUDED.spreadsheet_url, integraciones_local.spreadsheet_url)`, [process.env.NEXT_PUBLIC_GOOGLE_FORM_ACTION, JSON.stringify(googleFormFields), process.env.DAILY_STATS_SCRIPT_URL, process.env.LINIERS_SPREADSHEET_URL || null]);
  console.log("Liniers integration migrated to google_form_fields");
} finally { await pool.end(); }
