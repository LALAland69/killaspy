import { Command } from 'commander';
import dotenv from 'dotenv';
import FacebookAdLibraryScraper from './index';

dotenv.config();

const program = new Command();

program
  .name('killaspy-scraper')
  .description('Scrape Facebook Ad Library and send to KillaSpy')
  .version('1.0.0');

program
  .option('-t, --term <term>', 'Search term to scrape')
  .option('-p, --page-id <pageId>', 'Page ID to scrape')
  .option('-c, --country <country>', 'Country code (default: US)', 'US')
  .option('-l, --limit <limit>', 'Maximum ads to scrape', '100')
  .option('--ping', 'Test webhook connection')
  .action(async (options) => {
    const scraper = new FacebookAdLibraryScraper();

    if (options.ping) {
      console.log('🔌 Testing webhook connection...');
      const connected = await scraper.ping();
      console.log(connected ? '✅ Connected!' : '❌ Connection failed');
      process.exit(connected ? 0 : 1);
    }

    if (!options.term && !options.pageId) {
      console.error('❌ Either --term or --page-id is required');
      process.exit(1);
    }

    await scraper.init();

    try {
      if (options.term) {
        const count = await scraper.scrapeByTerm(options.term, {
          country: options.country,
          limit: parseInt(options.limit, 10),
        });
        console.log(`✅ Scraped ${count} ads for term: ${options.term}`);
      } else if (options.pageId) {
        const count = await scraper.scrapeByPageId(options.pageId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(`✅ Scraped ${count} ads for page: ${options.pageId}`);
      }
    } finally {
      await scraper.close();
    }
  });

program.parse();
