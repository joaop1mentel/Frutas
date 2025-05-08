const products = [
    { id: 1, name: "Produto 1", price: 10.50, image: "fruta.jpg" },
    { id: 2, name: "Produto 2", price: 75.00, image: "fruta.jpg" },
    { id: 3, name: "Produto 3", price: 120.00, image: "fruta.jpg" },
    { id: 4, name: "Produto 4", price: 90.00, image: "fruta.jpg" },
    { id: 5, name: "Produto 5", price: 60.00, image: "fruta.jpg" }
];

let cart = [];

document.addEventListener('DOMContentLoaded', function () {
    renderProducts();
    setupCart();
    updateCart();
});

function renderProducts(productsToRender = products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = ''; 
  
    productsToRender.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg';
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
          <p class="text-green-600 font-bold mt-2">R$ ${product.price.toFixed(2)}</p>
          <button onclick="addToCart(${product.id})" class="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition duration-200">
            Adicionar ao Carrinho
          </button>
        </div>`;
      productGrid.appendChild(productCard);
    });
  }

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
    }
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const checkoutBtn = document.getElementById("checkoutBtn");

    cartItems.innerHTML = "";
    let total = 0;
    let quantity = 0;

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "flex justify-between items-center py-2 border-b";
        div.innerHTML = `
            <div>
                <p class="font-medium">${item.name}</p>
                <p class="text-sm text-gray-600">R$ ${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700 p-2">
                <i class="fas fa-minus-circle"></i>
            </button>
        `;
        cartItems.appendChild(div);

        total += item.price * item.quantity;
        quantity += item.quantity;
    });

    cartCount.textContent = quantity;
    checkoutBtn.disabled = cart.length === 0;
}

function setupCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    cartIcon.addEventListener('click', () => {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
    });

    closeCartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
    });

    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
    });

    checkoutBtn.addEventListener('click', generateQRCode);
}

function generateQRCode() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const paymentInstructions = document.getElementById('paymentInstructions');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const wppBtn = document.getElementById('wppBtn');

    qrCodeContainer.innerHTML = '';
    paymentInstructions.innerHTML = '';

    const chavePix = 'pixpimentel@gmail.com';
    const nomeRecebedor = 'Seu Nome ou Empresa';
    const cidade = 'RIO';
    const valor = total.toFixed(2);

    const payload = gerarPayloadPix({
        chave: chavePix,
        nome: nomeRecebedor,
        cidade: cidade,
        valor: valor
    });

    new QRCode(qrCodeContainer, {
        text: payload,
        width: 200,
        height: 200
    });

    paymentInstructions.innerHTML = `
        <h3 class="font-bold text-lg mb-2">Pedido Finalizado!</h3>
        <p class="mb-1">1. Faça o pagamento via o QR Code acima.</p>
        <p class="mb-1">2. Envie o <strong>comprovante</strong> junto com o <strong>endereço</strong> de entrega para o <strong>nosso whatsapp</strong>.</p>
        <div class="bg-green-100 text-green-800 px-4 py-2 rounded mt-6 shadow font-bold text-lg">
            Total: R$ ${valor.replace('.', ',')}
        </div>
    `;

    checkoutBtn.classList.add('hidden');
    checkoutBtn.disabled = true;
    wppBtn.classList.remove('hidden');
}

function gerarPayloadPix({ chave, nome, cidade, valor }) {
    function format(key, value) {
        const length = value.length;
        return `${key}${length.toString().padStart(2, '0')}${value}`;

    }

    const payload =
        '000201' +
        format('26', '0014br.gov.bcb.pix' + format('01', chave)) +
        format('52', '0000') +
        format('53', '986') + 
        format('54', valor) +
        format('58', 'BR') +
        format('59', nome.padEnd(13)) +
        format('60', cidade) +
        format('62', format('05', '***'));

    const fullPayload = payload + '6304';
    const crc16 = CRC16(fullPayload);
    return fullPayload + crc16;
}

function CRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("O carrinho está vazio.");
        return;
    }

    const itemsText = cart.map(item => 
        `${item.name} - ${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}`
    ).join('\n');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2).replace('.', ',');

    const rawMessage = `Gostaria de Pedir:\n\n${itemsText}\n\n No valor total: R$ ${total}\n\n.`;
    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/xxxxxxxxxx?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    cart = [];
    updateCart();
}

function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.price.toString().includes(searchTerm)
    );
    
    renderFilteredProducts(filteredProducts);
  }
  
  function renderFilteredProducts(filteredProducts) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
  
    if (filteredProducts.length === 0) {
      productGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }
  
    filteredProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg';
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
          <p class="text-green-600 font-bold mt-2">R$ ${product.price.toFixed(2)}</p>
          <button onclick="addToCart(${product.id})" class="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition duration-200">
            Adicionar ao Carrinho
          </button>
        </div>`;
      productGrid.appendChild(productCard);
    });
  }
  function clearSearch() {
    document.getElementById('searchInput').value = '';
    renderProducts();
    document.getElementById('clearSearch').classList.add('hidden');
  }
  
  function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.price.toString().includes(searchTerm)
    );
    
    renderFilteredProducts(filteredProducts);
    
    if (searchTerm) {
      document.getElementById('clearSearch').classList.remove('hidden');
    } else {
      document.getElementById('clearSearch').classList.add('hidden');
    }
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    renderProducts();
    setupCart();
    updateCart();
    
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        searchProducts();
      }
    });
  });
