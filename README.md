# Cotizador - Control de Plagas

Sistema de cotizaciones para servicios de control de plagas. Tiene dos interfaces: una **web** para uso directo y un **plugin de Claude Code** con comandos conversacionales.

## Estructura del proyecto

```
cotizador/
  index.html              Interfaz web del cotizador
  css/styles.css          Estilos de la interfaz
  js/
    app.js                Lógica principal de la aplicación
    calc.js               Motor de cálculos (operativo, insumos, descuentos)
    data.js               Carga y manejo de datos del JSON
    output.js             Generación de salida (resumen, TXT)
    ui.js                 Interacciones de interfaz
    utils.js              Funciones auxiliares (formato moneda, etc.)
  data/
    precios.json          Precios, ajustes, mano de obra e insumos
  commands/
    cotizar.md            Comando /cotizar para Claude Code
    actualizar-precios.md Comando /actualizar-precios para Claude Code
  cotizaciones/           Cotizaciones generadas (archivos TXT)
  docs/
    FLUJO_CONVERSACIONAL_CLAUDE_DESKTOP.md  Flujo para Claude Desktop
  imagenes/               Recursos gráficos
  .claude-plugin/
    plugin.json           Configuración del plugin de Claude Code
```

## Interfaz web

Abrir `index.html` en el navegador o acceder via GitHub Pages.

Funcionalidades:
- Cotizar servicios para una o multiples ubicaciones
- Calculo automatico de costos operativos (horas x operarios x visitas)
- Insumos con precios actualizables desde JSON
- Descuentos mayoristas en Trampas UV
- Recargos automaticos por horario nocturno, sabados tarde y domingos
- Generacion y descarga de cotizacion en TXT

## Plugin de Claude Code

Dos comandos disponibles:

### `/cotizar`
Genera una cotizacion de forma conversacional paso a paso:
1. Carga y valida precios (alerta si tienen mas de 60 dias)
2. Tipo de cliente (ubicacion unica o multiples sucursales)
3. Datos del cliente (razon social, CUIT, contacto)
4. Datos de ubicaciones (direccion, m2, frecuencia, dia, horario)
5. Detalle operativo (horas, operarios, visitas mensuales)
6. Insumos por ubicacion
7. Deteccion automatica de recargos
8. Calculo final y resumen
9. Confirmacion y guardado en TXT

### `/actualizar-precios`
Modifica precios de insumos, mano de obra y ajustes directamente en `precios.json`.

## Precios y configuracion

Todo vive en `data/precios.json`:

| Seccion | Que contiene |
|---|---|
| `metadata` | Fecha de actualizacion, moneda, notas |
| `ajustes` | Recargos: nocturno (+15%), sabado tarde (+15%), domingo (+35%) |
| `mano_de_obra` | Valor hora operario y administrativa ($50.000/hr) |
| `insumos` | Precios unitarios de cada insumo |

### Insumos disponibles

| Insumo | Precio unitario |
|---|---|
| Caja cebadera | $5.500 |
| Placa UV | $1.550 |
| Placa ROE | $2.500 |
| Trampa UV | $85.000 |
| UND 33.3 | $2.600 |
| Etiqueta CB | $400 |
| Etiqueta Pared | $275 |
| Metro lineal de Pincho | $7.800 |

Descuentos mayoristas solo aplican a **Trampas UV**:

| Cantidad | Descuento |
|---|---|
| 1 a 4 | 0% |
| 5 a 9 | 5% |
| 10 a 19 | 10% |
| 20+ | 15% |

## Formulas de calculo

### Costo operativo mensual
```
horas x valor_hora x operarios x visitas_mensuales x (1 + ajuste/100)
```

### Recargos (acumulativos)
- Nocturno (despues de 22hs): +15%
- Sabado despues de 13hs: +15%
- Domingo: +35%

### Cotizacion final por ubicacion
```
Servicio mensual = costo operativo + insumos mensuales
Insumos iniciales = insumos unicos (una sola vez)
Valor mes inicial = servicio mensual + insumos iniciales
```

## Como actualizar precios

**Opcion 1 - Manual:** Editar directamente `data/precios.json` y actualizar la fecha en `metadata.ultima_actualizacion`.

**Opcion 2 - Claude Code:** Ejecutar `/actualizar-precios` y seguir el flujo conversacional.

## Formato de cotizacion guardada

Las cotizaciones se guardan en `cotizaciones/` con el formato:
```
COT-[XXXX]_[RAZON-SOCIAL]_[YYYYMMDD].txt
```

Numero correlativo automatico (busca el ultimo y suma 1).

---

Version 1.0 - Febrero 2026
