const fs = require('fs');
const fetch = require('node-fetch');

async function scrapeFromVinted(searchText) {
  const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&time=${Math.floor(Date.now() / 1000)}&search_text=lego ${searchText}`;
  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "fr",
    "x-anon-id": "some-anon-id", // À ajuster si nécessaire
    "x-csrf-token": "some-token", // À ajuster si nécessaire
    "x-money-object": "true",
    "cookie": "TA_GROSSE_COOKIE_ICI", // À mettre à jour avec ta vraie session
    "referer": `https://www.vinted.fr/catalog?search_text=lego%20${searchText}`,
  };

  try {
    const response = await fetch(url, {
      headers,
      method: 'GET'
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} pour ${searchText}`);
      return [];
    }

    const data = await response.json();
    const items = data.items || [];

    return items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.total_item_price.amount,
      brand: item.brand_title,
      url: item.url
    }));
  } catch (err) {
    console.error(`❌ Erreur Vinted pour ${searchText}`, err.message);
    return [];
  }
}

module.exports = { scrapeFromVinted };
