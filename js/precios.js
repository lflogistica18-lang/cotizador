/* ===== Actualizador de Precios ===== */

// Cargar precios desde JSON y luego inicializar
fetch('data/precios.json')
  .then(r => r.json())
  .then(data => {
    precios = data;
    initPrecios();
  })
  .catch(err => {
    console.error('Error cargando precios:', err);
    document.querySelector('.container').innerHTML =
      '<div class="aviso">Error: No se pudieron cargar los precios. Verifique que el archivo data/precios.json existe y que la pagina se sirva desde un servidor web.</div>';
  });

function initPrecios() {
  // Mostrar fecha en header
  document.getElementById('preciosInfo').textContent =
    'Ultima actualizacion: ' + precios.metadata.ultima_actualizacion + ' | ' + precios.metadata.moneda;

  // Mano de obra
  document.getElementById('valorHoraOperario').value = precios.mano_de_obra.valor_hora_operario;
  document.getElementById('valorHoraAdmin').value = precios.mano_de_obra.valor_hora_administrativa;

  // Ajustes por evento
  document.getElementById('ajNocturno').value = precios.ajustes.nocturno.porcentaje;
  document.getElementById('descNocturno').textContent = precios.ajustes.nocturno.descripcion;
  document.getElementById('ajDomingo').value = precios.ajustes.domingo.porcentaje;
  document.getElementById('descDomingo').textContent = precios.ajustes.domingo.descripcion;
  document.getElementById('ajSabado').value = precios.ajustes.sabado_post_13.porcentaje;
  document.getElementById('descSabado').textContent = precios.ajustes.sabado_post_13.descripcion;

  // Insumos - generar filas dinamicamente
  const tbody = document.getElementById('tbodyInsumos');
  for (const [key, insumo] of Object.entries(precios.insumos)) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + insumo.nombre + '</td>' +
      '<td>' + fmt(insumo.precio_unitario) + '</td>' +
      '<td><input type="number" class="insumo-nuevo" data-key="' + key + '" value="' + insumo.precio_unitario + '" min="0" step="1"></td>' +
      '<td><span class="variacion" data-key="' + key + '">0%</span></td>';
    tbody.appendChild(tr);
  }

  // Event listeners en inputs de insumos
  tbody.querySelectorAll('.insumo-nuevo').forEach(input => {
    input.addEventListener('input', function () {
      const key = this.dataset.key;
      const original = window._preciosOriginales.insumos[key].precio_unitario;
      const nuevo = parseFloat(this.value) || 0;
      const span = tbody.querySelector('.variacion[data-key="' + key + '"]');
      if (original === 0) {
        span.textContent = '0%';
        span.style.color = '';
      } else {
        const pct = ((nuevo - original) / original * 100).toFixed(1);
        if (parseFloat(pct) > 0) {
          span.textContent = '+' + pct + '%';
          span.style.color = '#4caf50';
        } else if (parseFloat(pct) < 0) {
          span.textContent = pct + '%';
          span.style.color = '#e74c3c';
        } else {
          span.textContent = '0%';
          span.style.color = '';
        }
      }
      actualizarComparativo();
    });
  });

  // Descuentos mayoristas
  const tbodyDesc = document.getElementById('tbodyDescuentos');
  precios.insumos.trampa_uv.descuentos_mayoristas.forEach((tramo, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + tramo.desde + '</td>' +
      '<td>' + (tramo.hasta === null ? '+' : tramo.hasta) + '</td>' +
      '<td><input type="number" class="descuento-tramo" data-index="' + i + '" value="' + tramo.descuento + '" min="0" max="100" step="0.5"></td>';
    tbodyDesc.appendChild(tr);
  });

  // Event listeners en mano de obra y ajustes para actualizar comparativo
  ['valorHoraOperario', 'valorHoraAdmin', 'ajNocturno', 'ajDomingo', 'ajSabado'].forEach(id => {
    document.getElementById(id).addEventListener('input', actualizarComparativo);
  });
  tbodyDesc.querySelectorAll('.descuento-tramo').forEach(input => {
    input.addEventListener('input', actualizarComparativo);
  });

  // Guardar copia de valores originales
  window._preciosOriginales = JSON.parse(JSON.stringify(precios));
}

function aplicarAumento() {
  const pct = parseFloat(document.getElementById('pctAumento').value) || 0;
  if (pct === 0) return;
  const factor = 1 + pct / 100;

  // Mano de obra
  const opInput = document.getElementById('valorHoraOperario');
  const adInput = document.getElementById('valorHoraAdmin');
  opInput.value = Math.round(parseFloat(opInput.value) * factor);
  adInput.value = Math.round(parseFloat(adInput.value) * factor);

  // Insumos
  document.querySelectorAll('.insumo-nuevo').forEach(input => {
    input.value = Math.round(parseFloat(input.value) * factor);
    input.dispatchEvent(new Event('input'));
  });

  actualizarComparativo();
}

function actualizarComparativo() {
  const orig = window._preciosOriginales;
  const cambios = [];

  // Mano de obra
  const opNuevo = parseFloat(document.getElementById('valorHoraOperario').value) || 0;
  const opOrig = orig.mano_de_obra.valor_hora_operario;
  if (opNuevo !== opOrig) {
    const pct = ((opNuevo - opOrig) / opOrig * 100).toFixed(1);
    cambios.push('Hora operario: ' + fmt(opOrig) + ' → ' + fmt(opNuevo) + ' (' + (pct > 0 ? '+' : '') + pct + '%)');
  }

  const adNuevo = parseFloat(document.getElementById('valorHoraAdmin').value) || 0;
  const adOrig = orig.mano_de_obra.valor_hora_administrativa;
  if (adNuevo !== adOrig) {
    const pct = ((adNuevo - adOrig) / adOrig * 100).toFixed(1);
    cambios.push('Hora administrativa: ' + fmt(adOrig) + ' → ' + fmt(adNuevo) + ' (' + (pct > 0 ? '+' : '') + pct + '%)');
  }

  // Ajustes
  const ajNocNuevo = parseFloat(document.getElementById('ajNocturno').value) || 0;
  if (ajNocNuevo !== orig.ajustes.nocturno.porcentaje) {
    cambios.push('Nocturno: ' + orig.ajustes.nocturno.porcentaje + '% → ' + ajNocNuevo + '%');
  }
  const ajDomNuevo = parseFloat(document.getElementById('ajDomingo').value) || 0;
  if (ajDomNuevo !== orig.ajustes.domingo.porcentaje) {
    cambios.push('Domingo: ' + orig.ajustes.domingo.porcentaje + '% → ' + ajDomNuevo + '%');
  }
  const ajSabNuevo = parseFloat(document.getElementById('ajSabado').value) || 0;
  if (ajSabNuevo !== orig.ajustes.sabado_post_13.porcentaje) {
    cambios.push('Sabado post 13hs: ' + orig.ajustes.sabado_post_13.porcentaje + '% → ' + ajSabNuevo + '%');
  }

  // Insumos
  document.querySelectorAll('.insumo-nuevo').forEach(input => {
    const key = input.dataset.key;
    const nuevo = parseFloat(input.value) || 0;
    const original = orig.insumos[key].precio_unitario;
    if (nuevo !== original) {
      const pct = ((nuevo - original) / original * 100).toFixed(1);
      cambios.push(orig.insumos[key].nombre + ': ' + fmt(original) + ' → ' + fmt(nuevo) + ' (' + (pct > 0 ? '+' : '') + pct + '%)');
    }
  });

  // Descuentos mayoristas
  document.querySelectorAll('.descuento-tramo').forEach(input => {
    const i = parseInt(input.dataset.index);
    const nuevo = parseFloat(input.value) || 0;
    const original = orig.insumos.trampa_uv.descuentos_mayoristas[i].descuento;
    if (nuevo !== original) {
      const tramo = orig.insumos.trampa_uv.descuentos_mayoristas[i];
      cambios.push('Descuento tramo ' + tramo.desde + '-' + (tramo.hasta === null ? '+' : tramo.hasta) + ': ' + original + '% → ' + nuevo + '%');
    }
  });

  const div = document.getElementById('listaComparativo');
  if (cambios.length === 0) {
    div.innerHTML = '<div class="line">Sin cambios</div>';
  } else {
    div.innerHTML = cambios.map(c => '<div class="line">' + c + '</div>').join('');
  }
}

function descargarJSON() {
  const hoy = new Date();
  const fecha = hoy.getFullYear() + '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
    String(hoy.getDate()).padStart(2, '0');

  const partes = fecha.split('-');
  const fechaNota = partes[2] + '/' + partes[1] + '/' + partes[0];

  const obj = JSON.parse(JSON.stringify(precios));

  // Metadata
  obj.metadata.ultima_actualizacion = fecha;
  obj.metadata.notas = 'Precios vigentes al ' + fechaNota + '. Revisar periódicamente. Descuentos mayoristas solo aplican a Trampas UV.';

  // Mano de obra
  obj.mano_de_obra.valor_hora_operario = parseFloat(document.getElementById('valorHoraOperario').value) || 0;
  obj.mano_de_obra.valor_hora_administrativa = parseFloat(document.getElementById('valorHoraAdmin').value) || 0;

  // Ajustes
  obj.ajustes.nocturno.porcentaje = parseFloat(document.getElementById('ajNocturno').value) || 0;
  obj.ajustes.domingo.porcentaje = parseFloat(document.getElementById('ajDomingo').value) || 0;
  obj.ajustes.sabado_post_13.porcentaje = parseFloat(document.getElementById('ajSabado').value) || 0;

  // Insumos
  document.querySelectorAll('.insumo-nuevo').forEach(input => {
    const key = input.dataset.key;
    obj.insumos[key].precio_unitario = parseFloat(input.value) || 0;
  });

  // Descuentos mayoristas
  document.querySelectorAll('.descuento-tramo').forEach(input => {
    const i = parseInt(input.dataset.index);
    obj.insumos.trampa_uv.descuentos_mayoristas[i].descuento = parseFloat(input.value) || 0;
  });

  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'precios.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
