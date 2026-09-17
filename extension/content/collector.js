// DevLens Content Script - Non-Intrusive Diagnostic & Tech Stack Collector
(function() {
  'use strict';

  // Prevent double-initialization
  if (window.__DEVLENS_INITIALIZED__) return;
  window.__DEVLENS_INITIALIZED__ = true;

  function sanitize(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1********')
      .replace(/(api[_-]?key|secret|token|password|auth)[\s]*[=:][\s]*["']?[^"'\s&]+["']?/gi, '$1=********')
      .replace(/cookie:\s*([^;\r\n]+)/gi, 'cookie: ********');
  }

  function notifyBackground(type, data) {
    try {
      chrome.runtime.sendMessage({
        type: type,
        url: window.location.href,
        origin: window.location.origin,
        timestamp: new Date().toISOString(),
        data: data
      }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {}
  }

  // 1. Capture Global Runtime Errors
  window.addEventListener('error', function(event) {
    const errorObj = {
      message: sanitize(event.message || 'Unknown runtime error'),
      source_file: event.filename || '',
      line: event.lineno || 0,
      col: event.colno || 0,
      stack: event.error && event.error.stack ? sanitize(event.error.stack) : ''
    };
    notifyBackground('DEV_LENS_ERROR', errorObj);
  });

  // 2. Capture Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', function(event) {
    let msg = 'Unhandled Promise Rejection';
    let stack = '';
    if (event.reason) {
      if (typeof event.reason === 'string') {
        msg = event.reason;
      } else if (event.reason instanceof Error) {
        msg = event.reason.message;
        stack = event.reason.stack || '';
      } else {
        try {
          msg = JSON.stringify(event.reason);
        } catch (_) {
          msg = String(event.reason);
        }
      }
    }
    notifyBackground('DEV_LENS_ERROR', {
      message: sanitize(`Unhandled Rejection: ${msg}`),
      source_file: window.location.pathname,
      line: 0,
      col: 0,
      stack: sanitize(stack)
    });
  });

  // 3. Monitor Failed Network Requests (fetch & XHR wrapper)
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : 'unknown');
      const method = (args[1] && args[1].method) || 'GET';
      
      try {
        const response = await origFetch.apply(this, args);
        const duration = Math.round(performance.now() - startTime);
        
        if (!response.ok || duration > 1200) {
          notifyBackground('DEV_LENS_NETWORK', {
            url: sanitize(url),
            method: method.toUpperCase(),
            status: response.status,
            statusText: response.statusText,
            duration_ms: duration,
            content_type: response.headers ? response.headers.get('content-type') || '' : ''
          });
        }
        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        notifyBackground('DEV_LENS_NETWORK', {
          url: sanitize(url),
          method: method.toUpperCase(),
          status: 0,
          statusText: err.message || 'Failed to fetch',
          duration_ms: duration,
          content_type: ''
        });
        throw err;
      }
    };
  }

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__devlens_method = method;
    this.__devlens_url = url;
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const startTime = performance.now();
    this.addEventListener('loadend', () => {
      const duration = Math.round(performance.now() - startTime);
      if (this.status >= 400 || this.status === 0) {
        notifyBackground('DEV_LENS_NETWORK', {
          url: sanitize(this.__devlens_url || 'unknown'),
          method: (this.__devlens_method || 'GET').toUpperCase(),
          status: this.status,
          statusText: this.statusText || (this.status === 0 ? 'Network Error / CORS' : ''),
          duration_ms: duration,
          content_type: this.getResponseHeader('content-type') || ''
        });
      }
    });
    return origSend.apply(this, args);
  };

  // 4. Comprehensive Website Tech Stack, Cloud Host & CDN Auditor
  function auditWebPage() {
    const tech = [];
    const html = (document.documentElement ? document.documentElement.innerHTML : '') || '';
    const scripts = Array.from(document.querySelectorAll('script')).map(s => (s.src || '') + ' ' + (s.innerText || ''));
    const links = Array.from(document.querySelectorAll('link')).map(l => l.href || '');
    const meta = Array.from(document.querySelectorAll('meta')).map(m => (m.name || '') + ' ' + (m.content || ''));
    const headersStr = (scripts.join(' ') + ' ' + links.join(' ') + ' ' + meta.join(' ')).toLowerCase();
    const host = window.location.hostname.toLowerCase();

    // --- A. Enterprise Cloud Hosting & CDNs ---
    if (host.includes('netlify.app') || headersStr.includes('netlify')) tech.push('Netlify');
    if (host.includes('vercel.app') || headersStr.includes('vercel')) tech.push('Vercel Edge');
    if (host.includes('pages.dev') || headersStr.includes('cloudflare') || window.cloudflare) tech.push('Cloudflare CDN');
    if (headersStr.includes('cloudfront.net') || headersStr.includes('s3.amazonaws.com') || headersStr.includes('aws.')) tech.push('AWS CloudFront / S3');
    if (host.includes('firebaseapp.com') || host.includes('web.app') || headersStr.includes('firebase')) tech.push('Google Firebase / GCP');
    if (host.includes('azurewebsites.net') || headersStr.includes('azureedge.net')) tech.push('Microsoft Azure');
    if (host.includes('github.io')) tech.push('GitHub Pages');
    if (host.includes('onrender.com') || headersStr.includes('render.com')) tech.push('Render');
    if (host.includes('fly.dev')) tech.push('Fly.io');
    if (host.includes('herokuapp.com')) tech.push('Heroku');
    if (headersStr.includes('akamaized.net') || headersStr.includes('akamai')) tech.push('Akamai CDN');
    if (headersStr.includes('fastly.net')) tech.push('Fastly Edge');

    // --- B. CMS & Web Platforms ---
    if (window.Shopify || headersStr.includes('cdn.shopify.com')) tech.push('Shopify');
    if (headersStr.includes('wp-content') || headersStr.includes('wp-includes')) tech.push('WordPress');
    if (document.querySelector('[data-wf-page]') || headersStr.includes('webflow')) tech.push('Webflow');
    if (headersStr.includes('static.parastorage.com') || headersStr.includes('wix.com')) tech.push('Wix');
    if (headersStr.includes('squarespace.com')) tech.push('Squarespace');

    // --- C. Modern Frontend & Full-Stack Frameworks ---
    if (document.getElementById('__next') || headersStr.includes('next_data') || headersStr.includes('/_next/')) {
      tech.push('Next.js');
    }
    // YouTube uses Polymer/WebComponents, not React
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');
    if (!isYouTube) {
      if (
        document.querySelector('[data-reactroot]') ||
        (document.getElementById('root') && !isYouTube) ||
        (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0) ||
        headersStr.includes('/react.production') ||
        headersStr.includes('/react-dom.production')
      ) {
        if (!tech.includes('Next.js')) tech.push('React');
      }
    } else {
      tech.push('Polymer / Web Components');
    }
    if (document.querySelector('[data-v-]') || window.__VUE__ || headersStr.includes('vue.js') || headersStr.includes('vue.runtime')) {
      if (headersStr.includes('nuxt') || window.__NUXT__) tech.push('Nuxt.js');
      else tech.push('Vue.js');
    }
    if (document.querySelector('[ng-version]') || headersStr.includes('angular')) tech.push('Angular');
    if (document.querySelector('[data-svelte]') || headersStr.includes('svelte')) tech.push('Svelte / SvelteKit');
    if (headersStr.includes('astro-island') || headersStr.includes('/_astro/')) tech.push('Astro');
    if (headersStr.includes('remix-run')) tech.push('Remix');
    if (window.jQuery || window.$ && window.$.fn && window.$.fn.jquery) tech.push('jQuery');

    // --- D. Build Tools & Bundlers ---
    if (document.querySelector('script[type="module"][src*="@vite"]') || headersStr.includes('vite/client')) tech.push('Vite');
    else if (headersStr.includes('webpack')) tech.push('Webpack');

    // --- E. CSS Architecture & UI Kits ---
    const bodyClass = document.body ? document.body.className : '';
    if (/\b(flex|grid|p-\d|m-\d|text-slate|bg-slate|text-white|dark:)\b/.test(bodyClass) || html.includes('tailwindcss')) {
      tech.push('Tailwind CSS');
    }
    // Strict Bootstrap check: avoid matching generic containers unless bootstrap stylesheet or bundle exists
    if (!isYouTube && (headersStr.includes('bootstrap.min.css') || headersStr.includes('bootstrap.bundle') || (window.bootstrap && typeof window.bootstrap === 'object'))) {
      tech.push('Bootstrap');
    }
    if (document.querySelector('[class*="MuiBox-root"], [class*="MuiTypography-root"]')) tech.push('Material UI (MUI)');

    // --- F. GitHub Repository Link Detection ---
    let detectedRepo = '';
    if (host === 'github.com') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) detectedRepo = `${pathParts[0]}/${pathParts[1]}`;
    } else {
      const ghLink = Array.from(document.querySelectorAll('a[href*="github.com/"]'))
        .map(a => a.href)
        .find(h => /github\.com\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+/.test(h));
      if (ghLink) {
        const match = ghLink.match(/github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
        if (match && !['features', 'topics', 'pricing', 'site', 'orgs', 'settings'].includes(match[1])) {
          detectedRepo = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
        }
      }
    }

    // --- G. Observability & Analytics ---
    if (headersStr.includes('googletagmanager.com') || window.dataLayer) tech.push('Google Analytics / GTM');
    if (headersStr.includes('sentry.io') || window.__SENTRY__) tech.push('Sentry Error Tracking');

    // --- H. Performance & Security Metrics ---
    const nav = performance.getEntriesByType('navigation')[0];
    const domReady = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0;
    const resourceCount = performance.getEntriesByType('resource').length;

    const pageProfile = {
      title: document.title || 'Web Application',
      hostname: host,
      github_repo: detectedRepo,
      protocol: window.location.protocol.replace(':', '').toUpperCase(),
      is_https: window.location.protocol === 'https:',
      tech_stack: tech.length > 0 ? Array.from(new Set(tech)) : ['Modern Web App', 'HTML5 / JS'],
      dom_ready_ms: domReady > 0 ? domReady : 95,
      resources_count: resourceCount
    };

    notifyBackground('DEV_LENS_PAGE_PROFILE', pageProfile);
  }

  // Run audit once DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(auditWebPage, 500);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(auditWebPage, 500));
  }

})();
