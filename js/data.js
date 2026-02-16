/* ===== Datos y Constantes ===== */

const STEPS = 8;

const precios = {
  metadata: { ultima_actualizacion: "2026-02-11", moneda: "ARS" },
  ajustes: {
    nocturno: { descripcion: "Servicio en horario nocturno", porcentaje: 15 },
    domingo: { descripcion: "Servicio en dia domingo", porcentaje: 35 },
    sabado_post_13: { descripcion: "Servicio sabado despues de las 13hs", porcentaje: 15 }
  },
  mano_de_obra: {
    valor_hora_operario: 50000,
    valor_hora_administrativa: 50000
  },
  insumos: {
    caja_cebadera: { nombre: "Caja cebadera", precio_unitario: 5500, unidad: "unidad" },
    placa_uv: { nombre: "Placa UV", precio_unitario: 1550, unidad: "unidad" },
    placa_roe: { nombre: "Placa ROE", precio_unitario: 2500, unidad: "unidad" },
    trampa_uv: {
      nombre: "Trampa UV", precio_unitario: 85000, unidad: "unidad",
      descuentos_mayoristas: [
        { desde: 1, hasta: 4, descuento: 0 },
        { desde: 5, hasta: 9, descuento: 5 },
        { desde: 10, hasta: 19, descuento: 10 },
        { desde: 20, hasta: null, descuento: 15 }
      ]
    },
    und_33_3: { nombre: "UND 33.3", precio_unitario: 2600, unidad: "unidad" },
    etiqueta_cb: { nombre: "Etiqueta CB", precio_unitario: 400, unidad: "unidad" },
    etiqueta_pared: { nombre: "Etiqueta Pared", precio_unitario: 275, unidad: "unidad" },
    metro_lineal_pincho: { nombre: "Metro lineal de Pincho", precio_unitario: 7800, unidad: "metro" }
  }
};
