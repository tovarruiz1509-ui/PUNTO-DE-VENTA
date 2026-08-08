const defaultProducts = [
  { id: 1, barcode: "7501001", name: "Harina de Maíz", price: 1.20 },
  { id: 2, barcode: "7501002", name: "Arroz 1kg", price: 1.10 },
  { id: 3, barcode: "7501003", name: "Aceite vegetal 1L", price: 2.50 },
  { id: 4, barcode: "7501004", name: "Azúcar 1kg", price: 1.30 },
  { id: 5, barcode: "7501005", name: "Café 250g", price: 3.00 }
];

let products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
let cart = [];
let exchangeRate = 0;

// Elementos DOM
const rateDisplay = document.getElementById('rate-display');
const btnChangeRate = document.getElementById('btn-change-rate');
const barcodeInput = document.getElementById('barcode-input');
const productList = document.getElementById('product-list');
const cartBody = document.getElementById('cart-body');
const cartTotalUsd = document.getElementById('cart-total-usd');
const cartTotalBs = document.getElementById('cart-total-bs');
const paymentMethodSelect = document.getElementById('payment-method');
const pagoMovilContainer = document.getElementById('pago-movil-container');
const pagoMovilRefInput = document.getElementById('pago-movil-ref');
const btnCheckout = document.getElementById('btn-checkout');
const receiptModal = document.getElementById('receipt-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

// Formulario Producto
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const productIdInput = document.getElementById('product-id');
const productBarcodeInput = document.getElementById('product-barcode');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const btnSaveProduct = document.getElementById('btn-save-product');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

function saveProductsToStorage() {
  localStorage.setItem('products', JSON.stringify(products));
}

function initExchangeRate() {
  const today = new Date().toISOString().split('T')[0];
  const savedDate = localStorage.getItem('rateDate');
  const savedRate = localStorage.getItem('exchangeRate');

  if (savedDate === today && savedRate) {
    exchangeRate = parseFloat(savedRate);
  } else {
    askNewRate(today);
  }
  updateRateUI();
  renderCatalog();
}

function askNewRate(todayDate) {
  let inputRate = prompt("¡Buenos días! Ingrese la tasa del dólar (BCV / Día) en Bolívares (BS):");
  let rate = parseFloat(inputRate);

  while (isNaN(rate) || rate <= 0) {
    inputRate = prompt("Valor inválido. Por favor ingrese una tasa válida en Bolívares (BS):");
    rate = parseFloat(inputRate);
  }

  exchangeRate = rate;
  localStorage.setItem('exchangeRate', rate);
  localStorage.setItem('rateDate', todayDate || new Date().toISOString().split('T')[0]);
}

function updateRateUI() {
  rateDisplay.textContent = `${exchangeRate.toFixed(2)} BS`;
}

btnChangeRate.addEventListener('click', () => {
  askNewRate();
  updateRateUI();
  renderCatalog();
  updateCart();
});

/* --- GESTIÓN DE PRODUCTOS (Crear, Editar, Eliminar) --- */
productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = productIdInput.value;
  const barcode = productBarcodeInput.value.trim();
  const name = productNameInput.value.trim();
  const price = parseFloat(productPriceInput.value);

  // Validar código duplicado en creación
  const existingProduct = products.find(p => p.barcode === barcode && p.id != id);
  if (existingProduct) {
    alert('Ya existe un producto registrado con ese mismo código de barras.');
    return;
  }

  if (id) {
    // Editar
    const index = products.findIndex(p => p.id == id);
    if (index > -1) {
      products[index] = { id: Number(id), barcode, name, price };
    }
  } else {
    // Crear
    const newProduct = {
      id: Date.now(),
      barcode,
      name,
      price
    };
    products.push(newProduct);
  }

  saveProductsToStorage();
  resetForm();
  renderCatalog();
  updateCart();
});

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  productIdInput.value = product.id;
  productBarcodeInput.value = product.barcode;
  productNameInput.value = product.name;
  productPriceInput.value = product.price;

  formTitle.textContent = 'Editar Producto';
  btnSaveProduct.textContent = 'Actualizar';
  btnCancelEdit.classList.remove('hidden');
}

function deleteProduct(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    products = products.filter(p => p.id !== id);
    saveProductsToStorage();
    renderCatalog();
  }
}

function resetForm() {
  productIdInput.value = '';
  productForm.reset();
  formTitle.textContent = 'Crear Nuevo Producto';
  btnSaveProduct.textContent = 'Guardar Producto';
  btnCancelEdit.classList.add('hidden');
}

btnCancelEdit.addEventListener('click', resetForm);

/* --- RENDERIZADO DE CATÁLOGO --- */
function renderCatalog() {
  productList.innerHTML = '';
  products.forEach(product => {
    const priceBs = product.price * exchangeRate;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div>
        <h3>${product.name}</h3>
        <div class="price-usd">$${product.price.toFixed(2)}</div>
        <div class="price-bs">${priceBs.toFixed(2)} BS</div>
        <small>Cód: ${product.barcode}</small>
      </div>
      <div class="product-actions">
        <button class="btn-card-add" onclick="addToCartById(${product.id})">+ Agregar</button>
        <button class="btn-card-edit" onclick="editProduct(${product.id})" title="Editar">✏️</button>
        <button class="btn-card-delete" onclick="deleteProduct(${product.id})" title="Eliminar">🗑️</button>
      </div>
    `;
    productList.appendChild(card);
  });
}

function addToCartById(id) {
  const product = products.find(p => p.id === id);
  if (product) addToCart(product);
}

function addToCart(product) {
  const existingIndex = cart.findIndex(item => item.id === product.id);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
}

function updateCart() {
  cartBody.innerHTML = '';
  let totalUsd = 0;

  cart.forEach((item, index) => {
    const itemTotalUsd = item.price * item.quantity;
    const itemTotalBs = itemTotalUsd * exchangeRate;
    totalUsd += itemTotalUsd;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.quantity}</td>
      <td>$${itemTotalUsd.toFixed(2)}</td>
      <td>${itemTotalBs.toFixed(2)} BS</td>
      <td><button class="btn-remove" onclick="removeFromCart(${index})">×</button></td>
    `;
    cartBody.appendChild(row);
  });

  const totalBs = totalUsd * exchangeRate;
  cartTotalUsd.textContent = `$${totalUsd.toFixed(2)}`;
  cartTotalBs.textContent = `${totalBs.toFixed(2)} BS`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

paymentMethodSelect.addEventListener('change', (e) => {
  if (e.target.value === 'Pago Móvil') {
    pagoMovilContainer.classList.remove('hidden');
    pagoMovilRefInput.focus();
  } else {
    pagoMovilContainer.classList.add('hidden');
    pagoMovilRefInput.value = '';
  }
});

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

btnCheckout.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  const selectedMethod = paymentMethodSelect.value;
  const refValue = pagoMovilRefInput.value.trim();

  if (selectedMethod === 'Pago Móvil') {
    if (refValue.length !== 4 || isNaN(refValue)) {
      alert('Para procesar con Pago Móvil debes ingresar los últimos 4 dígitos numéricos de la referencia.');
      pagoMovilRefInput.focus();
      return;
    }
  }

  document.getElementById('receipt-date').textContent = `Fecha: ${new Date().toLocaleString()}`;
  document.getElementById('receipt-rate-info').textContent = `Tasa del día: 1 USD = ${exchangeRate.toFixed(2)} BS`;
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
  let totalUsd = 0;

  cart.forEach(item => {
    const itemTotalUsd = item.price * item.quantity;
    const itemTotalBs = itemTotalUsd * exchangeRate;
    totalUsd += itemTotalUsd;

    const div = document.createElement('div');
    div.className = 'receipt-item-row';
    div.innerHTML = `
      <span>${item.quantity}x ${item.name}</span>
      <span>$${itemTotalUsd.toFixed(2)} (${itemTotalBs.toFixed(2)} BS)</span>
    `;
    receiptItemsContainer.appendChild(div);
  });

  const totalBs = totalUsd * exchangeRate;
  document.getElementById('receipt-total-usd').textContent = `$${totalUsd.toFixed(2)}`;
  document.getElementById('receipt-total-bs').textContent = `${totalBs.toFixed(2)} BS`;

  receiptModal.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  receiptModal.classList.add('hidden');
  cart = [];
  pagoMovilRefInput.value = '';
  paymentMethodSelect.value = 'Efectivo';
  pagoMovilContainer.classList.add('hidden');
  updateCart();
  barcodeInput.focus();
});

initExchangeRate();