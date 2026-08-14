// Crea el primer usuario administrador para poder probar el login.
// El email es un dominio GENÉRICO de prueba (admin@jacquin.local por
// defecto) — no hace falta un dominio propio de la academia todavía,
// eso se puede cambiar más adelante sin afectar nada de la arquitectura.
import "dotenv/config";
import { altaUsuario } from "../src/servicios/identidad/servicio.js";
import { buscarRolPorNombre } from "../src/persistencia/identidad/repositorio.js";
import { pool } from "../src/config/db.js";

const EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@jacquin.local";
const PASSWORD = process.env.ADMIN_SEED_PASSWORD || "CambiarEnPrimerIngreso123";

async function seed() {
  const rolAdmin = await buscarRolPorNombre("ADMINISTRADOR");
  if (!rolAdmin) {
    throw new Error("No existe el rol ADMINISTRADOR — corré `npm run migrate` primero.");
  }

  const usuario = await altaUsuario({
    nombre: "Administrador",
    email: EMAIL,
    password: PASSWORD,
    rolId: rolAdmin.id,
  });

  console.log("Usuario admin creado:");
  console.log("  Email:", usuario.email);
  console.log("  Contraseña temporal:", PASSWORD);
  console.log("(Dominio genérico de prueba — cambiar por el real cuando la academia lo defina.)");
  await pool.end();
}

seed().catch((err) => {
  console.error("Error creando el admin:", err.message);
  process.exit(1);
});
