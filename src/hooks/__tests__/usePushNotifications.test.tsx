import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: class MockNotification {
        static permission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        constructor() {}
      },
      writable: true,
      configurable: true,
    });

    // Mock Service Worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              endpoint: 'https://push.example.com/123',
              getKey: vi.fn().mockReturnValue(new ArrayBuffer(65)),
              toJSON: vi.fn().mockReturnValue({
                endpoint: 'https://push.example.com/123',
                keys: { p256dh: 'key1', auth: 'key2' },
              }),
            }),
          },
          showNotification: vi.fn().mockResolvedValue(undefined),
        }),
        getRegistration: vi.fn().mockResolvedValue({}),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default permission state', async () => {
    const { usePushNotifications } = await import('../usePushNotifications');
    
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.permission).toBeDefined();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('requests notification permission', async () => {
    const { usePushNotifications } = await import('../usePushNotifications');
    
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(window.Notification.requestPermission).toHaveBeenCalled();
  });

  it('handles permission denied', async () => {
    (window.Notification as any).requestPermission = vi.fn().mockResolvedValue('denied');
    
    const { usePushNotifications } = await import('../usePushNotifications');
    
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const granted = await result.current.requestPermission();
      expect(granted).toBe(false);
    });
  });

  it('shows local notification', async () => {
    (window.Notification as any).permission = 'granted';
    
    const { usePushNotifications } = await import('../usePushNotifications');
    
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.showLocalNotification('Test Title', {
        body: 'Test body',
        icon: '/icon.png',
      });
    });

    // Should not throw
  });

  it('provides subscription management functions', async () => {
    const { usePushNotifications } = await import('../usePushNotifications');
    
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });
});
