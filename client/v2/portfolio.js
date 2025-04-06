'use strict';

// Globals
let currentDeals = [];
let currentPagination = {};

const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetId = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const sectionSales = document.querySelector('#sales');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanP5 = document.querySelector('#p5Sales');
const spanP25 = document.querySelector('#p25Sales');
const spanP50 = document.querySelector('#p50Sales');
const spanAvg = document.querySelector('#avgSales');
const favoritesCheckbox = document.querySelector('#filter-favorites');
const discountCheckbox = document.querySelector('#filter-discount');
const mostCommentedCheckbox = document.querySelector('#filter-most-commented');
const hotCheckbox = document.querySelector('#filter-hot');
const selectSort = document.querySelector('#sort-select');

async function fetchDeals(page = 1, size = 6) {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`);
    const body = await response.json();
    return body.success ? body.data : { result: [], meta: {} };
  } catch (error) {
    console.error('Error fetching deals:', error);
    return { result: [], meta: {} };
  }
}

async function fetchSales(id) {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();
    return body.success ? body.data.result : [];
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

function setCurrentDeals({ result, meta }) {
  currentDeals = result;
  currentPagination = meta;
}

function renderDeals(deals) {
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  if (!deals.length) {
    sectionDeals.innerHTML += '<p>No deals to display.</p>';
    return;
  }

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const container = document.createElement('div');
  container.innerHTML = deals.map(deal => {
    const isFav = favorites.some(f => f.uuid === deal.uuid);
    return `
      <div class="deal" id="${deal.uuid}">
        <span>#${deal.id}</span>
        <a href="${deal.link}" target="_blank" rel="noopener noreferrer">${deal.title}</a>
        <span>${deal.price} €</span>
        <button class="favorite-btn" data-id="${deal.uuid}">${isFav ? '❤️' : '🤍'}</button>
      </div>
    `;
  }).join('');
  sectionDeals.appendChild(container);

  document.querySelectorAll('.favorite-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const uuid = e.target.dataset.id;
      const deal = deals.find(d => d.uuid === uuid);
      toggleFavorite(deal);
      renderDeals(deals);
    });
  });
}

function toggleFavorite(deal) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const index = favorites.findIndex(f => f.uuid === deal.uuid);
  if (index >= 0) favorites.splice(index, 1);
  else favorites.push(deal);
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function renderPagination({ currentPage, pageCount }) {
  selectPage.innerHTML = pageCount ? Array.from({ length: pageCount }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('') : '';
  selectPage.value = currentPage;
}

function renderLegoSetIds(deals) {
  const ids = getIdsFromDeals(deals);
  selectLegoSetId.innerHTML = ids.map(id => `<option value="${id}">${id}</option>`).join('');
}

function renderDealIndicators({ count }) {
  spanNbDeals.textContent = count || 0;
}

function displaySales(sales) {
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>' + (sales.length ? sales.map(s => `
    <div class="sale">
      <span>Title: ${s.title}</span>
      <span>Price: ${s.price} €</span>
      <a href="${s.link}" target="_blank">See item</a>
    </div>`).join('') : '<p>No sales found.</p>');
}

function applyFilters() {
  let filteredDeals = [...currentDeals];
  if (discountCheckbox.checked) filteredDeals = filteredDeals.filter(d => d.discount >= 50);
  if (mostCommentedCheckbox.checked) filteredDeals = filteredDeals.filter(d => d.commentsCount > 15);
  if (hotCheckbox.checked) filteredDeals = filteredDeals.filter(d => d.temperature > 100);
  if (favoritesCheckbox.checked) {
    const favs = JSON.parse(localStorage.getItem('favorites')) || [];
    const favIds = favs.map(f => f.uuid);
    filteredDeals = filteredDeals.filter(d => favIds.includes(d.uuid));
  }
  renderDeals(filteredDeals);
  spanNbDeals.textContent = filteredDeals.length;
}

function applySort() {
  const sortValue = selectSort.value;
  let sortedDeals = [...currentDeals];
  switch (sortValue) {
    case 'price-asc': sortedDeals.sort((a, b) => a.price - b.price); break;
    case 'price-desc': sortedDeals.sort((a, b) => b.price - a.price); break;
    case 'date-asc': sortedDeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'date-desc': sortedDeals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
  }
  renderDeals(sortedDeals);
  spanNbDeals.textContent = sortedDeals.length;
}

function computeAndDisplaySalesIndicators(sales) {
  spanNbSales.textContent = sales.length;
  if (!sales.length) {
    [spanP5, spanP25, spanP50, spanAvg].forEach(el => el.textContent = '0');
    return;
  }

  const prices = sales.map(s => Number(s.price)).filter(p => !isNaN(p)).sort((a, b) => a - b);
  const avg = prices.reduce((acc, val) => acc + val, 0) / prices.length;
  const p5 = prices[Math.floor(prices.length * 0.05)] || 0;
  const p25 = prices[Math.floor(prices.length * 0.25)] || 0;
  const p50 = prices[Math.floor(prices.length * 0.5)] || 0;

  spanP5.textContent = p5.toFixed(2);
  spanP25.textContent = p25.toFixed(2);
  spanP50.textContent = p50.toFixed(2);
  spanAvg.textContent = avg.toFixed(2);

  const saleDates = sales.map(s => new Date(s.published)).filter(d => !isNaN(d)).sort((a, b) => a - b);
  const lifetime = saleDates.length >= 2 ? `${Math.round((saleDates.at(-1) - saleDates[0]) / (1000 * 60 * 60 * 24))} days` : 'N/A';
  document.querySelector('#lifetimeValue').textContent = lifetime;
}

selectShow.addEventListener('change', async e => {
  const newSize = parseInt(e.target.value);
  const data = await fetchDeals(currentPagination.currentPage, newSize);
  setCurrentDeals(data);
  renderApp();
});

selectPage.addEventListener('change', async e => {
  const page = parseInt(e.target.value);
  const size = parseInt(selectShow.value);
  const data = await fetchDeals(page, size);
  setCurrentDeals(data);
  renderApp();
});

[discountCheckbox, mostCommentedCheckbox, hotCheckbox, favoritesCheckbox].forEach(box => box.addEventListener('change', applyFilters));
selectSort.addEventListener('change', applySort);

selectLegoSetId.addEventListener('change', async e => {
  const sales = await fetchSales(e.target.value);
  displaySales(sales);
  computeAndDisplaySalesIndicators(sales);
});

function renderApp() {
  renderDeals(currentDeals);
  renderPagination(currentPagination);
  renderDealIndicators(currentPagination);
  renderLegoSetIds(currentDeals);
  applyFilters();
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchDeals();
  setCurrentDeals(data);
  renderApp();
});
