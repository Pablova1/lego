'use strict';

/* --------------------------------------
   Variables et sélecteurs
   -------------------------------------- */
// Tableau complet de tous les deals
let allDeals = [];

// Tableau filtré + trié (avant pagination)
let currentFilteredDeals = [];

// Page courante et taille de page sélectionnée
let currentPage = 1;
let currentPageSize = 6;

// Valeur de la recherche par ID (initialement vide)
let searchIdValue = '';

// Sélecteurs de l'interface
const dealList = document.querySelector('#deal-list');

/* Filtres (checkbox) */
const discountCheckbox = document.querySelector('#filter-discount');
const mostCommentedCheckbox = document.querySelector('#filter-most-commented');
const hotCheckbox = document.querySelector('#filter-hot');
const favoritesCheckbox = document.querySelector('#filter-favorites');

/* Barre de recherche ID */
const searchIdInput = document.querySelector('#search-id');

/* Options */
const selectShow = document.querySelector('#show-select');
const selectSort = document.querySelector('#sort-select');

/* Boutons de pagination */
const prevBtnTop = document.querySelector('#prev-btn-top');
const nextBtnTop = document.querySelector('#next-btn-top');
const prevBtnBottom = document.querySelector('#prev-btn-bottom');
const nextBtnBottom = document.querySelector('#next-btn-bottom');

/* Modal */
const modalOverlay = document.querySelector('#modal-overlay');
const modalMainContent = document.querySelector('#modal-main-content');

/* --------------------------------------
   Fonctions pour récupérer les deals
   -------------------------------------- */

/**
 * Récupère TOUS les deals en un seul appel (limit=9999) depuis l'API Dealabs déployée sur Vercel.
 */
async function fetchAllDeals() {
  try {
    const response = await fetch('https://lego-p4828pkiu-pablova1s-projects.vercel.app/api/deals/search?limit=9999');
    const body = await response.json();
    if (!body.results) {
      return [];
    }
    return body.results;
  } catch (err) {
    console.error('Erreur lors du fetch all deals', err);
    return [];
  }
}

/* --------------------------------------
   Filtrage et Tri
   -------------------------------------- */

/**
 * Applique les filtres (checkbox + recherche id) et le tri
 * sur la liste complète allDeals. Stocke le résultat dans currentFilteredDeals.
 */
function applyFiltersAndSort() {
  let filtered = [...allDeals];

  // 1) Recherche par ID
  if (searchIdValue.trim() !== '') {
    const lowerSearch = searchIdValue.trim().toLowerCase();
    filtered = filtered.filter(d => String(d.id).toLowerCase().includes(lowerSearch));
  }

  // 2) Filtres checkbox
  if (discountCheckbox.checked) {
    filtered = filtered.filter(d => d.discount >= 50);
  }
  if (mostCommentedCheckbox.checked) {
    filtered = filtered.filter(d => d.comments > 15);
  }
  if (hotCheckbox.checked) {
    filtered = filtered.filter(d => d.temperature > 100);
  }
  if (favoritesCheckbox.checked) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favIds = favorites.map(f => f.uuid);
    filtered = filtered.filter(d => favIds.includes(d.uuid));
  }

  // 3) Tri
  switch (selectSort.value) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'date-asc':
      filtered.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc':
      filtered.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;
    default:
      break;
  }

  currentFilteredDeals = filtered;
}

/**
 * Récupère le sous-tableau correspondant à la page courante, selon currentPageSize
 */
function getCurrentPageDeals() {
  const startIndex = (currentPage - 1) * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  return currentFilteredDeals.slice(startIndex, endIndex);
}

/**
 * Nombre total de pages (arrondi supérieur)
 */
function getPageCount() {
  return Math.ceil(currentFilteredDeals.length / currentPageSize);
}

/* --------------------------------------
   Rendu HTML
   -------------------------------------- */

/**
 * Affiche la liste des deals fournie
 */
function renderDeals(deals) {
  dealList.innerHTML = '';

  if (deals.length === 0) {
    dealList.innerHTML = '<p>Aucun deal à afficher.</p>';
    return;
  }

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const avenuedelabriqueDomain = 'https://www.avenuedelabrique.com';

  deals.forEach(deal => {
    const card = document.createElement('div');
    card.className = 'deal-card';

    // Photo
    let imageUrl = deal.image || 'https://via.placeholder.com/300x200?text=No+Image';
    if (imageUrl.startsWith('/')) {
      imageUrl = avenuedelabriqueDomain + imageUrl;
    }
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'deal-image';
    card.appendChild(img);

    // Titre
    const title = document.createElement('div');
    title.className = 'deal-title';
    title.textContent = deal.title || `Lego #${deal.id}`;
    card.appendChild(title);

    // Prix
    const price = document.createElement('div');
    price.className = 'deal-price';
    price.textContent = `${deal.price} €`;
    card.appendChild(price);

    // Bouton favori
    const isFav = favorites.some(f => f.uuid === deal.uuid);
    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.textContent = isFav ? '❤️' : '🤍';
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(deal);
      renderDeals(getCurrentPageDeals());
    });
    card.appendChild(favBtn);

    // Clic => ouvre le modal
    card.addEventListener('click', () => {
      openModal(deal);
    });

    dealList.appendChild(card);
  });
}

/**
 * Ajoute ou retire un deal des favoris
 */
function toggleFavorite(deal) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const idx = favorites.findIndex(f => f.uuid === deal.uuid);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(deal);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

/**
 * Met à jour l'affichage des boutons "page précédente" et "page suivante"
 */
function updatePaginationButtons() {
  const pageCount = getPageCount();

  if (currentPage > 1) {
    prevBtnTop.style.display = 'inline-block';
    prevBtnBottom.style.display = 'inline-block';
  } else {
    prevBtnTop.style.display = 'none';
    prevBtnBottom.style.display = 'none';
  }

  if (currentPage < pageCount) {
    nextBtnTop.style.display = 'inline-block';
    nextBtnBottom.style.display = 'inline-block';
  } else {
    nextBtnTop.style.display = 'none';
    nextBtnBottom.style.display = 'none';
  }
}

/* --------------------------------------
   Pagination
   -------------------------------------- */
function goToPage(page) {
  currentPage = page;
  renderDeals(getCurrentPageDeals());
  updatePaginationButtons();
}

/* --------------------------------------
   Modal
   -------------------------------------- */
async function openModal(deal) {
  modalMainContent.innerHTML = buildModalContent(deal, []);
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
  modalMainContent.innerHTML = '';
}

/**
 * Construit le HTML de la popup
 */
function buildModalContent(deal, sales) {
  return `
    <div class="modal-flex-container">
      <div class="modal-info">
        <h1 class="modal-deal-title">${deal.title || 'Lego #' + deal.id}</h1>
        <p style="margin-bottom:0.4rem;">Prix: <strong>${deal.price} €</strong></p>
        <p style="margin-bottom:0.4rem;">ID lego: <strong>${deal.id}</strong></p>
        <p style="margin-bottom:0.4rem;">Discount: <strong>${deal.discount || 0}%</strong></p>
        <p><a href="${deal.url}" target="_blank" style="color:#00ffb3;">Aller sur la page de l'offre</a></p>
      </div>

      <div class="modal-image-block">
        <img src="${deal.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="Photo du produit">
      </div>
    </div>
  `;
}

/* --------------------------------------
   Initialisation
   -------------------------------------- */
function refreshDeals() {
  applyFiltersAndSort();
  goToPage(1);
}

function initEventListeners() {
  prevBtnTop.addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });
  nextBtnTop.addEventListener('click', () => {
    if (currentPage < getPageCount()) goToPage(currentPage + 1);
  });
  prevBtnBottom.addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });
  nextBtnBottom.addEventListener('click', () => {
    if (currentPage < getPageCount()) goToPage(currentPage + 1);
  });

  discountCheckbox.addEventListener('change', refreshDeals);
  mostCommentedCheckbox.addEventListener('change', refreshDeals);
  hotCheckbox.addEventListener('change', refreshDeals);
  favoritesCheckbox.addEventListener('change', refreshDeals);

  selectSort.addEventListener('change', refreshDeals);

  selectShow.addEventListener('change', () => {
    currentPageSize = parseInt(selectShow.value);
    goToPage(1);
  });

  searchIdInput.addEventListener('input', () => {
    searchIdValue = searchIdInput.value;
    refreshDeals();
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

async function main() {
  allDeals = await fetchAllDeals();
  applyFiltersAndSort();
  goToPage(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  initEventListeners();
  await main();
});
