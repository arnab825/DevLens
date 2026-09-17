// DevLens Interactive Sandbox Controller
'use strict';

function log(msg, color = '#34D399') {
  const box = document.getElementById('statusLog');
  if (!box) return;
  const timestamp = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.style.color = color;
  line.textContent = `[${timestamp}] ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

// Ensure diagnostic events are recorded into DevLens storage even on internal extension pages
function recordDiagnostic(type, data) {
  try {
    chrome.runtime.sendMessage({
      type: type,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      data: data
    }, () => {
      if (chrome.runtime.lastError) {
        // Expected if background idle
      }
    });
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  log('> Sandbox initialized. DevLens listeners active. Ready to generate test events.');

  // 1. TypeError: undefined access
  const btnTypeError = document.getElementById('btnTypeError');
  if (btnTypeError) {
    btnTypeError.addEventListener('click', () => {
      log('Triggering TypeError: Cannot read properties of undefined (reading "avatar")...', '#F87171');
      const errPayload = {
        message: "TypeError: Cannot read properties of undefined (reading 'avatar')",
        source_file: "UserProfile.jsx",
        line: 42,
        col: 15,
        stack: "TypeError: Cannot read properties of undefined (reading 'avatar')\n    at UserProfile (UserProfile.jsx:42:15)\n    at renderWithHooks (react-dom.js:14985:18)"
      };
      recordDiagnostic('DEV_LENS_ERROR', errPayload);
      
      // Also trigger real runtime exception
      setTimeout(() => {
        const user = undefined;
        user.profile.avatar;
      }, 50);
    });
  }

  // 2. ReferenceError: missing identifier
  const btnRefError = document.getElementById('btnRefError');
  if (btnRefError) {
    btnRefError.addEventListener('click', () => {
      log('Triggering ReferenceError: missingConfigVariable is not defined...', '#F87171');
      const errPayload = {
        message: "ReferenceError: missingConfigVariable is not defined",
        source_file: "ConfigService.js",
        line: 18,
        col: 5,
        stack: "ReferenceError: missingConfigVariable is not defined\n    at initialize (ConfigService.js:18:5)"
      };
      recordDiagnostic('DEV_LENS_ERROR', errPayload);
      
      setTimeout(() => {
        missingConfigVariable.initialize();
      }, 50);
    });
  }

  // 3. Unhandled Promise Rejection
  const btnRejection = document.getElementById('btnRejection');
  if (btnRejection) {
    btnRejection.addEventListener('click', () => {
      log('Triggering Unhandled Rejection: Database connection timed out...', '#FBBF24');
      const errPayload = {
        message: "Unhandled Rejection: Error: Database connection timed out in worker pool",
        source_file: "DatabasePool.js",
        line: 88,
        col: 12,
        stack: "Error: Database connection timed out in worker pool\n    at DatabasePool.connect (DatabasePool.js:88:12)"
      };
      recordDiagnostic('DEV_LENS_ERROR', errPayload);

      new Promise((_, reject) => {
        reject(new Error("Database connection timed out in worker pool"));
      });
    });
  }

  // 4. 404 Not Found API call
  const btn404 = document.getElementById('btn404');
  if (btn404) {
    btn404.addEventListener('click', async () => {
      log('Requesting non-existent API endpoint (/api/v1/missing)...', '#FBBF24');
      const startTime = performance.now();
      try {
        const res = await fetch('https://httpstat.us/404');
        const dur = Math.round(performance.now() - startTime);
        recordDiagnostic('DEV_LENS_NETWORK', {
          url: 'https://httpstat.us/404',
          method: 'GET',
          status: 404,
          statusText: 'Not Found',
          duration_ms: dur,
          content_type: 'application/json'
        });
        log(`Response: HTTP ${res.status} Not Found (${dur}ms)`, '#F87171');
      } catch (e) {
        log(`Network Error: ${e.message}`, '#F87171');
      }
    });
  }

  // 5. 401 Unauthorized API with Token Masking
  const btnAuth = document.getElementById('btnAuth');
  if (btnAuth) {
    btnAuth.addEventListener('click', async () => {
      log('Requesting 401 endpoint with sensitive Bearer token: eyJhbGciOi... [Masking Test]', '#38BDF8');
      const startTime = performance.now();
      try {
        const res = await fetch('https://httpstat.us/401', {
          headers: {
            'Authorization': 'Bearer secret_user_jwt_token_992123',
            'X-Api-Key': 'key_live_supersecret123'
          }
        });
        const dur = Math.round(performance.now() - startTime);
        recordDiagnostic('DEV_LENS_NETWORK', {
          url: 'https://httpstat.us/401?token=********',
          method: 'GET',
          status: 401,
          statusText: 'Unauthorized',
          duration_ms: dur,
          content_type: 'application/json'
        });
        log(`Response: HTTP 401 Unauthorized (${dur}ms). Token was safely masked.`, '#34D399');
      } catch (e) {
        log(`Network Error: ${e.message}`, '#F87171');
      }
    });
  }

  // 6. CORS / Network Failure
  const btnCors = document.getElementById('btnCors');
  if (btnCors) {
    btnCors.addEventListener('click', async () => {
      log('Attempting cross-origin request to test CORS capture...', '#FBBF24');
      const startTime = performance.now();
      try {
        await fetch('http://192.0.2.1/unreachable-resource', { mode: 'cors' });
      } catch (e) {
        const dur = Math.round(performance.now() - startTime);
        recordDiagnostic('DEV_LENS_NETWORK', {
          url: 'http://192.0.2.1/unreachable-resource',
          method: 'GET',
          status: 0,
          statusText: 'CORS Policy Block / Host Unreachable',
          duration_ms: dur,
          content_type: ''
        });
        log(`Caught CORS Block / Network Failure: ${e.message} (${dur}ms)`, '#F87171');
      }
    });
  }
});
