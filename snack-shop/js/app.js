// ===== 零食铺子 - 主逻辑 =====

// 商品数据
const PRODUCTS = [
  { id: 1, name: '薯片', emoji: '🍟', price: 9.9, stock: 100, category: '膨化', desc: '酥脆可口的经典零食' },
  { id: 2, name: '饼干', emoji: '🍪', price: 12.8, stock: 80, category: '烘焙', desc: '香浓奶香，午后搭档' },
  { id: 3, name: '巧克力', emoji: '🍫', price: 25.0, stock: 60, category: '糖果', desc: '丝滑浓郁，甜蜜诱惑' },
  { id: 4, name: '坚果', emoji: '🥜', price: 35.0, stock: 50, category: '坚果', desc: '健康营养，香脆美味' },
  { id: 5, name: '肉干', emoji: '🍖', price: 42.0, stock: 40, category: '肉干', desc: '嚼劲十足，越嚼越香' },
  { id: 6, name: '奶茶', emoji: '🧋', price: 18.0, stock: 70, category: '饮品', desc: '香甜丝滑，治愈时光' },
  { id: 7, name: '冰淇淋', emoji: '🍦', price: 15.0, stock: 45, category: '冷饮', desc: '冰凉甜蜜，夏日必备' },
  { id: 8, name: '咖啡', emoji: '☕', price: 22.0, stock: 55, category: '饮品', desc: '提神醒脑，香醇浓郁' },
  { id: 9, name: '水果干', emoji: '🍎', price: 28.0, stock: 65, category: '果干', desc: '天然晾晒，酸甜可口' }
];

// 状态管理
let cart = [];
let filteredProducts = [...PRODUCTS];
let currentCategory = '全部';

// DOM 元素
const productsGrid = document.getElementById('productsGrid');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartBadge = document.getElementById('cartBadge');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const orderSuccess = document.getElementById('orderSuccess');
const searchInput = document.getElementById('searchInput');

// ===== 初始化 =====
function init() {
  loadCart();
  loadStock();
  renderProducts();
  bindEvents();
}

// ===== 事件绑定 =====
function bindEvents() {
  // 搜索
  searchInput.addEventListener('input', handleSearch);
  
  // 分类按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => handleFilter(btn.dataset.category));
  });
  
  // 购物车按钮
  document.getElementById('openCartBtn').addEventListener('click', openCart);
  document.getElementById('closeCartBtn').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  
  // 结算按钮
  checkoutBtn.addEventListener('click', showCheckoutForm);
  document.getElementById('backToCartBtn').addEventListener('click', hideCheckoutForm);
  document.getElementById('submitOrderBtn').addEventListener('click', submitOrder);
}

// ===== 渲染商品 =====
function renderProducts() {
  productsGrid.innerHTML = filteredProducts.map((p, i) => `
    <div class="product-card" style="animation-delay: ${i * 0.05}s">
      <div class="product-image">${p.emoji}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-bottom">
          <div>
            <div class="product-price">¥${p.price.toFixed(1)}</div>
            <div class="stock-info">库存: ${p.stock}件</div>
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== 加入购物车 =====
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  // 验证库存
  if (product.stock <= 0) {
    alert('抱歉，库存不足！');
    return false;
  }
  
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    // 检查现有数量是否还能增加
    if (existingItem.qty >= product.stock) {
      alert(`库存不足！当前最多只能购买 ${product.stock} 件`);
      return false;
    }
    existingItem.qty++;
  } else {
    cart.push({ id: product.id, qty: 1 });
  }
  
  saveCart();
  updateCartBadge();
  showToast(`${product.name} 已加入购物车 🛒`);
  return true;
}

// ===== 更新购物车badge =====
function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = total;
  cartBadge.style.display = total > 0 ? 'inline' : 'none';
}

// ===== 更新购物车列表 =====
function updateCartItems() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>购物车是空的</p>
        <p style="font-size:0.9rem;margin-top:10px;">快去挑选心仪的零食吧~</p>
      </div>
    `;
    checkoutBtn.disabled = true;
  } else {
    cartItemsContainer.innerHTML = cart.map(item => {
      const p = PRODUCTS.find(prod => prod.id === item.id);
      return `
        <div class="cart-item">
          <div class="cart-item-icon">${p.emoji}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">¥${p.price.toFixed(1)}</div>
            <div class="quantity-controls">
              <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
          </div>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">删除</button>
        </div>
      `;
    }).join('');
    checkoutBtn.disabled = false;
  }
  
  updateCartTotal();
}

// ===== 更新数量 =====
function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  const product = PRODUCTS.find(p => p.id === productId);
  
  // 验证库存
  if (delta > 0 && item.qty >= product.stock) {
    alert(`库存不足！当前最多只能购买 ${product.stock} 件`);
    return;
  }
  
  item.qty += delta;
  
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  
  saveCart();
  updateCartItems();
  updateCartBadge();
}

// ===== 删除商品 =====
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartItems();
  updateCartBadge();
}

// ===== 更新总价 =====
function updateCartTotal() {
  const total = cart.reduce((sum, item) => {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    return sum + (p.price * item.qty);
  }, 0);
  cartTotalPrice.textContent = '¥' + total.toFixed(2);
}

// ===== 打开购物车 =====
function openCart() {
  updateCartItems();
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ===== 关闭购物车 =====
function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== 显示结算表单 =====
function showCheckoutForm() {
  cartDrawer.classList.remove('active');
  document.getElementById('cartView').style.display = 'none';
  checkoutForm.classList.add('active');
}

// ===== 隐藏结算表单 =====
function hideCheckoutForm() {
  checkoutForm.classList.remove('active');
  document.getElementById('cartView').style.display = '';
  cartDrawer.classList.add('active');
}

// ===== 提交订单 =====
function submitOrder() {
  const name = document.getElementById('buyerName').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();
  const address = document.getElementById('buyerAddress').value.trim();
  
  // 验证表单
  if (!name) {
    alert('请输入收货人姓名');
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    alert('请输入正确的手机号');
    return;
  }
  if (!address) {
    alert('请输入收货地址');
    return;
  }
  
  // 二次库存验证
  for (const item of cart) {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    if (item.qty > p.stock) {
      alert(`【${p.name}】库存不足！当前库存: ${p.stock} 件`);
      return;
    }
  }
  
  // 扣减库存
  for (const item of cart) {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    p.stock -= item.qty;
  }
  saveStock();
  
  // 清空购物车
  cart = [];
  saveCart();
  
  // 生成订单号
  const orderId = 'SN' + Date.now().toString(36).toUpperCase();
  
  // 显示成功页
  document.getElementById('orderIdValue').textContent = orderId;
  checkoutForm.classList.remove('active');
  orderSuccess.classList.add('active');
  
  updateCartBadge();
  
  // 3秒后返回购物车
  setTimeout(() => {
    orderSuccess.classList.remove('active');
    document.getElementById('cartView').style.display = '';
    closeCart();
  }, 3000);
}

// ===== 搜索 =====
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase();
  filterProducts(keyword, currentCategory);
}

// ===== 筛选分类 =====
function handleFilter(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  currentCategory = category;
  filterProducts(searchInput.value.toLowerCase(), category);
}

function filterProducts(keyword, category) {
  filteredProducts = PRODUCTS.filter(p => {
    const matchKeyword = p.name.toLowerCase().includes(keyword) || 
                          p.desc.toLowerCase().includes(keyword);
    const matchCategory = category === '全部' || p.category === category;
    return matchKeyword && matchCategory;
  });
  renderProducts();
}

// ===== Toast提示 =====
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 0.95rem;
    z-index: 9999;
    animation: toastFade 2s ease forwards;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ===== 本地存储 =====
function saveCart() {
  try {
    localStorage.setItem('snackCart', JSON.stringify(cart));
  } catch (e) {
    console.warn('购物车保存失败:', e);
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem('snackCart');
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    cart = [];
  }
  updateCartBadge();
}

function saveStock() {
  try {
    const stockData = {};
    PRODUCTS.forEach(p => stockData[p.id] = p.stock);
    localStorage.setItem('snackStock', JSON.stringify(stockData));
  } catch (e) {
    console.warn('库存保存失败:', e);
  }
}

function loadStock() {
  try {
    const saved = localStorage.getItem('snackStock');
    if (saved) {
      const stockData = JSON.parse(saved);
      Object.keys(stockData).forEach(id => {
        const p = PRODUCTS.find(prod => prod.id === parseInt(id));
        if (p) p.stock = stockData[id];
      });
    }
  } catch (e) {
    // 使用默认库存
  }
}

// ===== 启动 =====
init();

// ===== 全局暴露 =====
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;