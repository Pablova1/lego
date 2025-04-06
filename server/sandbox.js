/* eslint-disable no-console, no-process-exit */
const fs = require('fs');
const avenuedelabrique = require('./websites/avenuedelabrique');

async function sandbox (website = 'https://www.avenuedelabrique.com/nouveautes-lego') {
  try {
    console.log(`🕵️‍♀️  browsing ${website} website`);

    const deals = await avenuedelabrique.scrape(website);

    console.log(deals);

    // ✅ Ici : écrire dans le fichier JSON
    fs.writeFileSync('deals.json', JSON.stringify(deals, null, 2), 'utf-8');
    console.log('✅ deals.json généré');

    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;
sandbox(eshop);
