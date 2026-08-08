// Lista por defecto (se usa solo si el almacenamiento local está vacío)
const productosPorDefecto = [
  { id: 101, nombre: "Leche 1L", precio: 1.50, icono: "🥛" },
  { id: 102, nombre: "Pan Molde", precio: 2.20, icono: "🍞" },
  { id: 103, nombre: "Huevos x12", precio: 3.00, icono: "🥚" },
  { id: 104, nombre: "Manzana 1Kg", precio: 2.50, icono: "🍎" },
  { id: 105, nombre: "Arroz 1Kg", precio: 1.10, icono: "🌾" },
  { id: 106, nombre: "Café 250g", precio: 4.50, icono: "☕" },
  { id: 107, nombre: "Queso 500g", precio: 3.80, icono: "🧀" },
  { id: 108, nombre: "Agua 1.5L", precio: 0.80, icono: "💧" },
];

// Cargar productos e historial desde LocalStorage
let productos = JSON.parse(localStorage.getItem("pos_productos")) || productosPorDefecto;
let historialVentas = JSON.parse(localStorage.getItem("historial_ventas_pos")) || [];
let carrito = [];

// Elementos del DOM
const gridProductos = document.getElementById("productos-grid");
const listaCarrito = document.getElementById("lista-carrito");
const inputBuscar = document.getElementById("input-buscar");
const subtotalEl = document.getElementById("subtotal");
const impuestoEl = document.getElementById("impuesto");
const totalEl = document.getElementById("total");
const pagoClienteInput = document.getElementById("pago-cliente");
const vueltoEl = document.getElementById("vuelto");
const btnCobrar = document.getElementById("btn-cobrar");

// Modales y Formulario
const modalProducto = document.getElementById("modal-producto");
const btnAbrirModalProd = document.getElementById("btn-abrir-modal-prod");
const formNuevoProducto = document.getElementById("form-nuevo-producto");

const modalHistorial = document.getElementById("modal-historial");
const btnVerHistorial = document.getElementById("btn-ver-historial");

// Renderizar catálogo
function cargarProductos(filtro = "") {
  gridProductos.innerHTML = "";
  const filtrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) || p.id.toString().includes(filtro)
  );

  filtrados.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto-card";
    card.onclick = () => agregarAlCarrito(p.id);
    card.innerHTML = `
      <div class="producto-icon">${p.icono}</div>
      <div class="producto-nombre">${p.nombre}</div>
      <div class="producto-precio">$${p.precio.toFixed(2)}</div>
    `;
    gridProductos.appendChild(card);
  });
}

// Abrir y cerrar modales
btnAbrirModalProd.addEventListener("click", () => {
  modalProducto.style.display = "flex";
});

function cerrarModalProducto() {
  modalProducto.style.display = "none";
  formNuevoProducto.reset();
}

btnVerHistorial.addEventListener("click", () => {
  actualizarModalHistorial();
  modalHistorial.style.display = "flex";
});

function cerrarHistorial() {
  modalHistorial.style.display = "none";
}

// Guardar nuevo producto en array y en LocalStorage
formNuevoProducto.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("prod-nombre").value;
  const precio = parseFloat(document.getElementById("prod-precio").value);
  const icono = document.getElementById("prod-icono").value || "📦";

  const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 101;

  productos.push({ id: nuevoId, nombre, precio, icono });
  localStorage.setItem("pos_productos", JSON.stringify(productos));

  cargarProductos();
  cerrarModalProducto();
});

// Operaciones del Carrito
function agregarAlCarrito(id) {
  const itemExistente = carrito.find(item => item.id === id);
  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    const producto = productos.find(p => p.id === id);
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarCarrito();
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(i => i.id === id);
  if (item) {
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
      carrito = carrito.filter(i => i.id !== id);
    }
  }
  actualizarCarrito();
}

function actualizarCarrito() {
  listaCarrito.innerHTML = "";
  let subtotal = 0;

  carrito.forEach(item => {
    const totalItem = item.precio * item.cantidad;
    subtotal += totalItem;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>
        <button onclick="cambiarCantidad(${item.id}, -1)">-</button>
        ${item.cantidad}
        <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
      </td>
      <td>$${item.precio.toFixed(2)}</td>
      <td>$${totalItem.toFixed(2)}</td>
      <td><button class="btn-eliminar" onclick="cambiarCantidad(${item.id}, -${item.cantidad})">✕</button></td>
    `;
    listaCarrito.appendChild(tr);
  });

  const impuesto = subtotal * 0.16;
  const total = subtotal + impuesto;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  impuestoEl.textContent = `$${impuesto.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;

  calcularVuelto(total);
}

function calcularVuelto(totalVenta) {
  const pago = parseFloat(pagoClienteInput.value) || 0;
  const vuelto = pago - totalVenta;

  if (vuelto >= 0 && totalVenta > 0) {
    vueltoEl.textContent = `$${vuelto.toFixed(2)}`;
    btnCobrar.disabled = false;
  } else {
    vueltoEl.textContent = "$0.00";
    btnCobrar.disabled = true;
  }
}

// Cobro, Registro en Historial y Generación de Ticket
btnCobrar.addEventListener("click", () => {
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const impuesto = subtotal * 0.16;
  const total = subtotal + impuesto;
  const pago = parseFloat(pagoClienteInput.value);
  const vuelto = pago - total;
  const fechaHora = new Date();

  const nuevaVenta = {
    id: Date.now(),
    fecha: fechaHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalItems: carrito.reduce((acc, i) => acc + i.cantidad, 0),
    totalMonto: total,
    items: [...carrito]
  };

  historialVentas.push(nuevaVenta);
  localStorage.setItem("historial_ventas_pos", JSON.stringify(historialVentas));

  document.getElementById("ticket-fecha").textContent = fechaHora.toLocaleString();
  document.getElementById("ticket-items").innerHTML = carrito.map(i => `<p>${i.nombre} x${i.cantidad} = $${(i.precio * i.cantidad).toFixed(2)}</p>`).join("");
  document.getElementById("ticket-totales").innerHTML = `
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    <p>IVA: $${impuesto.toFixed(2)}</p>
    <p><strong>TOTAL: $${total.toFixed(2)}</strong></p>
    <p>Pago: $${pago.toFixed(2)}</p>
    <p>Vuelto: $${vuelto.toFixed(2)}</p>
  `;

  document.getElementById("modal-ticket").style.display = "flex";
});

function cerrarTicket() {
  document.getElementById("modal-ticket").style.display = "none";
  carrito = [];
  pagoClienteInput.value = "";
  actualizarCarrito();
}

// Actualizar Vista del Historial
function actualizarModalHistorial() {
  const listaHistorial = document.getElementById("lista-historial");
  const resumenCant = document.getElementById("resumen-cant-ventas");
  const resumenIngresos = document.getElementById("resumen-ingresos");

  listaHistorial.innerHTML = "";
  let totalIngresos = 0;

  historialVentas.forEach(v => {
    totalIngresos += v.totalMonto;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.fecha}</td>
      <td>${v.totalItems} prod.</td>
      <td><strong>$${v.totalMonto.toFixed(2)}</strong></td>
    `;
    listaHistorial.appendChild(tr);
  });

  resumenCant.textContent = historialVentas.length;
  resumenIngresos.textContent = `$${totalIngresos.toFixed(2)}`;
}

function limpiarHistorial() {
  if (confirm("¿Estás seguro de reiniciar las ventas del día a cero?")) {
    historialVentas = [];
    localStorage.removeItem("historial_ventas_pos");
    actualizarModalHistorial();
  }
}

// Eventos generales
inputBuscar.addEventListener("input", (e) => cargarProductos(e.target.value));
pagoClienteInput.addEventListener("input", () => {
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  calcularVuelto(subtotal * 1.16);
});

// Inicializar
cargarProductos();
