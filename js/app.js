/* ===== Inicializacion de la Aplicacion ===== */

let cotizacionWindow = null;

// Mostrar info de precios en header
document.getElementById('preciosInfo').textContent = 'Precios: ' + precios.metadata.ultima_actualizacion + ' | ' + precios.metadata.moneda;
document.getElementById('valorHoraAdmin').value = fmt(precios.mano_de_obra.valor_hora_administrativa);

// Verificar antiguedad de precios (> 60 dias)
(() => {
  const parts = precios.metadata.ultima_actualizacion.split('-');
  const updDate = new Date(parts[0], parts[1] - 1, parts[2]);
  if ((Date.now() - updDate) / (1000 * 60 * 60 * 24) > 60) {
    const aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.textContent = 'ATENCION: Los precios no se actualizan desde ' + precios.metadata.ultima_actualizacion;
    document.querySelector('.container').prepend(aviso);
  }
})();

// Generar indicadores de pasos
(() => {
  const ind = document.getElementById('stepIndicator');
  for (let i = 1; i <= STEPS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 1 ? ' active' : '');
    d.id = 'dot' + i;
    d.textContent = i;
    ind.appendChild(d);
  }
})();

// Event listeners
document.getElementById('tipoCliente').addEventListener('change', function () {
  document.getElementById('cantUbicacionesWrap').classList.toggle('hidden', this.value === 'unica');
});

document.getElementById('condTipo').addEventListener('change', function () {
  document.getElementById('condValor').disabled = this.value === 'ninguno';
  document.getElementById('condDescWrap').classList.toggle('hidden', this.value === 'ninguno');
});
