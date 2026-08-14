// Config: única fuente de conexión a la base de datos. Ningún otro
// archivo del proyecto debe crear su propio Pool — todos importan
// este mismo pool para reutilizar conexiones.
import pg from "pg";
import "dotenv/config";

// Supabase (y la mayoría de los Postgres administrados) exige SSL.
// En local (Postgres propio sin SSL) esto no molesta si no está seteado.
const usaSSL = process.env.DATABASE_SSL !== "false";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: usaSSL ? { rejectUnauthorized: false } : false,
  max: 5, // conservador para el plan gratuito de Supabase (límite de conexiones bajo)
});

pool.on("error", (err) => {
  // Un error en una conexión inactiva del pool no debe tumbar el
  // proceso completo — se registra y el pool descarta esa conexión.
  console.error("Error inesperado en el pool de PostgreSQL:", err);
});
