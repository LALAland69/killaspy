import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedAd {
  ad_library_id: string;
  page_name: string;
  page_id?: string;
  primary_text?: string;
  headline?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'carousel';
  start_date?: string;
  countries?: string[];
  status?: string;
  snapshot_url?: string;
}

// Parse ads from scraped HTML/Markdown content
function parseAdsFromContent(content: string, searchTerm: string, country: string): ScrapedAd[] {
  const ads: ScrapedAd[] = [];
  
  // Try to extract ad data from the content
  // Facebook Ad Library has a specific structure we can parse
  
  // Look for ad containers and extract data
  // This regex pattern looks for common ad library patterns
  
  // Pattern 1: Look for page names and ad content
  const pageNamePattern = /(?:Started running on|Began running on|Rodou em)\s*([A-Za-z]+ \d+, \d+|\d+\/\d+\/\d+)/gi;
  const textPattern = /(?:Primary text|Texto principal|Ad text)[:\s]*([^]*?)(?:(?:Started|Began|See Ad Details)|$)/gi;
  
  // Pattern 2: Look for structured data in the content
  const adBlocks = content.split(/(?=Started running on|Began running on|Active|Ativo)/i);
  
  for (let i = 0; i < adBlocks.length && ads.length < 50; i++) {
    const block = adBlocks[i];
    if (block.length < 50) continue;
    
    // Extract what we can from each block
    const ad: ScrapedAd = {
      ad_library_id: `firecrawl_${Date.now()}_${i}`,
      page_name: 'Unknown',
      countries: [country],
      status: 'active',
    };
    
    // Try to find page name (usually appears before "Started running")
    const pageMatch = block.match(/\*\*([^*]+)\*\*|^([A-Z][^:\n]{3,50})/m);
    if (pageMatch) {
      ad.page_name = (pageMatch[1] || pageMatch[2]).trim();
    }
    
    // Try to find date
    const dateMatch = block.match(/(?:Started running on|Began running on|Rodou em)\s*([A-Za-z]+ \d+, \d+|\d+\/\d+\/\d+)/i);
    if (dateMatch) {
      ad.start_date = dateMatch[1];
    }
    
    // Try to find ad text
    const textMatch = block.match(/(?:Primary text|Body|Texto)[:\s]*"?([^"]{20,500})"?/i);
    if (textMatch) {
      ad.primary_text = textMatch[1].trim();
    }
    
    // Try to find headline
    const headlineMatch = block.match(/(?:Headline|Título)[:\s]*"?([^"]{10,200})"?/i);
    if (headlineMatch) {
      ad.headline = headlineMatch[1].trim();
    }
    
    // Try to find image URLs
    const imageMatch = block.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif)[^\s]*)/i);
    if (imageMatch) {
      ad.media_url = imageMatch[1];
      ad.media_type = 'image';
    }
    
    // Try to find video URLs
    const videoMatch = block.match(/(https?:\/\/[^\s]+\.(?:mp4|webm|mov)[^\s]*)/i);
    if (videoMatch) {
      ad.media_url = videoMatch[1];
      ad.media_type = 'video';
    }
    
    // Only add if we have meaningful data
    if (ad.page_name !== 'Unknown' || ad.primary_text || ad.headline) {
      // Add search term context
      if (!ad.primary_text && !ad.headline) {
        ad.primary_text = `Ad related to: ${searchTerm}`;
      }
      ads.push(ad);
    }
  }
  
  console.log(`Parsed ${ads.length} ads from content`);
  return ads;
}

// Import parsed ads to database
async function importAdsToDatabase(
  supabase: any,
  ads: ScrapedAd[],
  tenantId: string,
  source: string
): Promise<{ imported: number; errors: number }> {
  let imported = 0;
  let errors = 0;

  for (const ad of ads) {
    try {
      // Check if ad already exists
      const { data: existing } = await supabase
        .from('ads')
        .select('id')
        .eq('ad_library_id', ad.ad_library_id)
        .eq('tenant_id', tenantId)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('ads')
          .update({
            page_name: ad.page_name,
            primary_text: ad.primary_text,
            headline: ad.headline,
            media_url: ad.media_url,
            media_type: ad.media_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Find or create advertiser
        let advertiserId: string | null = null;
        
        const { data: advertiser } = await supabase
          .from('advertisers')
          .select('id')
          .eq('name', ad.page_name)
          .eq('tenant_id', tenantId)
          .single();
        
        if (advertiser) {
          advertiserId = advertiser.id;
        } else {
          const { data: newAdvertiser } = await supabase
            .from('advertisers')
            .insert({
              name: ad.page_name,
              tenant_id: tenantId,
              total_ads: 1,
            })
            .select('id')
            .single();
          
          if (newAdvertiser) {
            advertiserId = newAdvertiser.id;
          }
        }

        // Insert new ad
        await supabase
          .from('ads')
          .insert({
            ad_library_id: ad.ad_library_id,
            page_name: ad.page_name,
            primary_text: ad.primary_text,
            headline: ad.headline,
            media_url: ad.media_url,
            media_type: ad.media_type,
            start_date: ad.start_date,
            countries: ad.countries,
            status: ad.status,
            advertiser_id: advertiserId,
            tenant_id: tenantId,
          });
      }

      imported++;
    } catch (e) {
      console.error(`Error importing ad ${ad.ad_library_id}:`, e);
      errors++;
    }
  }

  // Log the job
  try {
    await supabase.from('job_runs').insert({
      tenant_id: tenantId,
      job_name: `Firecrawl Scrape - ${source}`,
      task_type: 'firecrawl_scrape',
      schedule_type: 'manual',
      status: errors > 0 ? 'partial' : 'completed',
      ads_processed: imported,
      errors_count: errors,
      completed_at: new Date().toISOString(),
      metadata: { source, imported, errors },
    });
  } catch (e) {
    console.error('Failed to log job:', e);
  }

  return { imported, errors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, country = 'BR', limit = 50 } = await req.json();

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ success: false, error: 'searchTerm is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured. Please enable the connector.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping Ad Library for: "${searchTerm}" in ${country}`);

    // Build Facebook Ad Library URL
    const adLibraryUrl = new URL('https://www.facebook.com/ads/library/');
    adLibraryUrl.searchParams.set('active_status', 'all');
    adLibraryUrl.searchParams.set('ad_type', 'all');
    adLibraryUrl.searchParams.set('country', country);
    adLibraryUrl.searchParams.set('q', searchTerm);
    adLibraryUrl.searchParams.set('media_type', 'all');

    console.log(`Scraping URL: ${adLibraryUrl.toString()}`);

    // Use Firecrawl to scrape the page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: adLibraryUrl.toString(),
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for JavaScript to load
        location: {
          country: country === 'BR' ? 'BR' : country === 'US' ? 'US' : 'US',
          languages: country === 'BR' ? ['pt-BR'] : ['en-US'],
        },
      }),
    });

    const scrapeResult = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeResult.error || `Firecrawl failed: ${scrapeResponse.status}`,
          details: scrapeResult 
        }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl response received');
    
    // Get content from response
    const content = scrapeResult.data?.markdown || scrapeResult.markdown || '';
    const html = scrapeResult.data?.html || scrapeResult.html || '';
    const links = scrapeResult.data?.links || scrapeResult.links || [];
    
    console.log(`Content length: ${content.length}, Links found: ${links.length}`);

    // Parse ads from content
    const parsedAds = parseAdsFromContent(content + '\n' + html, searchTerm, country);

    // Also try to extract ad snapshot URLs from links
    const adSnapshotUrls = links.filter((link: string) => 
      link.includes('facebook.com/ads/library/?id=') || 
      link.includes('ad_archive_id=')
    );

    console.log(`Found ${adSnapshotUrls.length} ad snapshot URLs`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .single();

    if (!tenant) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tenant configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import parsed ads
    const importResult = await importAdsToDatabase(
      supabase,
      parsedAds.slice(0, limit),
      tenant.id,
      `${searchTerm} (${country})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        searchTerm,
        country,
        scrapeStats: {
          contentLength: content.length,
          linksFound: links.length,
          adSnapshotUrls: adSnapshotUrls.length,
        },
        parseStats: {
          adsParsed: parsedAds.length,
        },
        importStats: importResult,
        rawContent: content.substring(0, 2000), // Preview for debugging
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
