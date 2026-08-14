// Script simple: ejecuta, en orden, cada .sql de db/migrations que
// todavía no se haya aplicado. Nada de librerías de migración
// externas — a propósito, para mantener esto simple en Fase 0.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_MIGRACIONES = path.join(__dirname, "..", "..", "db", "migrations");

async function asegurarTablaControl() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMP DEFAULT now()
    )
  `);
}

async function migrar() {
  await asegurarTablaControl();
  const archivos = fs.readdirSync(CARPETA_MIGRACIONES).filter((f) => f.endsWith(".sql")).sort();

  for (const archivo of archivos) {
    const { rows } = await pool.query(`SELECT 1 FROM migraciones_aplicadas WHERE nombre = $1`, [archivo]);
    if (rows.length > 0) {
      console.log(`Ya aplicada: ${archivo}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(CARPETA_MIGRACIONES, archivo), "utf-8");
    console.log(`Aplicando: ${archivo}`);
    await pool.query(sql);
    await pool.query(`INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)`, [archivo]);
  }

  console.log("Migraciones al día.");
  await pool.end();
}

migrar().catch((err) => {
  console.error("Error migrando:", err);
  process.exit(1);
});
