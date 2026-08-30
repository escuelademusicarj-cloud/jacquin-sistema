// Dominio: reglas puras del módulo de Pensum académico.
// El contenido (niveles/secciones/temas) se siembra por SQL, no se crea
// desde la app — lo único editable desde la interfaz es el enlace de
// Drive de cada tema, así que la única validación real es esa.

export function validarEnlaceDrive(enlace) {
  if (enlace === null || enlace === undefined || enlace === "") return null;
  const valor = String(enlace).trim();
  if (valor === "") return null;
  if (!/^https?:\/\//i.test(valor)) {
    throw new Error("El enlace debe empezar con http:// o https://");
  }
  return valor;
}
