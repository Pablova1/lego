'use strict';

/**
 * =============================
 *           GLOBALS
 * =============================
 */

// Tableau qui stocke les deals en cours d'affichage
let currentDeals = [];

// Objet qui contient les informations de pagination renvoyées par l'API
let currentPagination = {};

// Sélecteurs HTML
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetId = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const sectionSales = document.querySelector('#sales');

// Indicateurs de deals
const spanNbDeals = document.querySelector('#nbDeals');

// Indicateurs de ventes
const spanNbSales = document.querySelector('#nbSales');
const spanP5 = document.querySelector('#p5Sales');
const spanP25 = document.querySelector('#p25Sales');
const spanP50 = document.querySelector('#p50Sales');
const spanAvg = document.querySelector('#avgSales');

// Filtres (checkbox)
const discountCheckbox = document.querySelector('#filter-discount');
const mostCommentedCheckbox = document.querySelector('#filter-most-commented');
const hotCheckbox = document.querySelector('#filter-hot');
const favoritesCheckbox = document.querySelector('#filter-favorites');

// Sélecteur pour le tri
const selectSort = document.querySelector('#sort-select');


/**
 * =============================
 *        FETCH FUNCTIONS
 * =============================
 */

/**
 * Récupère les deals depuis l'API, avec pagination.
 * @param {number} [page=1] - Numéro de page à récupérer
 * @param {number} [size=6] - Taille de la page (nombre d'items)
 * @returns {Promise<Object>} Un objet contenant { result, meta }
 */
async function fetchDeals(page = 1, size = 6) {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`);
    const body = await response.json();

    if (body.success !== true) {
      console.error('Error while fetching deals:', body);
      return { result: [], meta: {} };
    }

    return body.data; // { result: [...], meta: {...} }
  } catch (error) {
    console.error('Network or parsing error while fetching deals:', error);
    return { result: [], meta: {} };
  }
}

/**
 * Récupère les ventes (sales) Vinted pour un lego set donné (id).
 * @param {string} legoSetId - Identifiant du set Lego
 * @returns {Promise<Array>} Un tableau de ventes Vinted
 */
async function fetchSales(legoSetId) {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`);
    const body = await response.json();

    if (body.success !== true) {
      console.error('Failed to fetch sales:', body);
      return [];
    }

    // Retourne simplement le tableau des ventes
    return body.data.result;
  } catch (error) {
    console.error('Network or parsing error while fetching sales:', error);
    return [];
  }
}


/**
 * =============================
 *        STATE MANAGEMENT
 * =============================
 */

/**
 * Met à jour les variables globales currentDeals et currentPagination.
 * @param {Object} data - Contient la liste des deals et la meta
 * @property {Array} data.result - Tableau de deals
 * @property {Object} data.meta - Données de pagination (page courante, nombre total de pages, etc.)
 */
function setCurrentDeals({ result, meta }) {
  currentDeals = result;
  currentPagination = meta;
}


/**
 * =============================
 *       RENDER FUNCTIONS
 * =============================
 */

/**
 * Affiche la liste des deals dans la section #deals.
 * @param {Array} deals - Tableau de deals à afficher
 */
function renderDeals(deals) {
  // On nettoie la zone d'affichage
  sectionDeals.innerHTML = '<h2>Deals</h2>';

  // Si pas de deals, on peut afficher un message
  if (deals.length === 0) {
    sectionDeals.innerHTML += '<p>No deals to display.</p>';
    return;
  }

  // Construction HTML
  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  const template = deals.map(deal => {
    const isFav = favorites.some(f => f.uuid === deal.uuid);
    return `
      <div class="deal" id="${deal.uuid}">
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank" rel="noopener noreferrer">${deal.title}</a>
        <span>${deal.price} €</span>
        <button class="favorite-btn" data-id="${deal.uuid}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = template;
  fragment.appendChild(container);
  sectionDeals.appendChild(fragment);

  document.querySelectorAll('.favorite-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const uuid = event.target.dataset.id;
      const deal = deals.find(d => d.uuid === uuid);
      toggleFavorite(deal);
      renderDeals(deals); // Re-render pour mettre à jour les cœurs
    });
  });  
}

function toggleFavorite(deal) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  const index = favorites.findIndex(f => f.uuid === deal.uuid);
  if (index >= 0) {
    favorites.splice(index, 1); // remove
  } else {
    favorites.push(deal); // add
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
}


/**
 * Gère l'affichage du sélecteur de pages (pagination).
 * @param {Object} pagination - Informations de pagination
 * @property {number} pagination.currentPage - Page courante
 * @property {number} pagination.pageCount - Nombre total de pages
 */
function renderPagination({ currentPage, pageCount }) {
  if (!pageCount) {
    selectPage.innerHTML = '';
    return;
  }

  // Construit les options de page (1..pageCount)
  const options = Array.from({ length: pageCount }, (_, index) => {
    return `<option value="${index + 1}">${index + 1}</option>`;
  }).join('');

  selectPage.innerHTML = options;
  selectPage.value = currentPage; // Sélectionne la page courante
}

/**
 * Affiche la liste des identifiants de sets Lego (à partir de la liste de deals).
 * @param {Array} deals - Liste des deals
 */
function renderLegoSetIds(deals) {
  // Récupère la liste d'ID unique
  const ids = getIdsFromDeals(deals);

  // Construit les options
  const options = ids.map(id => `<option value="${id}">${id}</option>`).join('');

  selectLegoSetId.innerHTML = options;
}

/**
 * Affiche les indicateurs liés aux deals (nb de deals).
 * @param {Object} pagination - Données de pagination
 * @property {number} pagination.count - Nombre total de deals dans la page courante
 */
function renderDealIndicators(pagination) {
  // Nombre total de deals sur cette page
  const { count } = pagination;
  spanNbDeals.textContent = count || 0;
}

/**
 * Affiche les ventes Vinted dans la section #sales.
 * @param {Array} sales - Tableau de ventes
 */
function displaySales(sales) {
  // On nettoie la zone
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>';

  if (sales.length === 0) {
    sectionSales.innerHTML += '<p>No sales found for this set.</p>';
    return;
  }

  const template = sales.map(item => `
    <div class="sale">
      <span>Title: ${item.title}</span>
      <span>Price: ${item.price} €</span>
      <a href="${item.link}" target="_blank">See item</a>
    </div>
  `).join('');

  sectionSales.innerHTML += template;
}


/**
 * =============================
 *       FILTER FUNCTIONS
 * =============================
 */

/**
 * Applique les différents filtres (best discount, most commented, hot deals) au tableau de deals actuel.
 * Puis rafraîchit l'affichage en conséquence.
 */
function applyFilters() {
  let filteredDeals = [...currentDeals];

  if (discountCheckbox.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.discount >= 50);
  }

  if (mostCommentedCheckbox.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.commentsCount > 15);
  }

  if (hotCheckbox.checked) {
    filteredDeals = filteredDeals.filter(deal => deal.temperature > 100);
  }

  if (favoritesCheckbox.checked) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favIds = favorites.map(f => f.uuid);
    filteredDeals = filteredDeals.filter(deal => favIds.includes(deal.uuid));
  }

  renderDeals(filteredDeals);
  spanNbDeals.textContent = filteredDeals.length;
}



/**
 * =============================
 *       SORTING FUNCTIONS
 * =============================
 */

/**
 * Applique le tri sur la liste courante de deals (prix ou date).
 * Puis réaffiche la liste triée.
 */
function applySort() {
  const sortValue = selectSort.value;
  // Copie du tableau pour éviter de modifier currentDeals directement
  let sortedDeals = [...currentDeals];

  switch (sortValue) {
    case 'price-asc':
      // Prix croissant
      sortedDeals.sort((a, b) => a.price - b.price);
      break;

    case 'price-desc':
      // Prix décroissant
      sortedDeals.sort((a, b) => b.price - a.price);
      break;

    case 'date-asc':
      // Du plus récent au plus ancien (selon un champ date ou createdAt)
      sortedDeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;

    case 'date-desc':
      // Du plus ancien au plus récent
      sortedDeals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;

    default:
      break;
  }

  // Réaffiche les deals triés
  renderDeals(sortedDeals);
  // Met à jour le compteur de deals affichés
  spanNbDeals.textContent = sortedDeals.length;
}


function saveFavorite(deal) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  // Évite les doublons
  const exists = favorites.some(fav => fav.uuid === deal.uuid);
  if (!exists) {
    favorites.push(deal);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
}


/**
 * =============================
 *       SALES INDICATORS
 * =============================
 */

/**
 * Calcule et affiche les indicateurs sur les prix de revente Vinted:
 *  - Nombre de ventes
 *  - Moyenne (avg)
 *  - Percentiles p5, p25, p50
 */
function computeAndDisplaySalesIndicators(sales) {
  spanNbSales.textContent = sales.length;

  if (sales.length === 0) {
    spanP5.textContent = '0';
    spanP25.textContent = '0';
    spanP50.textContent = '0';
    spanAvg.textContent = '0';
    return;
  }

  // Convertit tous les prix en nombres valides et trie
  const prices = sales
    .map(s => Number(s.price))
    .filter(price => !isNaN(price))
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    console.warn('Aucun prix valide');
    return;
  }

  const avgPrice = prices.reduce((acc, val) => acc + val, 0) / prices.length;

  const p5Index = Math.floor(prices.length * 0.05);
  const p25Index = Math.floor(prices.length * 0.25);
  const p50Index = Math.floor(prices.length * 0.5);

  const p5 = prices[p5Index] || 0;
  const p25 = prices[p25Index] || 0;
  const p50 = prices[p50Index] || 0;

  spanP5.textContent = p5.toFixed(2);
  spanP25.textContent = p25.toFixed(2);
  spanP50.textContent = p50.toFixed(2);
  spanAvg.textContent = avgPrice.toFixed(2);

    // Calcul de la lifetime value (durée entre la 1ère et dernière vente)
  const saleDates = sales
  .map(s => new Date(s.published)) // ⚠️ Assure-toi que la vente contient bien un champ 'date'
  .filter(d => !isNaN(d)) // Garde les dates valides
  .sort((a, b) => a - b);

  let lifetime = 'N/A';
  if (saleDates.length >= 2) {
  const diffTime = saleDates[saleDates.length - 1] - saleDates[0]; // en millisecondes
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // en jours
  lifetime = `${diffDays} days`;
  }
  document.querySelector('#lifetimeValue').textContent = lifetime;

} 


/**
 * =============================
 *      EVENT LISTENERS
 * =============================
 */

/**
 * Lors du changement du "nombre d'items à afficher" (selectShow),
 * on refait une requête avec la nouvelle taille, en conservant la page courante.
 */
selectShow.addEventListener('change', async (event) => {
  const newSize = parseInt(event.target.value, 10);
  const { currentPage } = currentPagination;

  const data = await fetchDeals(currentPage, newSize);
  setCurrentDeals(data);

  // On rafraîchit tout l'affichage
  renderApp();
});

/**
 * Lors du changement de page.
 */
selectPage.addEventListener('change', async (event) => {
  const selectedPage = parseInt(event.target.value, 10);
  const size = parseInt(selectShow.value, 10);

  const data = await fetchDeals(selectedPage, size);
  setCurrentDeals(data);

  // On rafraîchit tout l'affichage
  renderApp();
});

/**
 * Lorsque l'utilisateur coche/décoche un filtre,
 * on applique les filtres et on met à jour l'affichage des deals.
 */
discountCheckbox.addEventListener('change', applyFilters);
mostCommentedCheckbox.addEventListener('change', applyFilters);
hotCheckbox.addEventListener('change', applyFilters);

/**
 * Lors du changement de critère de tri (prix, date, etc.),
 * on applique le tri sur la liste courante de deals.
 */
selectSort.addEventListener('change', applySort);

/**
 * Lorsqu'on sélectionne un nouvel identifiant de set Lego,
 * on va chercher les ventes correspondantes et on affiche leurs indicateurs.
 */
selectLegoSetId.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;

  // Récupération des ventes
  const sales = await fetchSales(legoSetId);

  // Affichage des ventes
  displaySales(sales);

  // Calcul et affichage des indicateurs
  computeAndDisplaySalesIndicators(sales);
});


/**
 * =============================
 *         MAIN RENDER
 * =============================
 */

/**
 * Fonction principale qui gère le rendu complet de la page (Deals, Pagination, Filtres, etc.).
 */
function renderApp() {
  // 1) On affiche la liste des deals
  renderDeals(currentDeals);

  // 2) On affiche la pagination
  renderPagination(currentPagination);

  // 3) On affiche les indicateurs sur le nb total de deals
  renderDealIndicators(currentPagination);

  // 4) On génère la liste des IDs de sets Lego
  renderLegoSetIds(currentDeals);

  // 5) On applique les filtres si certains sont déjà cochés
  applyFilters();
}


/**
 * =============================
 *       INITIALIZATION
 * =============================
 */

/**
 * Au chargement du DOM, on récupère la première page de deals,
 * puis on lance l'affichage initial.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchDeals(); // page=1, size=6 par défaut
  setCurrentDeals(data);

  // Affichage initial
  renderApp();
});


document.querySelectorAll('.favorite-btn').forEach(button => {
  button.addEventListener('click', (event) => {
    const uuid = event.target.dataset.id;
    const deal = deals.find(d => d.uuid === uuid);
    if (deal) {
      saveFavorite(deal);
      alert('Added to favorites!');
    }
  });
});

favoritesCheckbox.addEventListener('change', applyFilters);
