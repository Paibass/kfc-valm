import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(`INSERT INTO integraciones_local (local_id, google_form_action, apps_script_url, spreadsheet_url, form_fecha_field, form_chk4_field, form_cajero_field, form_detalle_field, form_total_field)
    SELECT id, $1, $2, $3, 'entry.133549451', 'entry.978360335', 'entry.237002527', 'entry.529180955', 'entry.718068187'
    FROM locales WHERE upper(codigo) = 'LINIERS'
    ON CONFLICT (local_id) DO UPDATE SET google_form_action = EXCLUDED.google_form_action, apps_script_url = EXCLUDED.apps_script_url, spreadsheet_url = COALESCE(EXCLUDED.spreadsheet_url, integraciones_local.spreadsheet_url), form_fecha_field = EXCLUDED.form_fecha_field, form_chk4_field = EXCLUDED.form_chk4_field, form_cajero_field = EXCLUDED.form_cajero_field, form_detalle_field = EXCLUDED.form_detalle_field, form_total_field = EXCLUDED.form_total_field`, [process.env.NEXT_PUBLIC_GOOGLE_FORM_ACTION, process.env.DAILY_STATS_SCRIPT_URL, process.env.LINIERS_SPREADSHEET_URL || null]);
  console.log("Liniers integration migrated");
} finally { await pool.end(); }
