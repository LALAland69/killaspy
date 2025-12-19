import type { Tables } from '@/integrations/supabase/types';

// Mock Ad data
export const mockAd: Tables<'ads'> = {
  id: 'ad-123',
  tenant_id: 'tenant-123',
  advertiser_id: 'advertiser-123',
  domain_id: 'domain-123',
  category_id: 'category-123',
  ad_library_id: 'fb-ad-123',
  page_name: 'Test Page',
  headline: 'Test Headline',
  primary_text: 'This is a test ad primary text',
  cta: 'Learn More',
  media_url: 'https://example.com/image.jpg',
  media_type: 'image',
  status: 'active',
  countries: ['BR', 'US'],
  language: 'pt',
  start_date: '2024-01-01',
  end_date: null,
  longevity_days: 45,
  suspicion_score: 25,
  engagement_score: 80,
  winning_score: 75,
  visual_hook_score: 70,
  copy_sentiment: 'positive',
  offer_category: 'ecommerce',
  is_cloaked_flag: false,
  white_url: 'https://example.com',
  detected_black_url: null,
  final_lp_url: 'https://example.com/landing',
  cloaker_token: null,
  region: 'LATAM',
  last_snapshot_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Advertiser data
export const mockAdvertiser: Tables<'advertisers'> = {
  id: 'advertiser-123',
  tenant_id: 'tenant-123',
  name: 'Test Advertiser',
  page_id: 'fb-page-123',
  total_ads: 50,
  active_ads: 25,
  countries: 5,
  domains_count: 3,
  avg_suspicion_score: 30,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Domain data
export const mockDomain: Tables<'domains'> = {
  id: 'domain-123',
  tenant_id: 'tenant-123',
  advertiser_id: 'advertiser-123',
  domain: 'example.com',
  page_count: 10,
  sales_pages: 5,
  compliance_pages: 3,
  suspicion_score: 20,
  tech_stack: ['WordPress', 'WooCommerce'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Category data
export const mockCategory: Tables<'ad_categories'> = {
  id: 'category-123',
  tenant_id: 'tenant-123',
  name: 'E-commerce',
  slug: 'ecommerce',
  keywords: ['shop', 'buy', 'store'],
  countries: ['BR', 'US'],
  ads_count: 100,
  is_active: true,
  last_harvest_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Profile data
export const mockProfile: Tables<'profiles'> = {
  id: 'profile-123',
  user_id: 'user-123',
  tenant_id: 'tenant-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Alert data
export const mockAlert: Tables<'alerts'> = {
  id: 'alert-123',
  tenant_id: 'tenant-123',
  title: 'New high-risk ad detected',
  message: 'A new ad with suspicion score above 80 was detected.',
  alert_type: 'high_risk',
  severity: 'warning',
  is_read: false,
  related_ad_id: 'ad-123',
  related_advertiser_id: 'advertiser-123',
  metadata: {},
  created_at: new Date().toISOString(),
};

// Mock Job Run data
export const mockJobRun: Tables<'job_runs'> = {
  id: 'job-123',
  tenant_id: 'tenant-123',
  job_name: 'Ad Harvest',
  task_type: 'harvest',
  schedule_type: 'daily',
  status: 'completed',
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  duration_ms: 5000,
  ads_processed: 100,
  divergences_found: 5,
  errors_count: 0,
  error_message: null,
  metadata: {},
  created_at: new Date().toISOString(),
};

// Helper to create multiple mock ads
export function createMockAds(count: number): Tables<'ads'>[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockAd,
    id: `ad-${i + 1}`,
    headline: `Test Headline ${i + 1}`,
    longevity_days: Math.floor(Math.random() * 100),
    suspicion_score: Math.floor(Math.random() * 100),
  }));
}

// Helper to create ads with advertisers and domains (joined data)
export function createMockAdWithRelations(overrides: Partial<Tables<'ads'>> = {}) {
  return {
    ...mockAd,
    ...overrides,
    advertisers: mockAdvertiser,
    domains: mockDomain,
  };
}
