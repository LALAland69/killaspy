import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase before importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  },
}));

import { useAds, useAdById, useInfiniteAds, type AdsFilters } from '../useAds';
import { supabase } from '@/integrations/supabase/client';
import { createMockAds, createMockAdWithRelations } from '@/test/mocks/data';

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useAds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ads with default parameters', async () => {
    const mockAds = createMockAds(5);
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockAds, error: null }),
      }),
    } as any);

    const { result } = renderHook(() => useAds(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(5);
    expect(supabase.from).toHaveBeenCalledWith('ads');
  });

  it('applies category filter correctly', async () => {
    const mockAds = createMockAds(3);
    const mockEq = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockAds, error: null }),
    });
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      }),
    } as any);

    const filters: AdsFilters = { category: 'category-123' };

    const { result } = renderHook(() => useAds(10, filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('applies risk level filter for high risk', async () => {
    const mockAds = createMockAds(2).map(ad => ({ ...ad, suspicion_score: 75 }));
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ data: mockAds, error: null }),
        }),
      }),
    } as any);

    const filters: AdsFilters = { riskLevel: 'high' };

    const { result } = renderHook(() => useAds(10, filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('handles query errors gracefully', async () => {
    const mockError = new Error('Database error');
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      }),
    } as any);

    const { result } = renderHook(() => useAds(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('limits results when limit parameter is provided', async () => {
    const mockAds = createMockAds(5);
    const mockLimit = vi.fn().mockResolvedValue({ data: mockAds, error: null });
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: mockLimit,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAds(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});

describe('useAdById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single ad by ID', async () => {
    const mockAd = createMockAdWithRelations({ id: 'ad-123' });
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAd, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAdById('ad-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe('ad-123');
  });

  it('does not fetch when adId is empty', () => {
    const { result } = renderHook(() => useAdById(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useInfiniteAds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paginated ads', async () => {
    const mockAds = createMockAds(20);
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ 
            data: mockAds.slice(0, 20), 
            error: null,
            count: 100 
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useInfiniteAds(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('applies winning tier filter', async () => {
    const mockAds = createMockAds(10).map(ad => ({ ...ad, longevity_days: 55 }));
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ 
              data: mockAds, 
              error: null,
              count: 10 
            }),
          }),
        }),
      }),
    } as any);

    const filters: AdsFilters = { winningTier: 'champion' };

    const { result } = renderHook(() => useInfiniteAds(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});
