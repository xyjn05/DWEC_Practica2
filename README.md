# DWEC_Practica2
# Urban Style — Portal web y carrito de compras

Proyecto Front-End (HTML + CSS + JavaScript vanilla) que simula el MVP del
portal de venta de ropa de la marca **Urban Style**: inicio de sesión vía
parámetros de URL, catálogo con selección de prendas, cálculo de IVA y
descuentos, una oferta relámpago con temporizador, y un sistema de reseñas
persistente y protegido contra XSS.

## Estructura del proyecto

\`\`\`
urban-style/
├── index.html   # Estructura HTML5 semántica
├── styles.css   # Estilos
├── app.js       # Toda la lógica, bajo 'use strict'
└── README.md
\`\`\`

## Bloque 1 — Sesión, entorno y estructura

- Carga de scripts en `<head>`: `async` para la analítica externa (no
  bloquea el render), `defer` para `app.js` (se ejecuta con el DOM ya
  listo).
- Lectura de parámetros de URL (`URLSearchParams`) con valores por defecto.
- Diagnóstico del entorno (BOM): idioma del navegador, estado de conexión,
  id de sesión (`crypto.randomUUID()`) y fecha actual en español.
- Sanitización del correo (`trim` + `toLowerCase`) y separación de usuario
  y dominio.
- ID de cliente formateado a 6 dígitos (`padStart`).
- Valores por defecto usando `||`, `??` y `??=` según corresponda (ver
  tabla de parámetros arriba).

## Bloque 2 — Catálogo, finanzas y formato

- El catálogo guarda los precios como texto (`"59.90€"`); se extraen con
  `parseFloat`.
- El subtotal solo suma las prendas marcadas (checkboxes) en el catálogo.
- Antes de operar, se valida que el subtotal sea un número finito
  (`Number.isFinite`).
- El cupón introducido se resta a la base imponible y se calcula el 21%
  de IVA sobre el resultado.
- El número de pedido se incrementa en cada confirmación.
- Todo el desglose se muestra con `Intl.NumberFormat('es-ES', { style:
  'currency', currency: 'EUR' })`.

## Bloque 3 — Oferta Relámpago

- Cuenta atrás de 15 segundos con `setInterval`.
- Un candado (`idIntervalo`) evita que se creen temporizadores duplicados
  si el botón se pulsa varias veces mientras la oferta está activa.
- Al llegar a 0, se detiene el intervalo, se restablece el estado y se
  notifica que la oferta ha expirado.

## Bloque 4 — Reseñas, seguridad y persistencia

- Formulario para publicar una opinión por prenda.
- Cada reseña guarda: id (timestamp), usuario, hora exacta y comentario.
- Las reseñas se guardan y leen de `localStorage`, con `try/catch` para
  proteger la app ante errores de almacenamiento o datos corruptos.
- El renderizado usa siempre `textContent` (nunca `innerHTML` con datos
  del usuario), neutralizando cualquier intento de inyección XSS.
