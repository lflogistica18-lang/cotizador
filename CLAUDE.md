# Cotizador - Control de Plagas

Sistema de cotizaciones para servicios de control de plagas. Dos interfaces: web (HTML/CSS/JS vanilla) y plugin de Claude Code con comandos conversacionales.

## Stack

- HTML + CSS + JavaScript vanilla (sin frameworks ni bundlers)
- Datos en `data/precios.json` (moneda ARS)
- Sin backend: todo corre en el navegador
- Desplegable via GitHub Pages

## Estructura

```
index.html          - Cotizador (wizard de 8 pasos)
precios.html        - ABM de precios
css/styles.css      - Estilos
js/
  app.js            - Logica principal, navegacion entre pasos
  calc.js           - Motor de calculos (operativo, insumos, descuentos)
  data.js           - Carga y manejo de precios.json
  output.js         - Generacion de salida (resumen, TXT, PDF)
  ui.js             - Interacciones de interfaz
  utils.js          - Helpers (formato moneda, etc.)
  precios.js        - Logica de precios.html
data/precios.json   - Fuente unica de precios, ajustes e insumos
commands/           - Slash commands para Claude Code (/cotizar, /actualizar-precios)
cotizaciones/       - Cotizaciones generadas (TXT)
```

## Logica de negocio clave

- Costo operativo = horas x valor_hora x operarios x visitas_mensuales x (1 + ajuste%)
- Recargos acumulativos: nocturno +15%, sabado post 13hs +15%, domingo +35%
- Descuentos mayoristas solo en Trampas UV (5-15% segun cantidad)
- Insumos pueden ser unicos (una vez) o mensuales (recurrentes)
- Cotizaciones se guardan como `COT-[XXXX]_[RAZON-SOCIAL]_[YYYYMMDD].txt`

## Convenciones

- Sin TypeScript, sin modulos ES6: scripts cargados con `<script>` en orden
- Variables y funciones en camelCase
- Precios siempre en pesos argentinos (ARS), formateados con separador de miles
- No usar npm ni dependencias externas
