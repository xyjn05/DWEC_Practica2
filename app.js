'use strict';

// BLOQUE_1: Inicio de sesión, diagnóstico del entorno y estructura

// 1.2 Identificación de la sesión y entorno

const params = new URLSearchParams(window.location.search); // URLSearchParams lee los parámetros de la URL
const usuario = params.get('usuario') || 'Invitado';
const rol = params.get('rol') || 'invitado';

// Diagnóstico del entorno (BOM): idioma, conexión, id único, fecha
const entorno = {
    idioma: navigator.language, // Idioma del navegador
    online: navigator.onLine ? 'Conectado 🟢' : 'Sin conexión 🔴', // Coprobar la conexión
    sesionId: crypto.randomUUID(),// Id único y seguro
    fecha: new Date().toLocaleDateString('es-ES', { dateStyle: "full" }) // Fecha actual formateada
};

// 1.3 Sanitización del perfil de usuario

const emailBruto = params.get('email') ?? ''; // Lee email desde los parámetros de URL 
const email = emailBruto.trim().toLowerCase(); // Sin espacios y en minúsculas
const [nombreEmail, dominioEmail] = email.split('@'); // Guardar usuario y dominio por separado

const idCliente = String(params.get('id') ?? 0).padStart(6, '0'); // Lee id desde los parámetros de URL y si no llega 6 digítos se rellena 0 desde izquierda

// 1.4 Asignaciones de preferencias por defecto

const apodoUrl = params.get('apodo');
const membresiaUrl = params.get('membresia');
const regalosUrl = params.get('regalos');

const apodo = apodoUrl || 'Cliente VIP';  // Si apodoUrl es "",null o undefined revuelve 'Cliente VIP'
const membresia = membresiaUrl ?? 'Básica'; // A difrencia a ||, ?? solo revuelve 'Básica' cuando es null o undefined
let prendasRegalo = regalosUrl === null ? undefined : Number(regalosUrl); // Si es null se convierte undefined sino convierte a número
prendasRegalo ??= 2;// Un 0 real no se sobrescribe, solo sobrescribe cuando es null o undefined

// Función para mostrar sesión

function mostrarSesion() {
    const filas = [
        ['Usuario', usuario], ['Rol', rol], ['Apodo', apodo],
        ['Membresía', membresia], ['Prendas de regalo', prendasRegalo],
        ['ID cliente', idCliente],
        ['Correo', email ? `${nombreEmail} (dominio: ${dominioEmail})` : 'no indicado'],
        ['Idioma', entorno.idioma],
        ['Conexión', entorno.online],
        ['Sesión', entorno.sesionId.slice(0, 8)],
        ['Fecha', entorno.fecha]
    ];
    const ul = document.getElementById('datos-sesion');
    filas.forEach(([etiqueta, valor]) => {
        const li = document.createElement('li'); // crea un elemento HTML especificado por su tagName
        const negrita = document.createElement('strong');
        negrita.textContent = `${etiqueta}: `; // Utilizamos textContent para evita un vector de ataque XSS
        li.append(negrita, String(valor));   // Meter elementos dentro de li
        ul.append(li); // Meter elementos dentro de ul
    });
}

mostrarSesion();

// Bloque 2: Catálogo, operaciones financieras y formateo moneda

// 2.1 Selección de prendas y parseo numérico

// Catalogo de artículo

const catalogo = [
    { id: 'p1', nombre: 'Chaqueta Denim', precio: '59.90€' },
    { id: 'p2', nombre: 'Camiseta Urban', precio: '19.99€' },
    { id: 'p3', nombre: 'Zapatillas Street', precio: '74.50€' }
];

const formatoEUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }); // Convierte a estilo moneda EURO

function mostrarCatalogo() {
    const ul = document.getElementById('lista-carrito');
    for (const prenda of catalogo) {
        const precioNumerico = parseFloat(prenda.precio); // Sacar precio
        const precioFormateado = formatoEUR.format(precioNumerico); 

        const li = document.createElement('li');
        const check = document.createElement('input');
        
        check.type = 'checkbox'; 
        check.value = prenda.id;
        check.checked = true;
        
        li.append(check, ` ${prenda.nombre} - ${precioFormateado}`);
        ul.appendChild(li);
    }
}
mostrarCatalogo();

function calcularSubtotal() {
    const marcadas = [...document.querySelectorAll('#lista-carrito input:checked')] // Lee los producto seleccionado dentro de id lista-carrito
        .map(chk => chk.value); // Sacar valor

    let subtotal = 0;
    for (const prenda of catalogo) {
        if (marcadas.includes(prenda.id)) {
            const precioNumerico = parseFloat(prenda.precio);
            subtotal += precioNumerico;
        }
    }
    return subtotal;
}

// 2.2 Validación y cálculo de impuestos

function calcularImpuestos(subtotal) {
    // El subtotal debe ser un número seguro y válido antes de operar con él
    // (evita NaN, Infinity o desbordamientos)
    const esValido = Number.isFinite(subtotal);
    if (!esValido) return null;

    const cuponTexto = document.getElementById('cupon').value;
    const descuento = Math.min(parseFloat(cuponTexto) || 0, subtotal); // Controla el cupon no supera de subtotal

    const baseImponible = subtotal - descuento;
    const iva = baseImponible * 0.21; // 21% de IVA
    const total = baseImponible + iva;

    return { subtotal, descuento, iva, total };
}

// 2.3 Control de pedidos

let idPedido = 0; // identificador secuencial

function incrementarPedido() {
    idPedido += 1;
    return String(idPedido).padStart(4, '0');
}

// 2.4 Formateo regional

function mostrarDesglose(resultado) {
    const { subtotal, descuento, iva, total } = resultado;
    const filas = [
        ['Subtotal', subtotal],
        ['Descuento', -descuento],
        ['IVA (21%)', iva],
        ['Total a pagar', total]
    ];

    const ulDesglose = document.getElementById('desglose');
    ulDesglose.innerHTML = ''; // vacía contenido anterior
    for (const [etiqueta, valor] of filas) {
        const li = document.createElement('li');
        li.textContent = `${etiqueta}: ${formatoEUR.format(valor)}`;
        ulDesglose.appendChild(li);
    }
}

// Juntar los funciones
function calcularPedido() {
    const subtotal = calcularSubtotal();
    const resultado = calcularImpuestos(subtotal);

    if (resultado === null) {
        document.getElementById('pedido').textContent = 'No se pudo calcular el pedido: importe no válido.';
        return;
    }

    const pedido = incrementarPedido();
    mostrarDesglose(resultado);

    document.getElementById('pedido').textContent = `Pedido ${pedido} confirmado.`;
}

document.getElementById('btn-pedido').addEventListener('click', calcularPedido);


// Bloque 3: Promoción "Oferta Relámpago" (Temporizador con control de ejecución)

const DURACION_OFERTA = 15;
let segundosRestantes = DURACION_OFERTA;
let idIntervalo = null; // mientras sea null, no hay temporizador activo

const btnOferta = document.getElementById('btn-oferta');
const contador = document.getElementById('contador');
const estadoOferta = document.getElementById('estado-oferta');

// 3.1 Cuenta atrás

function iniciarCuentaAtras() {
    idIntervalo = setInterval(() => {
        segundosRestantes -= 1;
        contador.textContent = segundosRestantes;

        if (segundosRestantes <= 0) {
            finalizarOferta();
        }
    }, 1000);
}

// 3.2 Prevención de carreras y ejecuciones múltiples

function activarOferta() {
    if (idIntervalo !== null) return;
    btnOferta.disabled = true;
    estadoOferta.textContent = 'Oferta activa: date prisa.';
    iniciarCuentaAtras();
}

// 3.3 Finalización
function finalizarOferta() {
    clearInterval(idIntervalo);
    idIntervalo = null;// libera el control para permitir futuras promociones
    segundosRestantes = DURACION_OFERTA;
    contador.textContent = segundosRestantes;
    btnOferta.disabled = false;
    estadoOferta.textContent = 'La oferta ha expirado.';
}

btnOferta.addEventListener('click', activarOferta);

// Bloque 4: Reseñas de productos, seguridad y persistencia

const CLAVE_RESENAS = 'urbanStyle.resenas';
// 4.3 Persistencia local y gestión de errores

function leerResenas() {
    try {
        const bruto = localStorage.getItem(CLAVE_RESENAS);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error('No se pudieron leer las reseñas guardadas:', error);
        return [];
    }
}

function guardarResenas(lista) {
    try {
        localStorage.setItem(CLAVE_RESENAS, JSON.stringify(lista));
    } catch (error) {
        console.error('No se pudieron guardar las reseñas:', error);
    }
}

let resenas = leerResenas();

// 4.4 Renderizado seguro en el DOM

function mostrarResenas() {
    const ul = document.getElementById('lista-resenas');
    ul.innerHTML = '';
    for (const resena of resenas) {
        const li = document.createElement('li');
        li.textContent = `${resena.usuario} (${resena.hora}): ${resena.comentario}`;
        ul.appendChild(li);
    }
}

mostrarResenas();

// 4.1 Formulario de opiniones

document.getElementById('form-resena').addEventListener('submit', evento => {
    evento.preventDefault();
    const campo = document.getElementById('texto-resena');
    const comentario = campo.value.trim();
    if (!comentario) return;
    
    // 4.2 Estructura del registro

    const ahora = Date.now();
    const nuevaResena = {
        id: ahora,                                    // id basado en la marca de tiempo
        usuario,                                      // nombre capturado en el Bloque 1
        hora: new Date(ahora).toLocaleTimeString('es-ES'),
        comentario
    };

    resenas.push(nuevaResena);
    guardarResenas(resenas); //
    mostrarResenas();
    campo.value = '';
});