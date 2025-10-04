// Initialize jsPDF
const { jsPDF } = window.jspdf;

/* ========================
   Dados: produtos (licenças)
   ======================== */
let PRODUCTS = JSON.parse(localStorage.getItem('eg_products')) || [
  { id:'G-BASIC', name:'GestCom Basic', price:0, type:'perpetual', desc:'Versão gratuita para testes; sem suporte.', features:['Controle de stock','Vendas básicas'], sales: 15 },
  { id:'G-PRO', name:'GestCom Pro', price:6200, type:'annual', desc:'Licença anual para PME, inclui atualizações.', features:['Relatórios avançados','Suporte 1 ano'], sales: 8 },
  { id:'G-ENT', name:'GestCom Enterprise', price:24900, type:'annual', desc:'Licença empresarial com integração e suporte.', features:['Integração API','Suporte prioritário'], sales: 3 },
  { id:'TX-STD', name:'TxunaJob Standard', price:3100, type:'annual', desc:'Licença para plataforma de serviços locais.', features:['Painel de admin','Publicação de serviços'], sales: 5 },
  { id:'CUSTOM', name:'Licença Custom', price:0, type:'custom', desc:'Licença e orçamento personalizado. Contacte para proposta.', features:['Consultoria','Desenvolvimento'], sales: 12 }
];

/* ---------- Estado global ---------- */
let CART = JSON.parse(localStorage.getItem('eg_cart')||'[]');
let ORDERS = JSON.parse(localStorage.getItem('eg_orders')||'[]');
let WISHLIST = JSON.parse(localStorage.getItem('eg_wishlist')||'[]');
let USER_DATA = JSON.parse(localStorage.getItem('eg_user')||'{"points":0,"level":1,"badges":[]}');
let ADMIN_LOGGED_IN = false;
let CURRENT_TAB = 'orders';

/* ---------- Helpers ---------- */
function currency(n){ return n===0? 'Grátis' : 'MZN '+n.toFixed(2); }
function saveCart(){ localStorage.setItem('eg_cart', JSON.stringify(CART)); updateCartUI(); }
function saveOrders(){ localStorage.setItem('eg_orders', JSON.stringify(ORDERS)); }
function saveWishlist(){ localStorage.setItem('eg_wishlist', JSON.stringify(WISHLIST)); updateWishlistUI(); }
function saveUserData(){ localStorage.setItem('eg_user', JSON.stringify(USER_DATA)); updateGamificationUI(); }
function saveProducts(){ localStorage.setItem('eg_products', JSON.stringify(PRODUCTS)); }

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({behavior:'smooth'});
  // Close mobile menu if open
  document.getElementById('mainNav').classList.remove('active');
}

/* ---------- Theme Toggle ---------- */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

function initTheme() {
  const savedTheme = localStorage.getItem('eg_theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('eg_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

themeToggle.addEventListener('click', toggleTheme);

/* ---------- Render produtos ---------- */
const productGrid = document.getElementById('productGrid');
function renderProducts(){
  const q = (document.getElementById('search').value || '').toLowerCase();
  const type = document.getElementById('filter-type').value;
  const sort = document.getElementById('sort-by').value;

  let items = PRODUCTS.filter(p=>{
    return (!type || p.type===type) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  });

  // Sorting
  if(sort==='price-asc') items.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc') items.sort((a,b)=>b.price-a.price);
  if(sort==='name') items.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='popular') items.sort((a,b)=>(b.sales || 0) - (a.sales || 0));

  productGrid.innerHTML = '';
  items.forEach(p=>{
    const isInWishlist = WISHLIST.includes(p.id);
    const el = document.createElement('div'); 
    el.className='product fadeIn';
    el.innerHTML = `
      ${p.sales > 10 ? '<div class="badge">Popular</div>' : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <h3>${p.name}</h3>
          <div class="meta">${p.desc}</div>
          <div style="margin-top:8px">${p.features.map(f=>`<span class="small muted">• ${f}</span>`).join(' ')}</div>
        </div>
        <div style="text-align:right">
          <div class="price">${currency(p.price)}</div>
          <div class="meta" style="margin-top:6px">${p.type==='annual'?'Anual': p.type==='perpetual'?'Perpétua':'Personalizada'}</div>
          <div class="meta" style="margin-top:2px">${p.sales || 0} vendas</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" onclick="addToCartById('${p.id}')">Adicionar</button>
        <button class="btn ghost" onclick="showProduct('${p.id}')">Detalhes</button>
        <button class="btn ghost" onclick="toggleWishlist('${p.id}')">
          <i class="${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
      </div>
    `;
    productGrid.appendChild(el);
  });
}

/* ---------- Busca / filtros ---------- */
document.getElementById('search').addEventListener('input', renderProducts);
document.getElementById('filter-type').addEventListener('change', renderProducts);
document.getElementById('sort-by').addEventListener('change', renderProducts);

/* ---------- Carrinho UI ---------- */
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartItems = document.getElementById('cartItems');
const cartTotalText = document.getElementById('cartTotalText');

function updateCartUI(){
  cartCount.textContent = CART.length;
  cartItems.innerHTML = '';
  let total = 0;
  CART.forEach((it, idx)=>{
    total += it.price;
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `<div>
        <div style="font-weight:700">${it.name}</div>
        <div class="small muted">${it.id}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${currency(it.price)}</div>
        <div style="margin-top:6px"><button class="btn ghost" onclick="removeFromCart(${idx})">Remover</button></div>
      </div>`;
    cartItems.appendChild(div);
  });
  cartTotalText.textContent = 'Total: '+currency(total);
}

cartBtn.addEventListener('click', ()=>{ 
  cartPanel.style.display = cartPanel.style.display==='none'?'block':'none'; 
  updateCartUI();
  // Close wishlist if open
  document.getElementById('wishlistPanel').style.display = 'none';
});

function addToCartById(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return alert('Produto inválido');
  // For custom (price 0), open contact
  if(p.id==='CUSTOM'){ scrollToSection('contato'); alert('Solicite uma proposta personalizada.'); return; }
  CART.push({...p});
  saveCart();
  showToast('Adicionado ao carrinho ✨');
}

function removeFromCart(i){ CART.splice(i,1); saveCart(); }

function clearCart(){ if(!confirm('Esvaziar o carrinho?')) return; CART=[]; saveCart(); }

/* ---------- Wishlist ---------- */
function toggleWishlist(productId) {
  const index = WISHLIST.indexOf(productId);
  if (index > -1) {
    WISHLIST.splice(index, 1);
    showToast('Removido dos favoritos');
  } else {
    WISHLIST.push(productId);
    showToast('Adicionado aos favoritos 💖');
  }
  saveWishlist();
  renderProducts(); // Update heart icons
}

function updateWishlistUI() {
  const wishlistItems = document.getElementById('wishlistItems');
  wishlistItems.innerHTML = '';
  
  if (WISHLIST.length === 0) {
    wishlistItems.innerHTML = '<div class="muted" style="text-align:center;padding:20px">Nenhum produto nos favoritos</div>';
    return;
  }
  
  WISHLIST.forEach(productId => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
      const div = document.createElement('div'); 
      div.className='cart-item';
      div.innerHTML = `<div>
          <div style="font-weight:700">${product.name}</div>
          <div class="small muted">${currency(product.price)}</div>
        </div>
        <div style="text-align:right">
          <div style="margin-top:6px">
            <button class="btn ghost" onclick="addToCartById('${product.id}')"><i class="fa-solid fa-cart-plus"></i></button>
            <button class="btn ghost" onclick="toggleWishlist('${product.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      wishlistItems.appendChild(div);
    }
  });
}

function showWishlist() {
  document.getElementById('wishlistPanel').style.display = 'block';
  document.getElementById('cartPanel').style.display = 'none';
  updateWishlistUI();
}

function hideWishlist() {
  document.getElementById('wishlistPanel').style.display = 'none';
}

/* ---------- Gamification ---------- */
function updateGamificationUI() {
  document.getElementById('userPoints').textContent = USER_DATA.points;
  document.getElementById('nextLevel').textContent = USER_DATA.level * 100;
  document.getElementById('levelProgress').style.width = `${(USER_DATA.points / (USER_DATA.level * 100)) * 100}%`;
  
  // Update badge collection
  const badges = document.querySelectorAll('.badge-item');
  badges.forEach((badge, index) => {
    if (USER_DATA.badges.includes(index)) {
      badge.style.borderColor = 'var(--accent)';
      badge.style.opacity = '1';
    } else {
      badge.style.borderColor = 'var(--muted)';
      badge.style.opacity = '0.5';
    }
  });
}

function addUserPoints(points) {
  USER_DATA.points += points;
  
  // Check for level up
  const pointsNeeded = USER_DATA.level * 100;
  if (USER_DATA.points >= pointsNeeded) {
    USER_DATA.level++;
    showToast(`Parabéns! Subiu para o nível ${USER_DATA.level} 🎉`);
    
    // Award badges based on level
    if (USER_DATA.level >= 2 && !USER_DATA.badges.includes(1)) {
      USER_DATA.badges.push(1);
      showToast('Desbloqueou o badge Cliente Fiel! 👑');
    }
    if (USER_DATA.level >= 3 && !USER_DATA.badges.includes(2)) {
      USER_DATA.badges.push(2);
      showToast('Desbloqueou o badge Comprador Frequente! ⚡');
    }
  }
  
  // First purchase badge
  if (ORDERS.length === 1 && !USER_DATA.badges.includes(0)) {
    USER_DATA.badges.push(0);
    showToast('Desbloqueou o badge Primeira Compra! ⭐');
  }
  
  saveUserData();
}

/* ---------- Produto modal / detalhes simples ---------- */
function showProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const features = p.features.map(f=>`<li>${f}</li>`).join('');
  const isInWishlist = WISHLIST.includes(p.id);
  const modalHtml = `
    <div class="modal-back" style="display:flex;align-items:center;justify-content:center">
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${p.name}</strong><div class="small muted">${p.id} • ${p.type==='annual'?'Anual':p.type} • ${p.sales || 0} vendas</div></div>
          <div><button class="btn ghost" onclick="document.querySelector('.modal-back').remove()">Fechar</button></div>
        </div>
        <div style="margin-top:12px">
          <p class="muted">${p.desc}</p>
          <ul class="muted">${features}</ul>
          <div style="margin-top:12px;font-weight:800">${currency(p.price)}</div>
          <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
            <button class="btn ghost" onclick="toggleWishlist('${p.id}')">
              <i class="${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="btn ghost" onclick="document.querySelector('.modal-back').remove()">Cancelar</button>
            <button class="btn primary" onclick="addToCartById('${p.id}'); document.querySelector('.modal-back').remove()">Adicionar</button>
          </div>
        </div>
      </div>
    </div>`;
  const wrapper = document.createElement('div'); 
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper);
}

/* ---------- Checkout ---------- */
function openCheckout(){
  if(CART.length===0) return alert('Carrinho vazio.');
  document.getElementById('checkoutModal').style.display = 'flex';
  // render summary
  const list = document.getElementById('checkoutList');
  list.innerHTML = CART.map(it=>`<div style="display:flex;justify-content:space-between"><div>${it.name}</div><div>${currency(it.price)}</div></div>`).join('');
  const total = CART.reduce((s,i)=>s+i.price,0);
  document.getElementById('checkoutTotal').textContent = 'Total: '+currency(total);
  
  // Calculate points (1 point per MZN)
  const points = Math.floor(total / 100); // 1 ponto a cada 100 MZN
  document.getElementById('pointsEarned').textContent = points;
}
function closeCheckout(){ document.getElementById('checkoutModal').style.display='none'; }

/* ---------- Processa pagamento (simulado) e gera licenças ---------- */
function processPayment(){
  const name = document.getElementById('buyerName').value.trim();
  const email = document.getElementById('buyerEmail').value.trim();
  const description = document.getElementById('licenseDescription').value.trim();
  if(!name || !email) return alert('Preencha nome e email.');
  
  // Simular "pagamento"
  showToast('Processando pagamento…');
  setTimeout(()=>{
    // Update product sales
    CART.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (product) {
        product.sales = (product.sales || 0) + 1;
      }
    });
    saveProducts();
    
    // Generate licenses
    const licenses = CART.map(item=>{
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + (item.type === 'annual' ? 1 : 100)); // 100 years for perpetual
      
      return { 
        orderId: 'ORD-'+Date.now().toString(36).toUpperCase().slice(-6), 
        product: item.name, 
        productId: item.id, 
        key: generateKey(item.id),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        customer: name,
        email: email,
        description: description
      };
    });
    
    // Create order and save
    const order = { 
      id:'ORD-'+Date.now().toString(36).toUpperCase(), 
      buyer:{name,email,org:document.getElementById('buyerOrg').value||'', description}, 
      items:CART.map(i=>({id:i.id,name:i.name,price:i.price})), 
      total:CART.reduce((s,i)=>s+i.price,0), 
      licenses, 
      date:new Date().toISOString(),
      status: 'paid'
    };
    
    ORDERS.push(order); 
    saveOrders();
    
    // Add user points
    const pointsEarned = Math.floor(order.total / 100); // 1 ponto a cada 100 MZN
    addUserPoints(pointsEarned);
    
    // Clear cart
    CART = []; 
    saveCart();
    closeCheckout();
    showToast('Pagamento confirmado. Licenças geradas!');
    
    // Generate PDF for each license
    licenses.forEach(l=>{
      generateLicensePDF(l, order);
    });
  }, 900);
}

/* ---------- Gera chave de licença pseudo-única ---------- */
function generateKey(productId){
  const rand = Math.random().toString(36).substring(2,8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  return `${productId}-${ts}-${rand}`;
}

/* ---------- Generate PDF License ---------- */
function generateLicensePDF(license, order) {
  const doc = new jsPDF();
  
  // Add logo (placeholder - in real implementation, you would load your actual logo)
  doc.setFillColor(40, 40, 40);
  doc.rect(10, 10, 190, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('EgoBrain-Dev', 15, 25);
  doc.setFontSize(10);
  doc.text('Soluções, Licenças & Consultoria', 15, 32);
  
  // License details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('LICENÇA DE SOFTWARE', 105, 50, { align: 'center' });
  
  doc.setFontSize(10);
  let yPosition = 70;
  
  doc.text(`Produto: ${license.product}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Chave da Licença: ${license.key}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Pedido: ${order.id}`, 20, yPosition);
  yPosition += 8;
  
  const startDate = new Date(license.startDate).toLocaleDateString('pt-PT');
  const endDate = new Date(license.endDate).toLocaleDateString('pt-PT');
  doc.text(`Validade: ${startDate} a ${endDate}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Licenciado para: ${license.customer}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Email: ${license.email}`, 20, yPosition);
  yPosition += 8;
  
  if (order.buyer.org) {
    doc.text(`Empresa: ${order.buyer.org}`, 20, yPosition);
    yPosition += 8;
  }
  
  if (order.buyer.description) {
    doc.text(`Descrição: ${order.buyer.description}`, 20, yPosition);
    yPosition += 8;
  }
  
  // Contact information
  yPosition += 10;
  doc.text('Contactos da EgoBrain-Dev:', 20, yPosition);
  yPosition += 8;
  doc.text('Email: egobrain.mz@gmail.com', 20, yPosition);
  yPosition += 8;
  doc.text('WhatsApp: +258 84 361 7130', 20, yPosition);
  yPosition += 8;
  doc.text('Telefone: +258 87 861 7130', 20, yPosition);
  
  // Terms and conditions
  yPosition += 15;
  doc.setFontSize(8);
  doc.text('Termos e Condições: Esta licença está sujeita aos termos do EULA do produto. A redistribuição ou', 20, yPosition);
  yPosition += 4;
  doc.text('revenda não é permitida sem autorização prévia. O suporte técnico está incluído conforme especificado', 20, yPosition);
  yPosition += 4;
  doc.text('no contrato de licença. A EgoBrain-Dev reserva-se o direito de revogar licenças em caso de violação.', 20, yPosition);
  
  // Save the PDF
  doc.save(`${license.product.replace(/\s+/g,'_')}_LICENCA_${license.key}.pdf`);
}

/* ---------- Contact form ---------- */
function handleContact(e){
  e.preventDefault();
  const name = document.getElementById('cname').value.trim();
  const email = document.getElementById('cemail').value.trim();
  const msg = document.getElementById('cmsg').value.trim();
  if(!name||!email||!msg) return alert('Preencha todos os campos.');
  showToast('Mensagem enviada (simulação). A nossa equipa vai responder por email.');
  document.getElementById('contactForm').reset();
}

/* ---------- Toast (notificações simples) ---------- */
function showToast(msg){
  const t = document.createElement('div'); 
  t.style.position='fixed'; 
  t.style.right='18px'; 
  t.style.bottom='18px'; 
  t.style.background='linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 70%, black))'; 
  t.style.color='#02121b'; 
  t.style.padding='10px 14px'; 
  t.style.borderRadius='12px'; 
  t.style.boxShadow='0 10px 30px color-mix(in srgb, var(--accent) 20%, transparent)'; 
  t.style.zIndex=9999; 
  t.style.fontWeight=700; 
  t.style.opacity=0;
  t.style.transition='opacity 0.3s ease';
  t.textContent=msg;
  document.body.appendChild(t); 
  
  // Animate in
  setTimeout(() => t.style.opacity = 1, 10);
  
  setTimeout(() => {
    t.style.opacity = 0;
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

/* ---------- Newsletter demo ---------- */
function subscribeDemo(){ 
  showToast('Obrigado! Inscrito na newsletter (simulação).'); 
}

/* ---------- Dashboard Functions ---------- */
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab and set active
  document.getElementById(`tab-${tabName}`).style.display = 'block';
  event.target.classList.add('active');
  CURRENT_TAB = tabName;
  
  // Refresh tab content
  refreshTabContent(tabName);
}

function refreshTabContent(tabName) {
  switch(tabName) {
    case 'orders':
      loadOrdersTable();
      break;
    case 'customers':
      loadCustomersTable();
      break;
    case 'products':
      loadProductsTable();
      break;
    case 'licenses':
      loadLicensesTable();
      break;
    case 'reports':
      loadReports();
      break;
  }
}

function loadOrdersTable() {
  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '';
  
  if (ORDERS.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Nenhum pedido encontrado</td></tr>';
    return;
  }
  
  ORDERS.slice().reverse().forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${order.id}</td>
      <td>${order.buyer.name}<br><small>${order.buyer.email}</small></td>
      <td>${order.items.map(item => item.name).join(', ')}</td>
      <td>${currency(order.total)}</td>
      <td>${new Date(order.date).toLocaleDateString('pt-PT')}</td>
      <td>
        <button class="btn ghost small" onclick="viewOrder('${order.id}')">Ver</button>
        <button class="btn primary small" onclick="exportOrderPDF('${order.id}')">PDF</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadCustomersTable() {
  const tbody = document.getElementById('customersTable');
  tbody.innerHTML = '';
  
  // Extract unique customers from orders
  const customers = {};
  ORDERS.forEach(order => {
    const email = order.buyer.email;
    if (!customers[email]) {
      customers[email] = {
        name: order.buyer.name,
        email: email,
        orders: 0,
        total: 0,
        lastOrder: order.date
      };
    }
    customers[email].orders++;
    customers[email].total += order.total;
    if (new Date(order.date) > new Date(customers[email].lastOrder)) {
      customers[email].lastOrder = order.date;
    }
  });
  
  const customerList = Object.values(customers);
  if (customerList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Nenhum cliente encontrado</td></tr>';
    return;
  }
  
  customerList.sort((a, b) => b.total - a.total).forEach(customer => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.email}</td>
      <td>${customer.orders}</td>
      <td>${currency(customer.total)}</td>
      <td>${new Date(customer.lastOrder).toLocaleDateString('pt-PT')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function loadProductsTable() {
  const tbody = document.getElementById('productsTable');
  tbody.innerHTML = '';
  
  PRODUCTS.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${currency(product.price)}</td>
      <td>${product.type === 'annual' ? 'Anual' : product.type === 'perpetual' ? 'Perpétua' : 'Personalizada'}</td>
      <td>${product.sales || 0}</td>
      <td>
        <button class="btn ghost small" onclick="editProduct('${product.id}')">Editar</button>
        <button class="btn error small" onclick="deleteProduct('${product.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadLicensesTable() {
  const tbody = document.getElementById('licensesTable');
  tbody.innerHTML = '';
  
  // Collect all licenses from all orders
  const allLicenses = [];
  ORDERS.forEach(order => {
    order.licenses.forEach(license => {
      allLicenses.push({
        ...license,
        orderId: order.id,
        orderDate: order.date
      });
    });
  });
  
  if (allLicenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Nenhuma licença encontrada</td></tr>';
    return;
  }
  
  allLicenses.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).forEach(license => {
    const isExpired = new Date(license.endDate) < new Date();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><small>${license.key}</small></td>
      <td>${license.product}</td>
      <td>${license.customer}<br><small>${license.email}</small></td>
      <td>${new Date(license.endDate).toLocaleDateString('pt-PT')}</td>
      <td><span class="badge" style="background:${isExpired ? 'var(--error)' : 'var(--success)'}">${isExpired ? 'Expirada' : 'Ativa'}</span></td>
      <td>
        <button class="btn ghost small" onclick="viewLicense('${license.key}')">Ver</button>
        <button class="btn primary small" onclick="renewLicense('${license.key}')">Renovar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadReports() {
  updateDashboardStats();
  generateSalesChart();
  generateProductsChart();
}

function updateDashboardStats() {
  const totalSales = ORDERS.reduce((sum, order) => sum + order.total, 0);
  const totalLicenses = ORDERS.reduce((sum, order) => sum + order.licenses.length, 0);
  const avgTicket = ORDERS.length > 0 ? totalSales / ORDERS.length : 0;
  const uniqueCustomers = new Set(ORDERS.map(order => order.buyer.email)).size;
  
  document.getElementById('totalSales').textContent = currency(totalSales);
  document.getElementById('totalLicenses').textContent = totalLicenses;
  document.getElementById('avgTicket').textContent = currency(avgTicket);
  document.getElementById('totalCustomers').textContent = uniqueCustomers;
}

function generateSalesChart() {
  const chart = document.getElementById('salesChart');
  chart.innerHTML = '';
  
  // Last 6 months sales
  const months = [];
  const sales = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toLocaleDateString('pt-PT', { month: 'short' }));
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthSales = ORDERS.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= monthStart && orderDate <= monthEnd;
    }).reduce((sum, order) => sum + order.total, 0);
    
    sales.push(monthSales);
  }
  
  const maxSales = Math.max(...sales, 1); // Avoid division by zero
  
  months.forEach((month, i) => {
    const barHeight = (sales[i] / maxSales) * 100;
    const bar = document.createElement('div');
    bar.style.display = 'flex';
    bar.style.flexDirection = 'column';
    bar.style.alignItems = 'center';
    bar.style.gap = '4px';
    
    bar.innerHTML = `
      <div style="height:${barHeight}px; width:30px; background:var(--accent); border-radius:4px;"></div>
      <div class="small muted">${month}</div>
      <div class="small" style="font-weight:600">${currency(sales[i])}</div>
    `;
    
    chart.appendChild(bar);
  });
}

function generateProductsChart() {
  const chart = document.getElementById('productsChart');
  chart.innerHTML = '';
  
  const productSales = {};
  PRODUCTS.forEach(product => {
    productSales[product.name] = product.sales || 0;
  });
  
  const maxSales = Math.max(...Object.values(productSales), 1);
  
  Object.entries(productSales).forEach(([name, sales]) => {
    const barWidth = (sales / maxSales) * 100;
    const item = document.createElement('div');
    item.style.marginBottom = '8px';
    
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <div class="small">${name}</div>
        <div class="small" style="font-weight:600">${sales}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${barWidth}%"></div>
      </div>
    `;
    
    chart.appendChild(item);
  });
}

function showProductModal() {
  document.getElementById('productModal').style.display = 'flex';
  // Reset form
  document.getElementById('editProductId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productId').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productType').value = 'annual';
  document.getElementById('productDesc').value = '';
  document.getElementById('productFeatures').value = '';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

function saveProduct(e) {
  e.preventDefault();
  
  const id = document.getElementById('editProductId').value;
  const name = document.getElementById('productName').value;
  const productId = document.getElementById('productId').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const type = document.getElementById('productType').value;
  const desc = document.getElementById('productDesc').value;
  const features = document.getElementById('productFeatures').value.split(',').map(f => f.trim());
  
  if (id) {
    // Edit existing product
    const index = PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) {
      PRODUCTS[index] = {
        ...PRODUCTS[index],
        name,
        id: productId,
        price,
        type,
        desc,
        features
      };
    }
  } else {
    // Add new product
    PRODUCTS.push({
      id: productId,
      name,
      price,
      type,
      desc,
      features,
      sales: 0
    });
  }
  
  saveProducts();
  loadProductsTable();
  renderProducts();
  closeProductModal();
  showToast('Produto salvo com sucesso!');
}

function editProduct(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  document.getElementById('editProductId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productId').value = product.id;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productType').value = product.type;
  document.getElementById('productDesc').value = product.desc;
  document.getElementById('productFeatures').value = product.features.join(', ');
  
  document.getElementById('productModal').style.display = 'flex';
}

function deleteProduct(productId) {
  if (!confirm('Tem certeza que deseja eliminar este produto?')) return;
  
  PRODUCTS = PRODUCTS.filter(p => p.id !== productId);
  saveProducts();
  loadProductsTable();
  renderProducts();
  showToast('Produto eliminado!');
}

function generateLicenseManual() {
  document.getElementById('licenseModal').style.display = 'flex';
  
  // Populate product options
  const select = document.getElementById('manualProductId');
  select.innerHTML = '';
  PRODUCTS.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    select.appendChild(option);
  });
}

function closeLicenseModal() {
  document.getElementById('licenseModal').style.display = 'none';
}

function generateManualLicense(e) {
  e.preventDefault();
  
  const productId = document.getElementById('manualProductId').value;
  const customer = document.getElementById('manualCustomer').value;
  const email = document.getElementById('manualEmail').value;
  const validity = parseInt(document.getElementById('manualValidity').value);
  
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + validity);
  
  const license = {
    product: product.name,
    productId: product.id,
    key: generateKey(product.id),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    customer,
    email,
    description: 'Licença gerada manualmente'
  };
  
  // Create a mock order for this manual license
  const order = {
    id: 'MAN-' + Date.now().toString(36).toUpperCase(),
    buyer: { name: customer, email, org: '', description: 'Licença manual' },
    items: [{ id: product.id, name: product.name, price: product.price }],
    total: product.price,
    licenses: [license],
    date: new Date().toISOString(),
    status: 'manual'
  };
  
  ORDERS.push(order);
  saveOrders();
  
  // Generate PDF
  generateLicensePDF(license, order);
  
  closeLicenseModal();
  showToast('Licença gerada manualmente!');
  loadLicensesTable();
}

function exportOrders() {
  // Simple CSV export
  let csv = 'ID,Cliente,Email,Produtos,Total,Data\n';
  
  ORDERS.forEach(order => {
    const products = order.items.map(item => item.name).join('; ');
    csv += `"${order.id}","${order.buyer.name}","${order.buyer.email}","${products}",${order.total},"${new Date(order.date).toLocaleDateString('pt-PT')}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_egobrain_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  
  showToast('Dados exportados para CSV!');
}

function viewOrder(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;
  
  const products = order.items.map(item => `${item.name} (${currency(item.price)})`).join('\n');
  const licenses = order.licenses.map(license => license.key).join('\n');
  
  alert(`Pedido: ${order.id}\nCliente: ${order.buyer.name} (${order.buyer.email})\nProdutos:\n${products}\nTotal: ${currency(order.total)}\nLicenças:\n${licenses}`);
}

function exportOrderPDF(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;
  
  // For simplicity, we'll just generate a license PDF for the first license in the order
  if (order.licenses.length > 0) {
    generateLicensePDF(order.licenses[0], order);
  } else {
    alert('Nenhuma licença encontrada para este pedido.');
  }
}

function viewLicense(licenseKey) {
  // Find license
  let license = null;
  let order = null;
  
  for (const o of ORDERS) {
    license = o.licenses.find(l => l.key === licenseKey);
    if (license) {
      order = o;
      break;
    }
  }
  
  if (!license) return;
  
  const startDate = new Date(license.startDate).toLocaleDateString('pt-PT');
  const endDate = new Date(license.endDate).toLocaleDateString('pt-PT');
  const isExpired = new Date(license.endDate) < new Date();
  
  alert(`Licença: ${license.key}\nProduto: ${license.product}\nCliente: ${license.customer} (${license.email})\nValidade: ${startDate} a ${endDate}\nStatus: ${isExpired ? 'Expirada' : 'Ativa'}\nDescrição: ${license.description || 'Nenhuma'}`);
}

function renewLicense(licenseKey) {
  if (!confirm('Renovar esta licença por mais 1 ano?')) return;
  
  // Find and update license
  for (const order of ORDERS) {
    const license = order.licenses.find(l => l.key === licenseKey);
    if (license) {
      const newEndDate = new Date();
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      license.endDate = newEndDate.toISOString();
      license.status = 'active';
      break;
    }
  }
  
  saveOrders();
  loadLicensesTable();
  showToast('Licença renovada por mais 1 ano!');
}

/* ---------- Admin panel ---------- */
document.getElementById('admin-link').addEventListener('click', (ev)=>{
  ev.preventDefault(); 
  document.getElementById('adminModal').style.display='flex';
});

function closeAdmin(){ 
  document.getElementById('adminModal').style.display='none'; 
  document.getElementById('adminPass').value=''; 
  document.getElementById('ordersList').innerHTML=''; 
}

function openAdmin(){
  const pass = document.getElementById('adminPass').value;
  // Simple password for prototype
  if(pass !== 'admin123'){ 
    alert('Senha incorreta.'); 
    return; 
  }
  
  ADMIN_LOGGED_IN = true;
  document.getElementById('admin-link').style.display = 'none';
  document.getElementById('dashboard-link').style.display = 'block';
  
  // Show dashboard and hide main content
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  
  closeAdmin();
  loadDashboard();
}

function logoutAdmin() {
  ADMIN_LOGGED_IN = false;
  document.getElementById('admin-link').style.display = 'block';
  document.getElementById('dashboard-link').style.display = 'none';
  
  // Hide dashboard and show main content
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
}

function loadDashboard() {
  updateDashboardStats();
  loadOrdersTable();
}

// Dashboard link click handler
document.getElementById('dashboard-link').addEventListener('click', (ev) => {
  ev.preventDefault();
  if (ADMIN_LOGGED_IN) {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    loadDashboard();
  } else {
    document.getElementById('adminModal').style.display = 'flex';
  }
});

/* ---------- Persistência & Inicialização ---------- */
function init(){
  initTheme();
  renderProducts();
  updateCartUI();
  updateWishlistUI();
  updateGamificationUI();
  
  // mobile menu toggle
  document.getElementById('hamb').addEventListener('click', ()=>{ 
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('active');
  });
  
  // close panels on click outside
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.cart-box') && !e.target.closest('#cartBtn')) {
      document.getElementById('cartPanel').style.display='none';
    }
    if(!e.target.closest('.cart-box') && !e.target.closest('#wishlistBtn')) {
      document.getElementById('wishlistPanel').style.display='none';
    }
  });
}

// Initialize everything when page loads
window.addEventListener('DOMContentLoaded', init);