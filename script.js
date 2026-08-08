const products = [
  { id: 1, barcode: "7501001", name: "Harina de Maíz", price: 1.20 },
  { id: 2, barcode: "7501002", name: "Arroz 1kg", price: 1.10 },
  { id: 3, barcode: "7501003", name: "Aceite vegetal 1L", price: 2.50 },
  { id: 4, barcode: "7501004", name: "Azúcar 1kg", price: 1.30 },
  { id: 5, barcode: "7501005", name: "Café 250g", price: 3.00 }
];

let cart = [];

const barcodeInput = document.getElementById('barcode-input');
const productList = document.getElementById('product-list');
const cartBody = document.getElementById('cart-body');
const cartTotal = document.getElementById('cart-total');
const paymentMethodSelect = document.getElementById('payment-method');
const pagoMovilContainer = document.getElementById('pago-movil-container');
const pagoMovilRefInput = document.getElementById('pago-movil-ref');
const btnCheckout = document.getElementById('btn-checkout');
const receiptModal = document.getElementById('receipt-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

// Cargar catálogo de productos
function renderCatalog() {
  productList.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
      <small>Cód: ${product.barcode}</small>
    `;
    card.addEventListener('click', () => addToCart(product));
    productList.appendChild(card);
  });
}

// Agregar al carrito
function addToCart(product) {
  const existingIndex = cart.findIndex(item => item.id === product.id);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
}

// Actualizar vista del carrito
function updateCart() {
  cartBody.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${itemTotal.toFixed(2)}</td>
      <td><button class="btn-remove" onclick="removeFromCart(${index})">X</button></td>
    `;
    cartBody.appendChild(row);
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Eliminar ítem del carrito
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Mostrar / ocultar campo de Pago Móvil según método seleccionado
paymentMethodSelect.addEventListener('change', (e) => {
  if (e.target.value === 'Pago Móvil') {
    pagoMovilContainer.classList.remove('hidden');
    pagoMovilRefInput.focus();
  } else {
    pagoMovilContainer.classList.add('hidden');
    pagoMovilRefInput.value = '';
  }
});

// Escáner de código de barras
barcodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const code = barcodeInput.value.trim();
    if (code) {
      const foundProduct = products.find(p => p.barcode === code);
      if (foundProduct) {
        addToCart(foundProduct);
        barcodeInput.value = '';
      } else {
        alert('Producto no encontrado');
      }
    }
  }
});

// Procesar Pago y Generar Factura
btnCheckout.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  const selectedMethod = paymentMethodSelect.value;
  const refValue = pagoMovilRefInput.value.trim();

  // Validación de Pago Móvil (Exactamente 4 dígitos numéricos)
  if (selectedMethod === 'Pago Móvil') {
    if (refValue.length !== 4 || isNaN(refValue)) {
      alert('Para procesar con Pago Móvil debes ingresar los últimos 4 dígitos numéricos de la referencia.');
      pagoMovilRefInput.focus();
      return;
    }
  }

  // Generar datos de factura
  document.getElementById('receipt-date').textContent = `Fecha: ${new Date().toLocaleString()}`;
  document.getElementById('receipt-payment-method').textContent = selectedMethod;

  const receiptRefRow = document.getElementById('receipt-ref-row');
  if (selectedMethod === 'Pago Móvil') {
    document.getElementById('receipt-ref').textContent = refValue;
    receiptRefRow.classList.remove('hidden');
  } else {
    receiptRefRow.classList.add('hidden');
  }

  const receiptItemsContainer = document.getElementById('receipt-items');
  receiptItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const div = document.createElement('div');
    div.className = 'receipt-item';
    div.innerHTML = `
      <span>${item.quantity}x ${item.name}</span>
      <span>$${item.price.toFixed(2)} -> $${itemTotal.toFixed(2)}</span>
    `;
    receiptItemsContainer.appendChild(div);
  });

  document.getElementById('receipt-total').textContent = `$${total.toFixed(2)}`;

  // Mostrar modal de factura
  receiptModal.classList.remove('hidden');
});

// Cerrar factura y limpiar carrito
btnCloseModal.addEventListener('click', () => {
  receiptModal.classList.add('hidden');
  cart = [];
  pagoMovilRefInput.value = '';
  paymentMethodSelect.value = 'Efectivo';
  pagoMovilContainer.classList.add('hidden');
  updateCart();
  barcodeInput.focus();
});

// Inicializar
renderCatalog();