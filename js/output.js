/* ===== Generacion de Documentos ===== */

/** Genera y descarga la cotizacion como PDF via dialogo de impresion */
const descargarPDF = () => {
  if (!window._cotHtmlContent) return alert('No hay cotizacion generada');

  // Abrir ventana con la cotizacion y lanzar impresion
  const w = window.open('', '_blank');
  w.document.write(window._cotHtmlContent);
  w.document.close();
  // Esperar renderizado completo antes de imprimir
  w.onload = () => setTimeout(() => w.print(), 400);
};

/** Abre la cotizacion HTML en nueva ventana */
const abrirCotizacion = () => {
  cotizacionWindow = window.open('', '_blank');
  cotizacionWindow.document.write(window._cotHtmlContent);
  cotizacionWindow.document.close();
};

/** Genera la cotizacion HTML completa y la abre */
const generarCotizacion = () => {
  const d = window._cotData;
  const rs = document.getElementById('razonSocial').value || 'SIN RAZON SOCIAL';
  const cuit = document.getElementById('cuit').value || 'XX-XXXXXXXX-X';
  const tel = document.getElementById('telefono').value || '-';
  const contacto = document.getElementById('contactoNombre').value || '-';
  const cargo = document.getElementById('contactoCargo').value || '-';
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const num = getNextCotNumber();
  window._cotNumero = num;

  let ubsHtml = '';
  d.ubicaciones.forEach(u => {
    const unicos = u.insumos.filter(i => i.tipo === 'U');
    const mensuales = u.insumos.filter(i => i.tipo === 'M');
    const calcIns = (arr) => {
      let t = 0, rows = '';
      arr.forEach(ins => {
        let p = ins.precio, dt = '';
        if (ins.desc === 100) { p = 0; dt = ' <small>(Bonificado)</small>'; }
        else if (ins.desc > 0) { p = ins.precio * (1 - ins.desc / 100); dt = ` <small>(-${ins.desc}%)</small>`; }
        const s = ins.cant * p;
        t += s;
        rows += `<tr><td>${ins.cant}</td><td>${ins.nombre}${dt}</td><td class="r">${fmt(p)}</td><td class="r">${fmt(s)}</td></tr>`;
      });
      return { rows, total: t };
    };
    const uData = calcIns(unicos), mData = calcIns(mensuales);
    const servM = u.costoOp + u.costoExtra + mData.total;

    ubsHtml += `<div class="ub-section">
      <h3>${u.nombre}</h3>
      <p class="ub-meta">${u.direccion} | ${u.m2} m2 | ${u.frecuencia}</p>
      <table><thead><tr><th colspan="4">Visitas regulares</th></tr></thead>
      <tbody><tr><td>Horas: ${u.horas}</td><td>Operarios: ${u.operarios}</td><td>Visitas/mes: ${u.visitas}</td><td class="r"><strong>${fmt(u.costoOp)}</strong></td></tr>
      <tr><td colspan="2">${u.dia} | ${u.horario}</td><td colspan="2">${u.ajuste > 0 ? '<span class="ajuste">Ajuste: ' + u.ajusteDesc + '</span>' : 'Sin ajuste'}</td></tr>
      </tbody></table>
      ${u.extVisitas > 0 ? '<table><thead><tr><th colspan="4">Visitas extraordinarias' + (u.extMotivo ? ' - ' + u.extMotivo : '') + '</th></tr></thead><tbody><tr><td>Horas: ' + u.extHoras + '</td><td>Operarios: ' + u.extOperarios + '</td><td>Visitas/mes: ' + u.extVisitas + '</td><td class="r"><strong>' + (u.extBonificada ? '<span style="color:#2e7d32">Bonificado -' + fmt(u.costoExtraBruto) + '</span>' : fmt(u.costoExtra)) + '</strong></td></tr><tr><td colspan="2">' + u.diaExtra + ' | ' + u.horarioExtra + '</td><td colspan="2">' + (u.ajusteExtra > 0 ? '<span class="ajuste">Ajuste: ' + u.ajusteExtraDesc + '</span>' : 'Sin ajuste') + '</td></tr></tbody></table>' : ''}`;

    if (uData.rows) ubsHtml += `<table><thead><tr><th>Cant</th><th>Insumo a abonar por unica vez</th><th class="r">P.Unit</th><th class="r">Subtotal</th></tr></thead><tbody>${uData.rows}<tr class="total"><td colspan="3">Total insumos a abonar por unica vez</td><td class="r">${fmt(uData.total)}</td></tr></tbody></table>`;
    if (mData.rows) ubsHtml += `<table><thead><tr><th>Cant</th><th>Insumo mensual</th><th class="r">P.Unit</th><th class="r">Subtotal</th></tr></thead><tbody>${mData.rows}<tr class="total"><td colspan="3">Total insumos mensuales</td><td class="r">${fmt(mData.total)}</td></tr></tbody></table>`;

    // Bonificaciones en cotizacion HTML
    let cotBonifRows = '';
    let cotTotalBonif = 0;
    if (u.extVisitas > 0 && u.extBonificada) {
      cotBonifRows += '<tr><td colspan="3">Visitas extraordinarias' + (u.extMotivo ? ' - ' + u.extMotivo : '') + '</td><td class="r" style="color:#2e7d32;font-weight:600">-' + fmt(u.costoExtraBruto) + '</td></tr>';
      cotTotalBonif += u.costoExtraBruto;
    }
    u.insumos.forEach(ins => {
      if (ins.desc > 0) {
        const montoBonif = ins.cant * ins.precio * ins.desc / 100;
        cotBonifRows += '<tr><td>' + ins.cant + 'x</td><td>' + ins.nombre + ' (' + ins.desc + '%)</td><td></td><td class="r" style="color:#2e7d32;font-weight:600">-' + fmt(montoBonif) + '</td></tr>';
        cotTotalBonif += montoBonif;
      }
    });
    if (cotBonifRows) ubsHtml += '<table class="bonif-table"><thead><tr><th colspan="4">Bonificaciones</th></tr></thead><tbody>' + cotBonifRows + '<tr class="total bonif-total"><td colspan="3">Total bonificado</td><td class="r">-' + fmt(cotTotalBonif) + '</td></tr></tbody></table>';

    ubsHtml += `<div class="ub-resumen"><div class="ub-line"><span>Servicio mensual (operativo + insumos)</span><span><strong>${fmt(servM)}</strong></span></div>
      ${u.costoExtra > 0 ? '<div class="ub-line sub"><span>Incluye visitas extraordinarias</span><span>' + fmt(u.costoExtra) + '</span></div>' : ''}
      ${uData.total > 0 ? '<div class="ub-line"><span>Insumos a abonar por unica vez</span><span><strong>' + fmt(uData.total) + '</strong></span></div>' : ''}</div></div>`;
  });

  const cotHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>COT-CP-${num} - ${rs}</title>
<style>
  @page { size: A4; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 11.5px; line-height: 1.4; }
  .doc { max-width: 750px; margin: 0 auto; padding: 10px; }

  /* === Header === */
  .doc-header { text-align: center; padding-bottom: 8px; margin-bottom: 10px;
    border-bottom: 3px solid #0a6e6f; }
  .doc-header h1 { font-size: 1.3em; color: #0a6e6f; letter-spacing: 0.5px; margin-bottom: 5px; }
  .doc-header .meta { display: flex; justify-content: space-between; font-size: 0.9em; color: #333; }
  .doc-header .meta strong { color: #0a6e6f; }

  /* === Cliente === */
  .cliente { border: 2px solid #0a6e6f; border-radius: 5px; padding: 10px 14px; margin-bottom: 10px; }
  .cliente h2 { font-size: 0.9em; color: #fff; background: #0a6e6f; display: inline-block;
    padding: 2px 10px; border-radius: 3px; margin-bottom: 6px; }
  .cliente-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
  .cliente-grid span { font-size: 0.85em; color: #555; }
  .cliente-grid strong { font-size: 0.85em; color: #1a1a1a; }

  /* === Ubicaciones === */
  .ub-section { border: 1.5px solid #ccc; border-radius: 5px; padding: 10px 12px; margin-bottom: 10px; }
  .ub-section h3 { font-size: 1em; color: #0a6e6f; margin-bottom: 2px;
    padding-bottom: 3px; border-bottom: 2px solid #0a6e6f; }
  .ub-meta { font-size: 0.8em; color: #555; margin-bottom: 6px; }

  /* === Tablas === */
  table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 0.85em; }
  th { background: #0a6e6f; color: #fff; padding: 4px 8px; text-align: left;
    font-weight: 600; font-size: 0.85em; }
  td { padding: 3px 8px; border-bottom: 1px solid #ddd; color: #1a1a1a; }
  .r { text-align: right; }
  tr.total td { font-weight: 700; border-top: 2px solid #0a6e6f; background: #e8f5f5; }
  .ajuste { font-size: 0.8em; color: #c67000; font-weight: 600; }

  /* === Tabla bonificaciones === */
  .bonif-table th { background: #2e7d32; }
  .bonif-total td { color: #2e7d32; border-top-color: #2e7d32; background: #e8f5e9; }

  /* === Resumen ubicacion === */
  .ub-resumen { background: #e8f5f5; border: 1px solid #b2dfdb; border-radius: 4px;
    padding: 6px 12px; margin-top: 6px; }
  .ub-line { display: flex; justify-content: space-between; padding: 2px 0;
    font-size: 0.9em; color: #1a1a1a; }
  .ub-line.sub { font-size: 0.8em; color: #666; padding-left: 12px; }

  /* === Resumen General === */
  .resumen-general { background: #0a6e6f; color: #fff; border-radius: 6px;
    padding: 14px 16px; margin-top: 12px; }
  .resumen-general h2 { font-size: 1em; margin-bottom: 8px; text-align: center;
    letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px; }
  .rg-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 0.9em; }
  .rg-line.big { font-size: 1.1em; font-weight: 700;
    border-top: 2px solid rgba(255,255,255,0.5); padding-top: 8px; margin-top: 4px; }
  .rg-line.iva { font-size: 0.85em; opacity: 0.9; }
  .rg-sep { margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.25); }

  /* === Footer === */
  .footer { text-align: center; margin-top: 15px; font-size: 0.75em; color: #888;
    border-top: 2px solid #0a6e6f; padding-top: 6px; }

  /* === Print === */
  @media print {
    body { font-size: 10.5px; line-height: 1.3; }
    .doc { padding: 0; }
    .doc-header { padding-bottom: 5px; margin-bottom: 6px; break-inside: avoid; }
    .doc-header h1 { font-size: 1.2em; margin-bottom: 3px; }
    .cliente { padding: 6px 10px; margin-bottom: 6px; break-inside: avoid; }
    .cliente h2 { margin-bottom: 4px; }
    .ub-section { padding: 6px 8px; margin-bottom: 6px; }
    .ub-section h3 { margin-bottom: 1px; padding-bottom: 2px; break-after: avoid; }
    .ub-meta { margin-bottom: 3px; break-after: avoid; }
    table { margin: 2px 0; break-inside: avoid; }
    th { padding: 2px 6px; }
    td { padding: 2px 6px; }
    .ub-resumen { padding: 4px 8px; margin-top: 3px; break-inside: avoid; }
    .ub-line { padding: 1px 0; }
    .resumen-general { padding: 10px 12px; margin-top: 6px; break-inside: avoid; }
    .resumen-general h2 { margin-bottom: 4px; padding-bottom: 4px; font-size: 0.95em; }
    .rg-line { padding: 2px 0; font-size: 0.85em; }
    .rg-line.big { padding-top: 5px; margin-top: 3px; font-size: 1em; }
    .rg-sep { margin-top: 4px; padding-top: 4px; }
    .footer { margin-top: 8px; padding-top: 4px; }
  }
</style></head><body><div class="doc">
  <div class="doc-header">
    <h1>Cotizacion - Control de Plagas</h1>
    <div class="meta"><span>Cotizacion N.: <strong>COT-CP-${num}</strong></span><span>Contrato: <strong>${d.labelContrato}${d.mesesContrato > 1 ? ' (' + d.mesesContrato + ' meses)' : ''}</strong></span><span>Fecha: <strong>${fecha}</strong></span></div>
  </div>
  <div class="cliente"><h2>Datos del cliente</h2>
    <div class="cliente-grid">
      <span>Razon Social:</span><strong>${rs}</strong>
      <span>CUIT:</span><strong>${cuit}</strong>
      <span>Contacto:</span><strong>${contacto} - ${cargo}</strong>
      <span>Telefono:</span><strong>${tel}</strong>
    </div>
  </div>
  ${ubsHtml}
  <div class="resumen-general"><h2>RESUMEN GENERAL</h2>
    <div class="rg-line"><span>Subtotal mensual (todas las ubicaciones)</span><span>${fmt(d.subtotalMensual)}</span></div>
    ${d.horasAdmin > 0 ? '<div class="rg-line"><span>Horas administrativas (' + d.horasAdmin + 'hs x ' + fmt(precios.mano_de_obra.valor_hora_administrativa) + ')</span><span>' + fmt(d.costoAdmin) + '</span></div>' : ''}
    ${d.ajusteParticular > 0 ? '<div class="rg-line"><span>Condiciones particulares' + (d.condDesc ? ' (' + d.condDesc + ')' : '') + (d.condTipo === 'porcentaje' ? ' ' + d.condValor + '%' : '') + '</span><span>' + fmt(d.ajusteParticular) + '</span></div>' : ''}
    ${d.montoDescGlobal > 0 ? '<div class="rg-line"><span>Descuento global ' + d.descGlobal + '%' + (d.descGlobalMotivo ? ' (' + d.descGlobalMotivo + ')' : '') + '</span><span>-' + fmt(d.montoDescGlobal) + '</span></div>' : ''}
    ${d.totalInsIniciales > 0 ? '<div class="rg-line"><span>Insumos a abonar por unica vez</span><span>' + fmt(d.totalInsIniciales) + '</span></div>' : ''}
    <div class="rg-line iva rg-sep"><span>Valor Mensual (sin IVA)</span><span>${fmt(d.valorMensualTotal)}</span></div>
    <div class="rg-line iva"><span>IVA 21%</span><span>${fmt(d.ivaMensual)}</span></div>
    <div class="rg-line big"><span>VALOR MENSUAL + IVA</span><span>${fmt(d.valMensualConIva)}</span></div>
    <div class="rg-line iva rg-sep"><span>Valor Mes Inicial (sin IVA)</span><span>${fmt(d.valorInicialTotal)}</span></div>
    <div class="rg-line iva"><span>IVA 21%</span><span>${fmt(d.ivaInicial)}</span></div>
    <div class="rg-line big"><span>VALOR MES INICIAL + IVA</span><span>${fmt(d.valInicialConIva)}</span></div>
    ${d.mesesContrato > 1 ? '<div class="rg-line rg-sep" style="font-weight:600;letter-spacing:0.5px"><span>CONTRATO ' + d.labelContrato.toUpperCase() + ' (' + d.mesesContrato + ' meses)</span><span></span></div><div class="rg-line iva"><span>Costo mensual + IVA</span><span>' + fmt(d.valMensualConIva) + '</span></div><div class="rg-line iva"><span>x ' + d.mesesContrato + ' meses</span><span>' + fmt(d.valMensualConIva * d.mesesContrato) + '</span></div>' + (d.totalInsIniciales > 0 ? '<div class="rg-line iva"><span>Insumos iniciales + IVA (una vez)</span><span>' + fmt(d.totalInsIniciales * 1.21) + '</span></div>' : '') + '<div class="rg-line big"><span>VALOR TOTAL CONTRATO</span><span>' + fmt(d.totalContrato) + '</span></div>' : ''}
  </div>
  <div class="footer">Cotizacion generada el ${fecha} a las ${hora}hs</div>
</div></body></html>`;

  window._cotHtmlContent = cotHtml;
  abrirCotizacion();
  showStep(8);
};

/** Genera y descarga la cotizacion en formato TXT */
const descargarTXT = () => {
  if (!window._cotData) return alert('No hay cotizacion generada');
  const d = window._cotData;
  const rs = document.getElementById('razonSocial').value || 'SIN RAZON SOCIAL';
  const cuit = document.getElementById('cuit').value || 'XX-XXXXXXXX-X';
  const tel = document.getElementById('telefono').value || '-';
  const contacto = document.getElementById('contactoNombre').value || '-';
  const cargo = document.getElementById('contactoCargo').value || '-';
  const num = window._cotNumero || '0000';
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const nombre = 'COT-CP-' + num + '_' + rs.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase() + '.txt';
  const linea = '='.repeat(60);
  const linea2 = '-'.repeat(60);

  let t = '';
  t += linea + '\n';
  t += '   COTIZACION - CONTROL DE PLAGAS\n';
  t += linea + '\n\n';
  t += '  Cotizacion N.:  COT-CP-' + num + '\n';
  t += '  Contrato:       ' + d.labelContrato + (d.mesesContrato > 1 ? ' (' + d.mesesContrato + ' meses)' : '') + '\n';
  t += '  Fecha:          ' + fecha + '\n\n';
  t += linea2 + '\n';
  t += '  DATOS DEL CLIENTE\n';
  t += linea2 + '\n';
  t += '  Razon Social:   ' + rs + '\n';
  t += '  CUIT:           ' + cuit + '\n';
  t += '  Contacto:       ' + contacto + ' - ' + cargo + '\n';
  t += '  Telefono:       ' + tel + '\n\n';

  d.ubicaciones.forEach((u) => {
    t += linea + '\n';
    t += '  ' + u.nombre.toUpperCase() + '\n';
    t += linea + '\n';
    t += '  ' + u.direccion + '  |  ' + u.m2 + ' m2  |  ' + u.frecuencia + '\n\n';

    t += '  VISITAS REGULARES\n';
    t += '  ' + linea2.substring(0, 40) + '\n';
    t += '  Horas/visita:   ' + u.horas + 'hs\n';
    t += '  Operarios:      ' + u.operarios + '\n';
    t += '  Visitas/mes:    ' + u.visitas + '\n';
    t += '  Dia:            ' + u.dia + '\n';
    t += '  Horario:        ' + u.horario + '\n';
    t += '  Ajuste:         ' + (u.ajuste > 0 ? u.ajusteDesc : 'Ninguno') + '\n';
    t += '  Costo:          ' + fmt(u.costoOp) + '\n\n';

    if (u.extVisitas > 0) {
      t += '  VISITAS EXTRAORDINARIAS' + (u.extMotivo ? ' - ' + u.extMotivo : '') + '\n';
      t += '  ' + linea2.substring(0, 40) + '\n';
      t += '  Horas/visita:   ' + u.extHoras + 'hs\n';
      t += '  Operarios:      ' + u.extOperarios + '\n';
      t += '  Visitas/mes:    ' + u.extVisitas + '\n';
      t += '  Dia:            ' + u.diaExtra + '\n';
      t += '  Horario:        ' + u.horarioExtra + '\n';
      t += '  Ajuste:         ' + (u.ajusteExtra > 0 ? u.ajusteExtraDesc : 'Ninguno') + '\n';
      if (u.extBonificada) {
        t += '  Costo:          Bonificado -' + fmt(u.costoExtraBruto) + '\n\n';
      } else {
        t += '  Costo:          ' + fmt(u.costoExtra) + '\n\n';
      }
    }

    const unicos = u.insumos.filter(i => i.tipo === 'U');
    const mensuales = u.insumos.filter(i => i.tipo === 'M');
    const fmtIns = (arr, titulo) => {
      if (arr.length === 0) return '';
      let total = 0, s = '  ' + titulo.toUpperCase() + '\n  ' + linea2.substring(0, 40) + '\n';
      arr.forEach(ins => {
        let p = ins.precio;
        if (ins.desc === 100) p = 0;
        else if (ins.desc > 0) p = ins.precio * (1 - ins.desc / 100);
        const sub = ins.cant * p;
        total += sub;
        s += '  ' + ins.cant + 'x ' + ins.nombre + '  ' + fmt(p) + ' c/u  =  ' + fmt(sub) + '\n';
      });
      s += '  Total: ' + fmt(total) + '\n\n';
      return s;
    };
    t += fmtIns(unicos, 'Insumos a abonar por unica vez');
    t += fmtIns(mensuales, 'Insumos mensuales');

    // Bonificaciones
    let bonifs = [];
    if (u.extVisitas > 0 && u.extBonificada) {
      bonifs.push({ desc: 'Visitas extraordinarias' + (u.extMotivo ? ' - ' + u.extMotivo : ''), monto: u.costoExtraBruto });
    }
    u.insumos.forEach(ins => {
      if (ins.desc > 0) {
        const montoBonif = ins.cant * ins.precio * ins.desc / 100;
        bonifs.push({ desc: ins.cant + 'x ' + ins.nombre + ' (' + ins.desc + '%)', monto: montoBonif });
      }
    });
    if (bonifs.length > 0) {
      let totalBonif = 0;
      t += '  BONIFICACIONES\n';
      t += '  ' + linea2.substring(0, 40) + '\n';
      bonifs.forEach(b => {
        totalBonif += b.monto;
        t += '  ' + b.desc + '    -' + fmt(b.monto) + '\n';
      });
      t += '  Total bonificado:    -' + fmt(totalBonif) + '\n\n';
    }

    const mTotal = mensuales.reduce((a, ins) => { let p = ins.desc === 100 ? 0 : ins.precio * (1 - ins.desc / 100); return a + ins.cant * p; }, 0);
    const servM = u.costoOp + u.costoExtra + mTotal;
    t += '  Servicio mensual: ' + fmt(servM) + '\n';
    if (u.costoExtra > 0) t += '    Incluye visitas extraordinarias: ' + fmt(u.costoExtra) + '\n';
    t += '\n';
  });

  t += linea + '\n';
  t += '  RESUMEN GENERAL\n';
  t += linea + '\n\n';
  t += '  Subtotal mensual (ubicaciones)       ' + fmt(d.subtotalMensual) + '\n';
  if (d.horasAdmin > 0) t += '  Horas admin (' + d.horasAdmin + 'hs x ' + fmt(precios.mano_de_obra.valor_hora_administrativa) + ')    ' + fmt(d.costoAdmin) + '\n';
  if (d.ajusteParticular > 0) t += '  Condiciones particulares' + (d.condDesc ? ' (' + d.condDesc + ')' : '') + (d.condTipo === 'porcentaje' ? ' ' + d.condValor + '%' : '') + '    ' + fmt(d.ajusteParticular) + '\n';
  if (d.montoDescGlobal > 0) t += '  Descuento global ' + d.descGlobal + '%' + (d.descGlobalMotivo ? ' (' + d.descGlobalMotivo + ')' : '') + '    -' + fmt(d.montoDescGlobal) + '\n';
  if (d.totalInsIniciales > 0) t += '  Insumos (unica vez)                  ' + fmt(d.totalInsIniciales) + '\n';
  t += '\n' + linea2 + '\n';
  t += '  Valor Mensual (sin IVA)              ' + fmt(d.valorMensualTotal) + '\n';
  t += '  IVA 21%                              ' + fmt(d.ivaMensual) + '\n';
  t += '  VALOR MENSUAL + IVA                  ' + fmt(d.valMensualConIva) + '\n';
  t += linea2 + '\n';
  t += '  Valor Mes Inicial (sin IVA)          ' + fmt(d.valorInicialTotal) + '\n';
  t += '  IVA 21%                              ' + fmt(d.ivaInicial) + '\n';
  t += '  VALOR MES INICIAL + IVA              ' + fmt(d.valInicialConIva) + '\n';
  if (d.mesesContrato > 1) {
    t += linea2 + '\n';
    t += '  CONTRATO ' + d.labelContrato.toUpperCase() + ' (' + d.mesesContrato + ' meses)\n';
    t += '  Costo mensual + IVA                  ' + fmt(d.valMensualConIva) + '\n';
    t += '  x ' + d.mesesContrato + ' meses                             ' + fmt(d.valMensualConIva * d.mesesContrato) + '\n';
    if (d.totalInsIniciales > 0) t += '  Insumos iniciales + IVA (una vez)    ' + fmt(d.totalInsIniciales * 1.21) + '\n';
    t += '  VALOR TOTAL CONTRATO                 ' + fmt(d.totalContrato) + '\n';
  }
  t += linea + '\n';

  const blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
