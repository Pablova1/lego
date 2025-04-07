const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Parse webpage HTML content and extract LEGO deals
 * @param {String} data - Raw HTML from Dealabs
 * @returns {Array} List of parsed deals
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: false });
  const deals = [];

  $('div.js-threadList article').each((_, element) => {
    const link = $(element).find('a[data-t="threadLink"]').attr('href');
    const vueData = $(element).find('div.js-vue2').attr('data-vue2');

    if (!vueData) return;

    const data = JSON.parse(vueData);
    const thread = data?.props?.thread || {};
    const retail = thread.nextBestPrice || null;
    const price = thread.price || null;
    const discount = price && retail ? Math.round((1 - price / retail) * 100) : null;
    const temperature = parseInt(thread.temperature) || 0;
    const image = thread?.mainImage?.name ? `https://static-pepper.dealabs.com/threads/raw/${thread.mainImage.slotId}/${thread.mainImage.name}/re/300x300/qt/60/${thread.mainImage.name}.${thread.mainImage.ext}` : null;
    const comments = thread.commentCount || 0;
    const published = new Date(thread.publishedAt * 1000);
    const title = thread.title || '';

    const idMatch = link ? link.match(/\b\d{5}\b/) : null;
    const id = idMatch ? idMatch[0] : thread?.threadId;

    if (link && id && title && price) {
      deals.push({
        id,
        title,
        price,
        retail,
        discount,
        temperature,
        comments,
        published,
        image,
        url: thread.url || (link.startsWith('http') ? link : `https://www.dealabs.com${link}`),
      });
    }
  });

  return deals;
};

/**
 * Scrape LEGO deals from multiple pages on Dealabs
 * @param {Number} maxPages - Number of pages to scrape
 * @returns {Array} All parsed LEGO deals
 */
async function scrapeAllDeals(maxPages = 30) {
  const allDeals = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://www.dealabs.com/groupe/lego?page=${page}`;
    console.log(`📄 Scraping page ${page}...`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Referer': 'https://www.google.com/',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Page ${page} inaccessible (HTTP ${response.status})`);
        break;
      }

      const html = await response.text();
      const parsed = parse(html);

      if (!parsed.length) {
        console.log(`⛔ Fin du scraping à la page ${page}, aucune donnée trouvée.`);
        break;
      }

      allDeals.push(...parsed);
    } catch (err) {
      console.error(`❌ Erreur scraping page ${page} :`, err.message);
      break;
    }
  }

  return allDeals;
}

module.exports = { scrapeAllDeals };
