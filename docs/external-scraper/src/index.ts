import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import { Page, Browser } from 'puppeteer';

puppeteer.use(StealthPlugin());

interface ScrapedAd {
  ad_library_id: string;
  page_name: string;
  page_id?: string;
  primary_text?: string;
  headline?: string;
  cta?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'carousel';
  start_date?: string;
  end_date?: string;
  countries?: string[];
  status?: string;
  platform?: string;
  snapshot_url?: string;
}

interface ScraperConfig {
  webhookUrl: string;
  webhookSecret: string;
  scraperId: string;
  batchSize: number;
  delayBetweenRequests: number;
}

export class FacebookAdLibraryScraper {
  private config: ScraperConfig;
  private browser: Browser | null = null;
  private adsBuffer: ScrapedAd[] = [];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      webhookUrl: config.webhookUrl || process.env.WEBHOOK_URL || '',
      webhookSecret: config.webhookSecret || process.env.WEBHOOK_SECRET || '',
      scraperId: config.scraperId || process.env.SCRAPER_ID || 'default-scraper',
      batchSize: config.batchSize || 50,
      delayBetweenRequests: config.delayBetweenRequests || 2000,
    };

    if (!this.config.webhookUrl) {
      throw new Error('WEBHOOK_URL is required');
    }
  }

  async init(): Promise<void> {
    console.log('🚀 Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
      ],
    });
    console.log('✅ Browser initialized');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.flushBuffer();
      await this.browser.close();
      this.browser = null;
    }
  }

  // Flush buffered ads to webhook
  private async flushBuffer(): Promise<void> {
    if (this.adsBuffer.length === 0) return;

    console.log(`📤 Sending ${this.adsBuffer.length} ads to webhook...`);

    try {
      const response = await axios.post(
        this.config.webhookUrl,
        {
          action: 'batch_import',
          scraper_id: this.config.scraperId,
          ads: this.adsBuffer,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': this.config.webhookSecret,
          },
          timeout: 30000,
        }
      );

      console.log(`✅ Webhook response:`, response.data);
      this.adsBuffer = [];
    } catch (error) {
      console.error('❌ Failed to send to webhook:', error);
      throw error;
    }
  }

  // Add ad to buffer and flush if full
  private async bufferAd(ad: ScrapedAd): Promise<void> {
    this.adsBuffer.push(ad);
    
    if (this.adsBuffer.length >= this.config.batchSize) {
      await this.flushBuffer();
    }
  }

  // Random delay to appear more human
  private async humanDelay(): Promise<void> {
    const delay = this.config.delayBetweenRequests + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Scrape ads by search term
  async scrapeByTerm(term: string, options: { country?: string; limit?: number } = {}): Promise<number> {
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const country = options.country || 'ALL';
    const limit = options.limit || 100;
    let scraped = 0;

    try {
      // Build URL
      const url = new URL('https://www.facebook.com/ads/library/');
      url.searchParams.set('active_status', 'all');
      url.searchParams.set('ad_type', 'all');
      url.searchParams.set('country', country);
      url.searchParams.set('q', term);
      url.searchParams.set('media_type', 'all');

      console.log(`🔍 Scraping: ${url.toString()}`);
      await page.goto(url.toString(), { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for ads to load
      await page.waitForSelector('[class*="x1lliihq"]', { timeout: 30000 }).catch(() => {});
      await this.humanDelay();

      // Setup response interception
      const ads: ScrapedAd[] = [];
      
      page.on('response', async (response) => {
        try {
          const respUrl = response.url();
          if (respUrl.includes('graphql') && response.status() === 200) {
            const text = await response.text();
            const parsed = JSON.parse(text);
            const extracted = this.extractAdsFromGraphQL(parsed);
            ads.push(...extracted);
          }
        } catch {}
      });

      // Scroll to load more ads
      while (scraped < limit) {
        await this.scrollPage(page);
        await this.humanDelay();

        // Process new ads from GraphQL responses
        while (ads.length > 0 && scraped < limit) {
          const ad = ads.shift()!;
          await this.bufferAd(ad);
          scraped++;
          console.log(`📦 Scraped ad ${scraped}/${limit}: ${ad.ad_library_id}`);
        }

        // Check if we've reached the end
        const hasMore = await page.evaluate(() => {
          const loadingIndicator = document.querySelector('[role="progressbar"]');
          return !!loadingIndicator;
        });

        if (!hasMore && ads.length === 0) {
          console.log('📄 No more ads to load');
          break;
        }
      }

      // Final flush
      await this.flushBuffer();

    } catch (error) {
      console.error('❌ Scrape error:', error);
    } finally {
      await page.close();
    }

    return scraped;
  }

  // Scrape ads by page ID
  async scrapeByPageId(pageId: string, options: { limit?: number } = {}): Promise<number> {
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();
    const limit = options.limit || 100;
    let scraped = 0;

    try {
      const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${pageId}`;
      
      console.log(`🔍 Scraping page ID: ${pageId}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Similar logic to scrapeByTerm...
      // (abbreviated for clarity - full implementation would mirror above)

    } catch (error) {
      console.error('❌ Scrape error:', error);
    } finally {
      await page.close();
    }

    return scraped;
  }

  // Scroll page to trigger infinite loading
  private async scrollPage(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 0.8);
    });
  }

  // Extract ads from GraphQL response
  private extractAdsFromGraphQL(response: any): ScrapedAd[] {
    const ads: ScrapedAd[] = [];

    try {
      const edges = response?.data?.ad_library_main?.search_results_connection?.edges;
      if (!Array.isArray(edges)) return ads;

      for (const edge of edges) {
        const node = edge?.node;
        if (!node) continue;

        const collatedResults = node.collated_results || [];
        
        for (const result of collatedResults) {
          if (!result) continue;

          const snapshot = result.snapshot || {};
          
          const ad: ScrapedAd = {
            ad_library_id: result.ad_archive_id || result.id || `gen_${Date.now()}`,
            page_name: snapshot.page_name || result.page_name || 'Unknown',
            page_id: result.page_id || snapshot.page_id,
            primary_text: snapshot.body?.text,
            headline: snapshot.title,
            cta: snapshot.cta_text,
            media_url: this.extractMediaUrl(snapshot),
            media_type: this.detectMediaType(snapshot),
            start_date: result.start_date || result.ad_delivery_start_time,
            end_date: result.end_date || result.ad_delivery_stop_time,
            status: result.is_active ? 'active' : 'inactive',
            platform: snapshot.publisher_platform?.[0]?.toLowerCase() || 'facebook',
            countries: result.reached_countries,
          };

          if (ad.ad_library_id) {
            ads.push(ad);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting ads:', error);
    }

    return ads;
  }

  private extractMediaUrl(snapshot: any): string | undefined {
    if (snapshot.videos?.[0]?.video_hd_url) {
      return snapshot.videos[0].video_hd_url;
    }
    if (snapshot.images?.[0]?.original_image_url) {
      return snapshot.images[0].original_image_url;
    }
    if (snapshot.cards?.[0]?.original_image_url) {
      return snapshot.cards[0].original_image_url;
    }
    return undefined;
  }

  private detectMediaType(snapshot: any): 'image' | 'video' | 'carousel' {
    if (snapshot.videos?.length > 0) return 'video';
    if (snapshot.cards?.length > 1) return 'carousel';
    return 'image';
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.config.webhookUrl,
        { action: 'ping' },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': this.config.webhookSecret,
          },
        }
      );
      return response.data?.success === true;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  const scraper = new FacebookAdLibraryScraper();

  // Check webhook connectivity
  console.log('🔌 Checking webhook connection...');
  const connected = await scraper.ping();
  if (!connected) {
    console.error('❌ Cannot connect to webhook');
    process.exit(1);
  }
  console.log('✅ Webhook connected');

  await scraper.init();

  try {
    // Example: scrape ads for a search term
    const count = await scraper.scrapeByTerm('fitness supplements', {
      country: 'US',
      limit: 100,
    });
    console.log(`✅ Scraped ${count} ads`);
  } finally {
    await scraper.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default FacebookAdLibraryScraper;
