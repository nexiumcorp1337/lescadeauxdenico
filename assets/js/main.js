const PRODUCTS_URL = 'data/products.json';
const PRODUCTS_PER_PAGE = 8;

// Utils
function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

// Fetch products
async function fetchProducts() {
  try {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error('Impossible de charger products.json');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Render catalogue page
async function renderCatalogue() {
  const container = document.getElementById('product-grid');
  const filterContainer = document.getElementById('filter-container');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (!container || !filterContainer || !paginationContainer) return;
  
  const products = await fetchProducts();
  if (products.length === 0) {
    container.innerHTML = '<p>Aucun produit trouvé.</p>';
    return;
  }

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category))];
  filterContainer.innerHTML = categories.map(cat =>
    `<button class="btn btn-outline-primary me-2 mb-2 filter-btn" data-category="${cat}">${cat}</button>`
  ).join('') + `<button class="btn btn-outline-secondary mb-2 filter-btn" data-category="all">Tous</button>`;

  // Pagination state
  let currentPage = 1;
  let filteredProducts = [...products];

  function renderPage() {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const pageItems = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
    
    container.innerHTML = pageItems.map(p => `
      <div class="col">
        <div class="card h-100 shadow-sm" data-product-slug="${p.slug}">
          <img src="${p.images[0]}" class="card-img-top" alt="${p.title}">
          <div class="card-body">
            <h5 class="card-title">${p.title}</h5>
            <p class="card-text">${p.shortDescription}</p>
            <a href="product.html?slug=${p.slug}" class="btn btn-primary">Voir le produit</a>
          </div>
        </div>
      </div>
    `).join('');

    // Render pagination
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    paginationContainer.innerHTML = `
      <nav>
        <ul class="pagination justify-content-center">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link prev">Précédent</button>
          </li>
          ${[...Array(totalPages)].map((_, i) => `
            <li class="page-item ${currentPage === i+1 ? 'active' : ''}">
              <button class="page-link page-btn">${i+1}</button>
            </li>`).join('')}
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link next">Suivant</button>
          </li>
        </ul>
      </nav>
    `;

    // Pagination events
    paginationContainer.querySelectorAll('.page-btn').forEach((btn, i) => {
      btn.onclick = () => { currentPage = i + 1; renderPage(); };
    });
    paginationContainer.querySelector('.prev')?.addEventListener('click', () => { 
      if(currentPage > 1) { currentPage--; renderPage(); } 
    });
    paginationContainer.querySelector('.next')?.addEventListener('click', () => { 
      if(currentPage < totalPages) { currentPage++; renderPage(); } 
    });

    // Ajouter les event listeners pour les cards du catalogue
    attachCardClickListeners();
  }

  // Filter events
  filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category;
      filteredProducts = cat === 'all' ? [...products] : products.filter(p => p.category === cat);
      currentPage = 1;
      renderPage();
    });
  });

  renderPage();
}

// Fonction pour attacher les event listeners de clic sur les cards
function attachCardClickListeners() {
  const productCards = document.querySelectorAll('.card[data-product-slug]');
  
  productCards.forEach(card => {
    // Supprimer les anciens listeners pour éviter les doublons
    card.replaceWith(card.cloneNode(true));
    const newCard = card.nextSibling;
    
    newCard.addEventListener('click', function(e) {
      // Empêche le clic si c'est un lien ou bouton
      if (e.target.closest('a') || e.target.closest('.btn')) {
        return;
      }
      
      const slug = this.dataset.productSlug;
      if (slug) {
        window.location.href = `product.html?slug=${slug}`;
      }
    });

    // Effet visuel au clic (scale)
    newCard.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.98)';
      this.style.transition = 'transform 0.1s ease';
    });
    
    newCard.addEventListener('mouseup', function() {
      this.style.transform = '';
    });
    
    // Réinitialiser après un court délai
    newCard.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
}

// Render product page
async function renderProduct() {
  const container = document.getElementById('product-container');
  if (!container) return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  
  if (!slug) { 
    container.innerHTML = '<p>Produit introuvable.</p>'; 
    return; 
  }
  
  const products = await fetchProducts();
  const product = products.find(p => p.slug === slug);
  
  if (!product) { 
    container.innerHTML = '<p>Produit introuvable.</p>'; 
    return; 
  }
  
  container.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <div id="carousel-${product.slug}" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            ${product.images.map((img, i) => `
              <div class="carousel-item ${i===0?'active':''}">
                <img src="${img}" class="d-block w-100" alt="${product.title}">
              </div>
            `).join('')}
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${product.slug}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Précédent</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#carousel-${product.slug}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Suivant</span>
          </button>
        </div>
      </div>
      <div class="col-md-6">
        <h2>${product.title}</h2>
        <p>${product.description}</p>
        <ul>
          <li><strong>Matériaux :</strong> ${product.materials.join(', ')}</li>
          <li><strong>Dimensions :</strong> ${product.dimensions}</li>
          <li><strong>Options de personnalisation :</strong> ${product.customizationOptions.join(', ')}</li>
        </ul>
        <p><strong>Prix :</strong> ${product.price}€</p>
        <a href="mailto:contact@lescadeauxdenico.com?subject=Personnalisation%20${encodeURIComponent(product.title)}" class="btn btn-success">Me contacter pour personnaliser</a>
      </div>
    </div>
  `;
}

// Affiche les best-sellers sur la page d'accueil - MODIFIÉ
async function renderHome() {
  const container = document.getElementById('home-products');
  if (!container) return;
  
  const products = await fetchProducts();
  if (!products.length) {
    container.innerHTML = '<p>Aucun produit à afficher.</p>';
    return;
  }

  // Filtrer les best-sellers
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 6); // Augmenté à 6 pour plus de visibilité
  
  if (bestsellers.length === 0) {
    // Fallback : prendre les 6 premiers produits
    bestsellers = products.slice(0, 6);
  }
  
  container.innerHTML = bestsellers.map(p => `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100" data-product-slug="${p.slug}">
        <img src="${p.images[0]}" class="card-img-top" alt="${p.title}">
        ${p.isNew ? '<span class="badge badge-new">Nouveau</span>' : ''}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.title}</h5>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <span class="price">${p.price}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Attacher les event listeners après rendu
  setTimeout(() => {
    attachCardClickListeners();
  }, 100);
}

// Détection de page et rendu approprié
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-grid')) {
    renderCatalogue();
  } else if (document.getElementById('product-container')) {
    renderProduct();
  } else if (document.getElementById('home-products')) {
    renderHome();
  }
  
  // Attacher les listeners pour les best-sellers existants
  attachCardClickListeners();
});

// Bouton retour en haut
window.addEventListener('scroll', () => {
  const backToTop = document.getElementById('back-to-top');
  if (window.scrollY > 300) {
    backToTop?.classList.add('show');
  } else {
    backToTop?.classList.remove('show');
  }
});