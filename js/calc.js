/* ===== Motor de Calculos ===== */

/** Extrae todos los datos de ubicaciones del DOM */
const getUbicaciones = () => {
  const ubN = document.querySelectorAll('.ub-nombre'), ubD = document.querySelectorAll('.ub-dir');
  const ubM = document.querySelectorAll('.ub-m2'), ubF = document.querySelectorAll('.ub-freq');
  const opH = document.querySelectorAll('.op-horas'), opO = document.querySelectorAll('.op-operarios'), opV = document.querySelectorAll('.op-visitas');
  const opDia = document.querySelectorAll('.op-dia'), opHor = document.querySelectorAll('.op-horario');
  const opExtraH = document.querySelectorAll('.op-extra-horas'), opExtraO = document.querySelectorAll('.op-extra-operarios'), opExtraV = document.querySelectorAll('.op-extra-visitas');
  const opExtraDia = document.querySelectorAll('.op-extra-dia'), opExtraHor = document.querySelectorAll('.op-extra-horario');
  const opExtraMotivo = document.querySelectorAll('.op-extra-motivo'), opExtraBonif = document.querySelectorAll('.op-extra-bonif');
  const ubs = [];

  ubN.forEach((_, i) => {
    const dia = opDia[i].value, hor = opHor[i].value;
    const ajReg = calcAjuste(dia, hor);
    const horas = parseFloat(opH[i].value) || 0, ops = parseInt(opO[i].value) || 0, vis = parseFloat(opV[i].value) || 0;
    const costoOp = horas * precios.mano_de_obra.valor_hora_operario * ops * vis * (1 + ajReg.aj / 100);

    const extHoras = opExtraH[i] ? (parseFloat(opExtraH[i].value) || 0) : 0;
    const extOps = opExtraO[i] ? (parseInt(opExtraO[i].value) || 0) : 0;
    const extVis = opExtraV[i] ? (parseFloat(opExtraV[i].value) || 0) : 0;
    const diaExtra = opExtraDia[i] ? opExtraDia[i].value : 'Lunes a Viernes';
    const horExtra = opExtraHor[i] ? opExtraHor[i].value : 'Diurno (8-18hs)';
    const extMotivo = opExtraMotivo[i] ? opExtraMotivo[i].value : '';
    const extBonificada = opExtraBonif[i] ? opExtraBonif[i].value === 'si' : false;
    const ajExt = calcAjuste(diaExtra, horExtra);
    const costoExtraBruto = extVis * extHoras * precios.mano_de_obra.valor_hora_operario * extOps * (1 + ajExt.aj / 100);
    const costoExtra = extBonificada ? 0 : costoExtraBruto;

    const insumos = [];
    document.querySelectorAll(`.ins-cant[data-ub="${i}"]`).forEach((inp, j) => {
      const cant = parseInt(inp.value) || 0;
      if (cant > 0) {
        const key = inp.dataset.key;
        const tipo = document.querySelectorAll(`.ins-tipo[data-ub="${i}"]`)[j].value;
        const desc = parseFloat(document.querySelectorAll(`.ins-desc[data-ub="${i}"]`)[j].value) || 0;
        insumos.push({ key, cant, tipo, desc, nombre: precios.insumos[key].nombre, precio: precios.insumos[key].precio_unitario, unidad: precios.insumos[key].unidad });
      }
    });

    ubs.push({
      nombre: ubN[i].value, direccion: ubD[i].value, m2: ubM[i].value, frecuencia: ubF[i].value,
      dia, horario: hor, ajuste: ajReg.aj, ajusteDesc: ajReg.ajDesc, horas, operarios: ops, visitas: vis, costoOp,
      extHoras, extOperarios: extOps, extVisitas: extVis, diaExtra, horarioExtra: horExtra,
      ajusteExtra: ajExt.aj, ajusteExtraDesc: ajExt.ajDesc, extMotivo, extBonificada, costoExtraBruto, costoExtra,
      insumos
    });
  });

  return ubs;
};

/** Calcula totales y renderiza el resumen en paso 6 */
const calcular = () => {
  const ubicaciones = getUbicaciones();
  let totalTrampas = 0;
  ubicaciones.forEach(u => u.insumos.forEach(ins => { if (ins.key === 'trampa_uv') totalTrampas += ins.cant; }));
  const descTrampa = getDescuentoTrampa(totalTrampas);
  let html = '', subtotalMensual = 0, totalInsIniciales = 0;

  if (descTrampa > 0) html += `<div class="aviso">Descuento Trampas UV: ${descTrampa}% (${totalTrampas} unidades totales) - aplicado automaticamente en campo % Desc</div>`;

  ubicaciones.forEach(u => {
    let insUH = '', insMH = '', tU = 0, tM = 0;
    u.insumos.forEach(ins => {
      let p = ins.precio, dt = '';
      if (ins.desc === 100) { p = 0; dt = ' (Bonificado)'; }
      else if (ins.desc > 0) { p = ins.precio * (1 - ins.desc / 100); dt = ` (-${ins.desc}%)`; }
      const s = ins.cant * p;
      const row = `<tr><td>${ins.cant}</td><td>${ins.nombre}${dt}</td><td>${fmt(p)}</td><td>${fmt(s)}</td></tr>`;
      if (ins.tipo === 'U') { insUH += row; tU += s; } else { insMH += row; tM += s; }
    });

    const serv = u.costoOp + u.costoExtra + tM;
    subtotalMensual += serv;
    totalInsIniciales += tU;

    html += `<div class="ubicacion-card"><h3>${u.nombre} <span class="tag">${u.frecuencia}</span></h3>
      <p style="font-size:0.85em;color:var(--color-text-muted);margin-bottom:10px">${u.direccion} | ${u.m2} m2</p>
      <table class="resumen-table"><tr><th colspan="4">Visitas regulares</th></tr>
      <tr><td>${u.horas}hs</td><td>${u.operarios} operario(s)</td><td>${u.visitas} visitas/mes</td><td><strong>${fmt(u.costoOp)}</strong></td></tr>
      <tr><td colspan="2">${u.dia} | ${u.horario}</td><td colspan="2">${u.ajuste > 0 ? '<span style="color:var(--color-warning)">' + u.ajusteDesc + '</span>' : 'Sin ajuste'}</td></tr></table>`;

    if (u.extVisitas > 0) {
      const motivoTxt = u.extMotivo ? ' - ' + u.extMotivo : '';
      html += `<table class="resumen-table"><tr><th colspan="4">Visitas extraordinarias${motivoTxt}</th></tr>
      <tr><td>${u.extHoras}hs</td><td>${u.extOperarios} operario(s)</td><td>${u.extVisitas} visitas/mes</td><td><strong>${u.extBonificada ? '<span style="color:var(--color-success)">Bonificado -' + fmt(u.costoExtraBruto) + '</span>' : fmt(u.costoExtra)}</strong></td></tr>
      <tr><td colspan="2">${u.diaExtra} | ${u.horarioExtra}</td><td colspan="2">${u.ajusteExtra > 0 ? '<span style="color:var(--color-warning)">' + u.ajusteExtraDesc + '</span>' : 'Sin ajuste'}</td></tr></table>`;
    }

    if (insUH) html += `<table class="resumen-table"><tr><th>Cant</th><th>Insumo (Unico)</th><th>P.Unit</th><th>Subtotal</th></tr>${insUH}<tr class="subtotal-row"><td colspan="3">Total insumos unicos</td><td>${fmt(tU)}</td></tr></table>`;
    if (insMH) html += `<table class="resumen-table"><tr><th>Cant</th><th>Insumo (Mensual)</th><th>P.Unit</th><th>Subtotal</th></tr>${insMH}<tr class="subtotal-row"><td colspan="3">Total insumos mensuales</td><td>${fmt(tM)}</td></tr></table>`;

    // Bonificaciones
    let bonifRows = '';
    let totalBonif = 0;
    if (u.extVisitas > 0 && u.extBonificada) {
      bonifRows += `<tr><td colspan="3">Visitas extraordinarias${u.extMotivo ? ' - ' + u.extMotivo : ''}</td><td style="color:#4caf50;font-weight:600">-${fmt(u.costoExtraBruto)}</td></tr>`;
      totalBonif += u.costoExtraBruto;
    }
    u.insumos.forEach(ins => {
      if (ins.desc > 0) {
        const montoBonif = ins.cant * ins.precio * ins.desc / 100;
        bonifRows += `<tr><td>${ins.cant}x</td><td>${ins.nombre} (${ins.desc}%)</td><td></td><td style="color:#4caf50;font-weight:600">-${fmt(montoBonif)}</td></tr>`;
        totalBonif += montoBonif;
      }
    });
    if (bonifRows) html += `<table class="resumen-table"><tr><th colspan="4" style="background:#e8f5e9;color:#2e7d32">Bonificaciones</th></tr>${bonifRows}<tr class="subtotal-row"><td colspan="3">Total bonificado</td><td style="color:#4caf50;font-weight:700">-${fmt(totalBonif)}</td></tr></table>`;

    html += `<table class="resumen-table"><tr class="total-row"><td colspan="3">Servicio mensual</td><td>${fmt(serv)}</td></tr><tr><td colspan="3">Insumos a abonar por unica vez</td><td>${fmt(tU)}</td></tr></table></div>`;
  });

  const hAdmin = parseFloat(document.getElementById('horasAdmin').value) || 0;
  const cAdmin = hAdmin * precios.mano_de_obra.valor_hora_administrativa;
  const cTipo = document.getElementById('condTipo').value;
  const cVal = parseFloat(document.getElementById('condValor').value) || 0;
  const cDesc = document.getElementById('condDesc').value || '';
  let ajPart = 0;
  if (cTipo === 'porcentaje') ajPart = (subtotalMensual + cAdmin) * cVal / 100;
  else if (cTipo === 'monto_fijo') ajPart = cVal;

  const descGlobal = parseFloat(document.getElementById('descGlobal').value) || 0;
  const descGlobalMotivo = document.getElementById('descGlobalMotivo').value || '';
  const baseParaDescuento = subtotalMensual + cAdmin + ajPart;
  const montoDescGlobal = baseParaDescuento * descGlobal / 100;

  const valMensual = baseParaDescuento - montoDescGlobal;
  const valInicial = valMensual + totalInsIniciales;

  const ivaMensual = valMensual * 0.21;
  const valMensualConIva = valMensual + ivaMensual;
  const ivaInicial = valInicial * 0.21;
  const valInicialConIva = valInicial + ivaInicial;

  // Contrato
  const mesesContrato = parseInt(document.getElementById('tipoContrato').value) || 1;
  const labelContrato = { 12: 'Anual', 6: 'Semestral', 3: 'Trimestral', 1: 'Mensual' }[mesesContrato] || mesesContrato + ' meses';
  const totalContrato = valMensualConIva * mesesContrato + (totalInsIniciales * 1.21);
  const totalContratoSinIva = valMensual * mesesContrato + totalInsIniciales;
  const ivaContrato = totalContrato - totalContratoSinIva;

  html += `<div class="resumen-final">
    <div class="line"><span>Subtotal mensual (ubicaciones)</span><span>${fmt(subtotalMensual)}</span></div>`;
  if (hAdmin > 0) html += `<div class="line"><span>Horas administrativas (${hAdmin}hs x ${fmt(precios.mano_de_obra.valor_hora_administrativa)})</span><span>${fmt(cAdmin)}</span></div>`;
  if (ajPart > 0) html += `<div class="line"><span>Condiciones particulares${cDesc ? ' (' + cDesc + ')' : ''}${cTipo === 'porcentaje' ? ' ' + cVal + '%' : ''}</span><span>${fmt(ajPart)}</span></div>`;
  if (montoDescGlobal > 0) html += `<div class="line"><span>Descuento global ${descGlobal}%${descGlobalMotivo ? ' (' + descGlobalMotivo + ')' : ''}</span><span>-${fmt(montoDescGlobal)}</span></div>`;
  if (totalInsIniciales > 0) html += `<div class="line"><span>Insumos a abonar por unica vez</span><span>${fmt(totalInsIniciales)}</span></div>`;

  html += `<div class="line iva" style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.15)"><span>Valor Mensual (sin IVA)</span><span>${fmt(valMensual)}</span></div>`;
  html += `<div class="line iva"><span>IVA 21%</span><span>${fmt(ivaMensual)}</span></div>`;
  html += `<div class="line big"><span>VALOR MENSUAL + IVA</span><span>${fmt(valMensualConIva)}</span></div>`;

  html += `<div class="line iva" style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.15)"><span>Valor Mes Inicial (sin IVA)</span><span>${fmt(valInicial)}</span></div>`;
  html += `<div class="line iva"><span>IVA 21%</span><span>${fmt(ivaInicial)}</span></div>`;
  html += `<div class="line big"><span>VALOR MES INICIAL + IVA</span><span>${fmt(valInicialConIva)}</span></div>`;

  if (mesesContrato > 1) {
    html += `<div class="line" style="margin-top:14px;padding-top:10px;border-top:2px solid rgba(255,255,255,0.4);font-weight:600;letter-spacing:0.5px"><span>CONTRATO ${labelContrato.toUpperCase()} (${mesesContrato} meses)</span><span></span></div>`;
    html += `<div class="line iva"><span>Costo mensual + IVA</span><span>${fmt(valMensualConIva)}</span></div>`;
    html += `<div class="line iva"><span>x ${mesesContrato} meses</span><span>${fmt(valMensualConIva * mesesContrato)}</span></div>`;
    if (totalInsIniciales > 0) html += `<div class="line iva"><span>Insumos iniciales + IVA (una vez)</span><span>${fmt(totalInsIniciales * 1.21)}</span></div>`;
    html += `<div class="line big"><span>VALOR TOTAL CONTRATO</span><span>${fmt(totalContrato)}</span></div>`;
  }

  html += `</div>`;

  document.getElementById('resumenCostos').innerHTML = html;
  window._cotData = {
    ubicaciones, subtotalMensual, costoAdmin: cAdmin, horasAdmin: hAdmin,
    ajusteParticular: ajPart, condTipo: cTipo, condValor: cVal, condDesc: cDesc,
    descGlobal, descGlobalMotivo, montoDescGlobal, valorMensualTotal: valMensual,
    totalInsIniciales, valorInicialTotal: valInicial, ivaMensual, valMensualConIva,
    ivaInicial, valInicialConIva, descTrampa, totalTrampas,
    mesesContrato, labelContrato, totalContrato, totalContratoSinIva, ivaContrato
  };
};
