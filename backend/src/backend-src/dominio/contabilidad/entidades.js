// Dominio: reglas puras del módulo de Contabilidad. Sin categorías
// "oficiales" cerradas — Sergio pidió texto libre acá, se valida solo
// lo mínimo indispensable.
export function crearIngreso({ fecha, concepto, programa, categoria, cliente, metodo, estado, valor }) {
  if (!concepto || !concepto.trim()) throw new Error("El ingreso necesita un concepto.");
  if (valor == null || Number(valor) <= 0) throw new Error("El ingreso necesita un valor mayor a cero.");
  return { fecha: fecha ?? null, concepto: concepto.trim(), programa: programa || null, categoria: categoria || null,
    cliente: cliente || null, metodo: metodo || null, estado: estado || "pendiente", valor: Number(valor) };
}

export function crearGasto({ fecha, concepto, categoria, proveedor, metodo, estado, valor }) {
  if (!concepto || !concepto.trim()) throw new Error("El gasto necesita un concepto.");
  if (valor == null || Number(valor) <= 0) throw new Error("El gasto necesita un valor mayor a cero.");
  return { fecha: fecha ?? null, concepto: concepto.trim(), categoria: categoria || null, proveedor: proveedor || null,
    metodo: metodo || null, estado: estado || "pendiente", valor: Number(valor) };
}

export function crearCompra({ fecha, articulo, categoria, proveedor, cantidad, valorUnit, metodo, estado }) {
  if (!articulo || !articulo.trim()) throw new Error("La compra necesita un artículo.");
  if (!cantidad || Number(cantidad) <= 0) throw new Error("La compra necesita una cantidad mayor a cero.");
  if (valorUnit == null || Number(valorUnit) <= 0) throw new Error("La compra necesita un valor unitario mayor a cero.");
  const cant = Number(cantidad), vUnit = Number(valorUnit);
  return { fecha: fecha ?? null, articulo: articulo.trim(), categoria: categoria || null, proveedor: proveedor || null,
    cantidad: cant, valorUnit: vUnit, valorTotal: cant * vUnit, metodo: metodo || null, estado: estado || "pendiente" };
}

export function crearNomina({ mes, empleadoId, cargo, horas, tarifa, bonos, descuentos, metodo, estado }) {
  if (!empleadoId) throw new Error("El pago de nómina necesita un empleado.");
  if (!horas || Number(horas) <= 0) throw new Error("Las horas deben ser mayores a cero.");
  if (!tarifa || Number(tarifa) <= 0) throw new Error("La tarifa debe ser mayor a cero.");
  const h = Number(horas), t = Number(tarifa), b = Number(bonos || 0), d = Number(descuentos || 0);
  const basico = h * t;
  return { mes: mes ?? null, empleadoId, cargo: cargo || null, horas: h, tarifa: t, basico, bonos: b, descuentos: d,
    neto: basico + b - d, metodo: metodo || null, estado: estado || "pendiente" };
}
