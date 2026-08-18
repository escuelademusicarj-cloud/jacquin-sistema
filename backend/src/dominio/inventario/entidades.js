export function crearItemInventario({ nombre, categoria, marca, serie, cantidad, estado, ubicacion, fecha, valor, proveedor, responsable, observaciones }) {
  if (!nombre || !nombre.trim()) throw new Error("El elemento necesita un nombre.");
  if (!cantidad || Number(cantidad) <= 0) throw new Error("La cantidad debe ser mayor a cero.");
  return {
    nombre: nombre.trim(), categoria: categoria || null, marca: marca || null, serie: serie || null,
    cantidad: Number(cantidad), estado: estado || "Bueno", ubicacion: ubicacion || null, fecha: fecha ?? null,
    valor: valor != null ? Number(valor) : 0, proveedor: proveedor || null, responsable: responsable || null,
    observaciones: observaciones || null,
  };
}
