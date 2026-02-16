/* ===== Funciones Utilitarias ===== */

/** Formato moneda ARS: $1.250.000 */
const fmt = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Calcula ajuste por dia/horario. Retorna { aj: number, ajDesc: string } */
const calcAjuste = (dia, hor) => {
  let aj = 0;
  const ajD = [];
  if (hor.includes('Nocturno')) {
    aj += precios.ajustes.nocturno.porcentaje;
    ajD.push('Nocturno +' + precios.ajustes.nocturno.porcentaje + '%');
  }
  if (dia === 'Domingo') {
    aj += precios.ajustes.domingo.porcentaje;
    ajD.push('Domingo +' + precios.ajustes.domingo.porcentaje + '%');
  }
  if (dia === 'Sabado tarde') {
    aj += precios.ajustes.sabado_post_13.porcentaje;
    ajD.push('Sab post 13hs +' + precios.ajustes.sabado_post_13.porcentaje + '%');
  }
  return { aj, ajDesc: ajD.length ? ajD.join(', ') : 'Ninguno' };
};

/** Descuento mayorista para trampas UV segun cantidad total */
const getDescuentoTrampa = (t) => {
  const tr = precios.insumos.trampa_uv.descuentos_mayoristas;
  for (const x of tr) {
    if (t >= x.desde && (x.hasta === null || t <= x.hasta)) return x.descuento;
  }
  return 0;
};

/** Numeracion correlativa de cotizaciones via localStorage */
const getNextCotNumber = () => {
  let last = parseInt(localStorage.getItem('lastCotNumber')) || 0;
  last++;
  localStorage.setItem('lastCotNumber', last);
  return String(last).padStart(4, '0');
};
