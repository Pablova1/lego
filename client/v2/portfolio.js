// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

// Checkboxes for discount, comments, hot
const discountCheckbox = document.querySelector('#filter-discount');
const mostCommentedCheckbox = document.querySelector('#filter-most-commented');
const hotCheckbox = document.querySelector('#filter-hot');

function applyFilters() {
  let filtered = [...currentDeals]; // liste complète au départ

  // Feature 2 - Filter by best discount
  if (discountCheckbox.checked) {
    filtered = filtered.filter(deal => deal.discount >= 50);
  }

  // Feature 3 - Filter by most commented
  if (mostCommentedCheckbox.checked) {
    filtered = filtered.filter(deal => deal.commentsCount > 15);
  }

  // Feature 4 - Filter by hot deals
  if (hotCheckbox.checked) {
    filtered = filtered.filter(deal => deal.temperature > 100);
  }

  // Rendu final
  renderDeals(filtered);
  spanNbDeals.innerHTML = filtered.length;
}

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

// Sélecteur
const selectSort = document.querySelector('#sort-select');

function applySort() {
  const sortValue = selectSort.value;
  
  // Copie du tableau pour ne pas écraser l'original
  let sortedDeals = [...currentDeals];

  if (sortValue === 'price-asc') {
    // Tri par prix croissant
    sortedDeals.sort((a, b) => a.price - b.price);
  } 
  else if (sortValue === 'price-desc') {
    // Tri par prix décroissant
    sortedDeals.sort((a, b) => b.price - a.price);
  } 
  else if (sortValue === 'date-asc') {
    // Tri du plus récent au plus ancien
    // Suppose qu'on a un champ 'date' ou 'createdAt'
    sortedDeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } 
  else if (sortValue === 'date-desc') {
    // Tri du plus ancien au plus récent
    sortedDeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // On réaffiche la liste
  renderDeals(sortedDeals);
  
  // Mise à jour du compteur de deals si besoin
  spanNbDeals.innerHTML = sortedDeals.length;
}

const sectionSales = document.querySelector('#sales');

/**
 * Fetch Vinted sales for a given lego set id
 * 
 * @param {String} legoSetId
 * @returns {Array} array of sales
 */
async function fetchSales(legoSetId) {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`);
    const body = await response.json();
    
    // On vérifie si la requête a réussi
    if (body.success !== true) {
      console.error('Failed to fetch sales:', body);
      return [];
    }

    // Au lieu de "return body.data;", on renvoie directement le tableau:
    return body.data.result; // <-- tableau des ventes
  } catch (error) {
    console.error(error);
    return [];
  }
}


/**
 * Display an array of Vinted sales in the #sales section
 * @param {Array} sales
 */
function displaySales(sales) {
  // On vide d'abord la section
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>';

  if (sales.length === 0) {
    sectionSales.innerHTML += '<p>No sales found for this set.</p>';
    return;
  }

  // On peut créer un conteneur
  const div = document.createElement('div');

  // Construire le HTML de chaque vente
  const template = sales.map(item => {
    return `
      <div class="sale">
        <span>Title: ${item.title}</span>
        <span>Price: ${item.price} €</span>
        <!-- un lien vers la vente, ouvrable dans un nouvel onglet -->
        <a href="${item.link}" target="_blank">See item</a>
      </div>
    `;
  }).join('');

  div.innerHTML = template;
  sectionSales.appendChild(div);
}

const spanNbSales = document.querySelector('#nbSales');

async function fetchSales(legoSetId) {
  // Extrait minimal : renvoie un tableau "result"
  const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`);
  const body = await response.json();
  if (body.success !== true) {
    console.error('Failed to fetch sales:', body);
    return [];
  }
  // On retourne le tableau
  // (body.data.result) selon la structure
  return body.data.result;
}

function displaySales(sales) {
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>';

  // On peut, par exemple, afficher "No sales found" si le tableau est vide
  if (sales.length === 0) {
    sectionSales.innerHTML += '<p>No sales found for this set.</p>';
    return;
  }

  const template = sales.map(item => `
    <div class="sale">
      <span>Title: ${item.title}</span>
      <span>Price: ${item.price} €</span>
      <a href="${item.link}" target="_blank">View</a>
    </div>
  `).join('');

  sectionSales.innerHTML += template;
}

const selectLegoSetId = document.querySelector('#lego-set-id-select');

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const selectedPage = parseInt(event.target.value);
  // On réutilise la taille de page courante
  const size = parseInt(selectShow.value);
  const deals = await fetchDeals(selectedPage, size);

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

discountCheckbox.addEventListener('change', applyFilters);
mostCommentedCheckbox.addEventListener('change', applyFilters);
hotCheckbox.addEventListener('change', applyFilters);

// Listener pour trier selon la valeur sélectionnée
selectSort.addEventListener('change', () => {
  applySort();
});

selectLegoSetIds.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;

  // On va chercher les ventes Vinted pour cet id
  const sales = await fetchSales(legoSetId);

  // On les affiche
  displaySales(sales);
});

selectLegoSetId.addEventListener('change', async event => {
  const legoSetId = event.target.value;

  // 1. On fetch les ventes
  const sales = await fetchSales(legoSetId);

  // 2. On met à jour "nbSales" => Feature 8
  spanNbSales.textContent = sales.length;

  // 3. On affiche la liste des ventes
  displaySales(sales);
});