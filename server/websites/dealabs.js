const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAllDeals() {
  const url = "https://www.dealabs.com/groupe/lego"; // modifie si besoin
  const deals = [];

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    $('.threadListItem').each((_, el) => {
      const title = $(el).find('a[data-testid="thread-title"]').text().trim();
      const price = $(el).find('.cept-deal-price').first().text().trim();
      const link = $(el).find('a[data-testid="thread-title"]').attr('href');
      const fullUrl = link ? `https://www.dealabs.com${link}` : null;

      if (title && price && fullUrl) {
        deals.push({ title, price, url: fullUrl });
      }
    });

    return deals;
  } catch (err) {
    console.error("❌ Erreur scraping Dealabs :", err.message);
    return [];
  }
}

// ✅ L’export ici est ESSENTIEL
module.exports = { scrapeAllDeals };
