const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Array} deals
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: true });

  const deals = $('div.js-threadList article')
    .map((i, element) => {
      const link = $(element).find('a[data-t="threadLink"]').attr('href');

      const vue2Attr = $(element).find('div.js-vue2').attr('data-vue2');
      if (!vue2Attr) return null;

      const data = JSON.parse(vue2Attr);
      const thread = data?.props?.thread;
      if (!thread) return null;

      const retail = thread.nextBestPrice || null;
      const price = thread.price || null;
      const discount = price && retail ? Math.round((1 - price / retail) * 100) : null;
      const temperature = thread.temperature || null;
      const comments = thread.commentCount || 0;
      const published = new Date(thread.publishedAt * 1000).toISOString();
      const title = thread.title || null;
      const idMatch = link?.match(/\b\d{5}\b/);
      const id = idMatch ? idMatch[0] : thread.threadId;
      const image = `https://static-pepper.dealabs.com/threads/raw/${thread.mainImage.slotId}/${thread.mainImage.name}/re/300x300/qt/60/${thread.mainImage.name}.${thread.mainImage.ext}`;

      return {
        id,
        title,
        link: `https://www.dealabs.com${link}`,
        price,
        retail,
        discount,
        temperature,
        comments,
        published,
        image
      };
    })
    .get()
    .filter(deal => deal && /^\d{5}$/.test(deal.id)); // garder que ceux avec ID correct

  return deals;
};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Promise<Array>} deals
 */
module.exports.scrape = async (url) => {
  try {
    console.log(`🔍 Scraping: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.google.com/',
      },
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const body = await response.text();
    const deals = parse(body);

    fs.writeFileSync('dealabs.json', JSON.stringify(deals, null, 2), 'utf-8');
    console.log(`✅ ${deals.length} deals sauvegardés dans dealabs.json`);

    return deals;
  } catch (err) {
    console.error(`❌ Scraping failed: ${err.message}`);
    return [];
  }
};
