module.exports = {
  ci: {
    collect: {
      // Use static server for built files
      staticDistDir: './dist',
      // Number of runs per URL
      numberOfRuns: 3,
      // URLs to test
      url: [
        'http://localhost/',
        'http://localhost/auth',
      ],
      // Chrome flags for consistent results
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        // Throttling for mobile simulation
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        // Form factor
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },
    assert: {
      // Assertions for CI/CD pipeline
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        
        // PWA
        'categories:pwa': ['warn', { minScore: 0.9 }],
        'installable-manifest': 'error',
        'service-worker': 'error',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'viewport': 'error',
        
        // Accessibility
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Security
        'is-on-https': 'off', // Off for local testing
        'csp-xss': 'warn',
      },
    },
    upload: {
      // Upload results to temporary public storage
      target: 'temporary-public-storage',
    },
  },
};
