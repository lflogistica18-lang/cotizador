/* ===== Control de Interfaz ===== */

/** Muestra el paso N y actualiza indicadores */
const showStep = (n) => {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.className = 'dot' + (i + 1 === n ? ' active' : (i + 1 < n ? ' done' : ''));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/** Toggle sidebar mobile */
const toggleSidebar = () => {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
};

/** Toggle campos de visitas extra */
const toggleExtraFields = (sel) => {
  const fields = sel.closest('.ubicacion-card').querySelector('.extra-fields');
  fields.style.display = sel.value === 'si' ? 'block' : 'none';
  if (sel.value === 'no') {
    fields.querySelector('.op-extra-visitas').value = 0;
  }
};

/** Toggle visual de bonificacion extra */
const toggleBonifExtra = (sel) => {
  const card = sel.closest('.ubicacion-card');
  const campos = card.querySelectorAll('.op-extra-horas, .op-extra-operarios, .op-extra-visitas, .op-extra-dia, .op-extra-horario');
  campos.forEach(c => { c.style.opacity = sel.value === 'si' ? '0.6' : '1'; });
};

/** Actualiza descuento de trampas UV en todos los campos */
const actualizarDescTrampa = () => {
  let totalTrampas = 0;
  document.querySelectorAll('.ins-cant[data-key="trampa_uv"]').forEach((inp) => {
    totalTrampas += parseInt(inp.value) || 0;
  });
  const desc = getDescuentoTrampa(totalTrampas);
  document.querySelectorAll('.ins-desc[data-key="trampa_uv"]').forEach((inp) => {
    inp.value = desc;
  });
};

/* ===== Navegacion de Pasos ===== */

/** Paso 1 -> 2: Genera formularios de ubicaciones */
const goStep2 = () => {
  const tipo = document.getElementById('tipoCliente').value;
  const cant = tipo === 'unica' ? 1 : parseInt(document.getElementById('cantUbicaciones').value) || 2;
  const c = document.getElementById('ubicacionesForms');
  c.innerHTML = '';
  for (let i = 0; i < cant; i++) {
    const card = document.createElement('div');
    card.className = 'ubicacion-card';
    card.innerHTML = `<h3>Ubicacion ${cant > 1 ? (i + 1) : 'Principal'}</h3>
      <label>Nombre</label><input type="text" class="ub-nombre" value="${cant > 1 ? 'Sucursal ' + (i + 1) : 'Principal'}">
      <label>Direccion</label><input type="text" class="ub-dir" placeholder="Direccion completa">
      <div class="row">
        <div><label>Superficie (m2)</label><input type="number" class="ub-m2" min="1" value="100"></div>
        <div><label>Frecuencia</label><select class="ub-freq"><option>Mensual</option><option>Quincenal</option><option>Semanal</option></select></div>
      </div>`;
    c.appendChild(card);
  }
  showStep(2);
};

/** Paso 2 -> 3: Genera formularios operativos */
const goStep3 = () => {
  const c = document.getElementById('operativoForms');
  c.innerHTML = '';
  const freqs = document.querySelectorAll('.ub-freq');
  document.querySelectorAll('.ub-nombre').forEach((n, i) => {
    const freq = freqs[i].value;
    let defaultVisitas = 4.5;
    if (freq === 'Mensual') defaultVisitas = 1;
    else if (freq === 'Quincenal') defaultVisitas = 2;
    else if (freq === 'Semanal') defaultVisitas = 4.5;

    const card = document.createElement('div');
    card.className = 'ubicacion-card';
    card.innerHTML = `<h3>${n.value} <span class="tag">${freq}</span></h3>
      <p style="font-size:0.9em;font-weight:600;color:var(--color-primary);margin-bottom:8px">Visitas regulares</p>
      <div class="row">
        <div><label>Horas por visita</label><input type="number" class="op-horas" min="0.5" step="0.5" value="2"></div>
        <div><label>Operarios</label><input type="number" class="op-operarios" min="1" value="1"></div>
        <div><label>Visitas/mes</label><input type="number" class="op-visitas" min="0.5" step="0.5" value="${defaultVisitas}"></div>
      </div>
      <div class="row">
        <div><label>Dia preferido</label><select class="op-dia"><option>Lunes a Viernes</option><option>Sabado manana</option><option>Sabado tarde</option><option>Domingo</option></select></div>
        <div><label>Horario</label><select class="op-horario"><option>Diurno (8-18hs)</option><option>Nocturno (despues 22hs)</option></select></div>
      </div>
      <hr style="margin:12px 0;border:none;border-top:1px solid var(--color-border)">
      <label style="margin-bottom:4px">Hay visitas extraordinarias?</label>
      <p style="font-size:0.82em;color:#666;margin-bottom:8px">Visitas adicionales fuera del servicio regular. Ej: control de mosquitos en temporada, servicio de emergencia, refuerzo por auditoria.</p>
      <div class="row" style="margin-bottom:8px">
        <div>
          <select class="op-tiene-extra" onchange="toggleExtraFields(this)">
            <option value="no">No</option>
            <option value="si">Si, incluir visitas extraordinarias</option>
          </select>
        </div>
      </div>
      <div class="extra-fields" style="display:none">
        <p style="font-size:0.9em;font-weight:600;color:var(--color-primary);margin-bottom:8px">Visitas extraordinarias</p>
        <div class="row">
          <div style="flex:2"><label>Motivo</label><input type="text" class="op-extra-motivo" placeholder="Ej: Refuerzo, Emergencia, Auditoria..."></div>
          <div style="flex:1"><label>Bonificada</label><select class="op-extra-bonif" onchange="toggleBonifExtra(this)"><option value="no">No</option><option value="si">Si</option></select></div>
        </div>
        <div class="row">
          <div><label>Horas por visita</label><input type="number" class="op-extra-horas" min="0.5" step="0.5" value="2"></div>
          <div><label>Operarios</label><input type="number" class="op-extra-operarios" min="1" value="1"></div>
          <div><label>Visitas/mes</label><input type="number" class="op-extra-visitas" min="0" value="1"></div>
        </div>
        <div class="row">
          <div><label>Dia preferido</label><select class="op-extra-dia"><option>Lunes a Viernes</option><option>Sabado manana</option><option>Sabado tarde</option><option>Domingo</option></select></div>
          <div><label>Horario</label><select class="op-extra-horario"><option>Diurno (8-18hs)</option><option>Nocturno (despues 22hs)</option></select></div>
        </div>
      </div>`;
    c.appendChild(card);
  });
  showStep(3);
};

/** Paso 3 -> 4: Genera formularios de insumos */
const goStep4 = () => {
  const c = document.getElementById('insumosForms');
  c.innerHTML = '';
  document.querySelectorAll('.ub-nombre').forEach((n, i) => {
    const card = document.createElement('div');
    card.className = 'ubicacion-card';
    let h = `<h3>${n.value}</h3>`;
    h += `<div class="insumo-header"><span>Insumo</span><span>P. Unit.</span><span>Cant.</span><span>Tipo</span><span>% Desc</span></div>`;
    for (const [key, ins] of Object.entries(precios.insumos)) {
      const tag = key === 'trampa_uv' ? '<span class="tag">Desc. por cant.</span>' : '';
      h += `<div class="insumo-row">
        <label>${ins.nombre} ${tag}</label>
        <div class="insumo-precio">${fmt(ins.precio_unitario)}/${ins.unidad}</div>
        <input type="number" class="ins-cant" data-key="${key}" data-ub="${i}" min="0" value="0" style="width:70px"${key === 'trampa_uv' ? ' onchange="actualizarDescTrampa()"' : ''}>
        <select class="ins-tipo" data-key="${key}" data-ub="${i}" style="width:90px"><option value="U">Unico</option><option value="M">Mensual</option></select>
        <input type="number" class="ins-desc" data-key="${key}" data-ub="${i}" min="0" max="100" value="0" style="width:65px" placeholder="% Desc" title="Descuento %">
      </div>`;
    }
    card.innerHTML = h;
    c.appendChild(card);
  });
  showStep(4);
};

/** Paso 4 -> 5 */
const goStep5 = () => showStep(5);

/** Paso 5 -> 6: Calcula y muestra resumen */
const goStep6 = () => { calcular(); showStep(6); };

/** Paso 6 -> 7 */
const goStep7 = () => showStep(7);
