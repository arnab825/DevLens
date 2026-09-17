// DevLens Popup Controller
'use strict';

const BACKEND_URL = 'http://127.0.0.1:8000';
let isBackendOnline = false;

// Client fallback error analyzer if backend is offline
function clientAnalyzeError(message) {
  if (/Cannot read propert(y|ies) of (undefined|null)/i.test(message)) {
    return {
      type: "TypeError",
      category: "Null or Undefined Access",
      summary: "Attempted to access property on undefined/null value.",
      possible_causes: ["Asynchronous API data not ready", "Malformed object response"],
      suggested_checks: ["Use optional chaining `?.`", "Add conditional render check"]
    };
  }
  if (/is not defined/i.test(message)) {
    return {
      type: "ReferenceError",
      category: "Undeclared Identifier",
      summary: "Variable referenced before declaration or out of scope.",
      possible_causes: ["Missing import", "Typo in variable name"],
      suggested_checks: ["Verify import/declaration in file", "Check spelling"]
    };
  }
  return {
    type: "RuntimeError",
    category: "Unclassified Error",
    summary: message,
    possible_causes: ["Unexpected runtime error"],
    suggested_checks: ["Inspect call stack in console"]
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // Sync version dynamically from manifest.json
  try {
    const manifestVer = chrome.runtime?.getManifest()?.version;
    if (manifestVer) {
      document.querySelectorAll('.brand-version').forEach(el => {
        el.textContent = `v${manifestVer}`;
      });
    }
  } catch (e) {}

  initTabs();
  checkBackendHealth();
  loadData();
  setupEventListeners();
});

// 1. Health Check
async function checkBackendHealth() {
  const statusPill = document.getElementById('backendStatus');
  const label = statusPill.querySelector('.status-label');
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(400) });
    if (res.ok) {
      const data = await res.json();
      isBackendOnline = true;
      statusPill.className = 'backend-pill online';
      label.textContent = 'Backend: 8000';
      statusPill.title = `DevLens Engine v${data.version || '0.1.0'} connected. Click to check updates / reload.`;
      
      statusPill.style.cursor = 'pointer';
      statusPill.onclick = () => {
        chrome.runtime.reload();
      };
      return;
    }
  } catch (_) {
    // Backend offline or unreachable within 400ms
  }

  isBackendOnline = false;
  statusPill.className = 'backend-pill internal';
  label.textContent = 'Internal Engine';
  statusPill.title = 'DevLens Browser Engine Active: All diagnostics run client-side with zero setup.';
}

// 2. Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPanel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add('active');

      // Auto-analyze stack trace if user switches to Stack Trace tab and an error is available from active page
      if (btn.dataset.tab === 'stacktrace') {
        const stackInput = document.getElementById('stacktraceInput');
        const resBox = document.getElementById('stacktraceResult');
        if (stackInput && (!stackInput.value.trim() || resBox.classList.contains('hidden'))) {
          chrome.storage.local.get(['errors'], (res) => {
            const errs = (res.errors || []).filter(e => isMatchingHost(e.url, currentActiveHost));
            if (errs.length > 0 && errs[0].stack && !stackInput.value.trim()) {
              stackInput.value = errs[0].stack;
              handleParseStacktrace();
            }
          });
        }
      }
    });
  });
}

let activeScope = 'this_page'; // 'this_page' | 'all_history'
let currentActiveHost = '';

function isMatchingHost(urlStr, targetHost) {
  if (!urlStr || !targetHost) return false;
  try {
    const u = new URL(urlStr);
    return u.hostname === targetHost;
  } catch (_) {
    return urlStr.includes(targetHost);
  }
}

// 3. Load Captured Data
function loadData() {
  // If running inside Chrome DevTools Panel (F12), resolve via inspectedWindow
  if (chrome.devtools && chrome.devtools.inspectedWindow) {
    chrome.devtools.inspectedWindow.eval('window.location.href', (result, isException) => {
      if (!isException && result) {
        try {
          currentActiveHost = new URL(result).hostname;
          const domainEl = document.getElementById('currentDomain');
          if (domainEl) {
            domainEl.textContent = currentActiveHost || result;
            domainEl.title = result;
          }
        } catch (_) {}
      }
      processStorageDiagnostics();
    });
    return;
  }

  // Otherwise, running in Popup mode: resolve via chrome.tabs
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      let targetTab = tabs && tabs[0];
      if (!targetTab || !targetTab.url) {
        chrome.tabs.query({ active: true, currentWindow: true }, (fallbackTabs) => {
          applyTabInfo(fallbackTabs && fallbackTabs[0]);
        });
      } else {
        applyTabInfo(targetTab);
      }
    });
  } else {
    processStorageDiagnostics();
  }
}

function applyTabInfo(tab) {
  const domainEl = document.getElementById('currentDomain');
  if (tab && tab.url) {
    try {
      const urlObj = new URL(tab.url);
      currentActiveHost = urlObj.hostname;
      if (domainEl) {
        domainEl.textContent = currentActiveHost || tab.url;
        domainEl.title = tab.url;
      }
    } catch (_) {
      currentActiveHost = 'active-tab';
      if (domainEl) domainEl.textContent = 'Active Browser Tab';
    }
  } else {
    currentActiveHost = 'active-tab';
    if (domainEl) domainEl.textContent = 'Active Browser Tab';
  }
  processStorageDiagnostics();
}

function processStorageDiagnostics() {
  chrome.storage.local.get(['errors', 'network', 'page_profiles'], (res) => {
    const allErrors = res.errors || [];
    const allNetwork = res.network || [];
    const profiles = res.page_profiles || {};

    // 1. Render Detected Website Tech Profile
    const techContainer = document.getElementById('techPillsContainer');
    if (techContainer) {
      const activeProfile = profiles[currentActiveHost];
      let techStack = activeProfile ? activeProfile.tech_stack : null;
      
      // Fallback heuristics for common hosts if collector hasn't completed yet
      if (!techStack || techStack.length === 0) {
        techStack = [];
        if (currentActiveHost.includes('netlify.app')) techStack.push('React / Vite', 'Tailwind CSS', 'Hosted on Netlify');
        else if (currentActiveHost.includes('vercel.app')) techStack.push('Next.js', 'Vercel Edge');
        else if (currentActiveHost.includes('localhost') || currentActiveHost.includes('127.0.0.1')) techStack.push('Local Dev Server');
        else if (currentActiveHost.includes('sandbox')) techStack.push('DevLens Test Harness');
        else techStack.push('HTML5 / Web App', 'HTTPS');
      }

      techContainer.innerHTML = techStack.map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('');
    }

    // 2. Filter errors & network based on activeScope
    let displayErrors = allErrors;
    let displayNetwork = allNetwork;

    if (activeScope === 'this_page' && currentActiveHost) {
      displayErrors = allErrors.filter(e => isMatchingHost(e.url, currentActiveHost));
      displayNetwork = allNetwork.filter(n => isMatchingHost(n.page_url || n.url, currentActiveHost));
    }

    // 3. Update Telemetry Bar
    const statErr = document.getElementById('statErrorsCount');
    const statNet = document.getElementById('statNetworkCount');
    const healthBadge = document.getElementById('healthBadge');
    
    if (statErr) statErr.textContent = `${displayErrors.length} Error${displayErrors.length === 1 ? '' : 's'}`;
    if (statNet) statNet.textContent = `${displayNetwork.length} Issue${displayNetwork.length === 1 ? '' : 's'}`;
    
    if (healthBadge) {
      if (displayErrors.length === 0 && displayNetwork.length === 0) {
        healthBadge.className = 'health-pill clean';
        healthBadge.textContent = '100% Clean';
      } else {
        healthBadge.className = 'health-pill warn';
        healthBadge.textContent = `Needs Attention (${displayErrors.length + displayNetwork.length})`;
      }
    }

    renderErrors(displayErrors);
    renderNetwork(displayNetwork);
  });
}

function renderErrors(errors) {
  const badge = document.getElementById('badgeErrors');
  const list = document.getElementById('errorsList');
  badge.textContent = errors.length;

  if (errors.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✓</div>
        <div class="empty-title">All Systems Normal</div>
        <p>No uncaught runtime errors or exceptions on this page.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  errors.forEach(err => {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const countBadge = err.count > 1 ? `<span class="badge-tag badge-status">×${err.count}</span>` : '';
    const loc = err.source_file ? `${err.source_file.split('/').pop()}:${err.line}` : 'Inline';

    card.innerHTML = `
      <div class="item-header">
        <span class="badge-tag badge-error">Error</span>
        ${countBadge}
      </div>
      <div class="item-title">${escapeHtml(err.message)}</div>
      <div class="item-meta">
        <span>📍 ${escapeHtml(loc)}</span>
        <button class="btn-mini analyze-err-btn">Analyze</button>
      </div>
    `;

    card.querySelector('.analyze-err-btn').addEventListener('click', () => triggerErrorAnalysis(err));
    list.appendChild(card);
  });
}

function renderNetwork(network) {
  const badge = document.getElementById('badgeNetwork');
  const list = document.getElementById('networkList');
  badge.textContent = network.length;

  if (network.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚡</div>
        <div class="empty-title">Zero API Failures</div>
        <p>Monitored fetch and XHR calls are completing successfully.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  network.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const isFailure = item.status >= 400 || item.status === 0;
    const statusText = item.status === 0 ? 'CORS/FAIL' : item.status;
    const badgeClass = isFailure ? 'badge-status red' : 'badge-status';
    const cleanUrl = item.url.replace(/^https?:\/\/[^\/]+/, '');

    card.innerHTML = `
      <div class="item-header">
        <span class="badge-tag ${badgeClass}">${item.method} ${statusText}</span>
        <span style="font-size:11px;color:var(--text-muted)">${item.duration_ms}ms</span>
      </div>
      <div class="item-title">${escapeHtml(cleanUrl || item.url)}</div>
      <div class="item-meta">
        <span style="font-size:10px;color:var(--text-muted)">${new Date(item.timestamp).toLocaleTimeString()}</span>
        <button class="btn-mini analyze-net-btn">Inspect</button>
      </div>
    `;

    card.querySelector('.analyze-net-btn').addEventListener('click', () => triggerNetworkAnalysis(item));
    list.appendChild(card);
  });
}

// 4. Analysis Handlers
async function triggerErrorAnalysis(err) {
  openDrawer('Analyzing Error...');
  let analysis = null;

  if (isBackendOnline) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: err.message,
          stack: err.stack || '',
          url: err.url || '',
          source_file: err.source_file || '',
          line: err.line || 0
        })
      });
      analysis = await res.json();
    } catch (_) {}
  }

  if (!analysis && typeof InternalEngine !== 'undefined') {
    analysis = InternalEngine.analyzeError(err.message, err.stack);
  }

  displayAnalysisResult(err.message, analysis || clientAnalyzeError(err.message));
}

async function triggerNetworkAnalysis(item) {
  openDrawer(`Network: ${item.method} ${item.status}`);
  let analysis = null;

  if (isBackendOnline) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: item.method,
          url: item.url,
          status: item.status,
          duration_ms: item.duration_ms
        })
      });
      analysis = await res.json();
    } catch (_) {}
  }

  if (!analysis && typeof InternalEngine !== 'undefined') {
    analysis = InternalEngine.analyzeNetwork(item.method, item.url, item.status, item.duration_ms);
  }

  displayAnalysisResult(item.url, analysis || {
    category: `HTTP ${item.status}`,
    summary: `Request completed with status ${item.status}`,
    possible_causes: ["Target endpoint returned error or was blocked."],
    suggested_checks: ["Inspect server logs and request headers."]
  });
}

function displayAnalysisResult(title, analysis) {
  const body = document.getElementById('drawerBody');
  const drawerTitle = document.getElementById('drawerTitle');
  drawerTitle.textContent = analysis.category || 'Diagnostic Result';

  const causesHtml = (analysis.possible_causes || [])
    .map(c => `<li>• ${escapeHtml(c)}</li>`).join('');

  const suggestionsHtml = (analysis.suggested_checks || [])
    .map((s, i) => `<li><strong>${i+1}.</strong> ${escapeHtml(s)}</li>`).join('');

  body.innerHTML = `
    <div class="result-row">
      <div class="result-label">Identified Category</div>
      <div class="result-text" style="color:var(--accent-blue);font-weight:600;">${escapeHtml(analysis.category || analysis.type || 'Error')}</div>
    </div>
    <div class="result-row" style="margin-top:8px;">
      <div class="result-label">Explanation</div>
      <div class="result-text">${escapeHtml(analysis.summary || title)}</div>
    </div>
    <div class="result-row" style="margin-top:12px;">
      <div class="result-label">Probable Causes</div>
      <ul class="checklist" style="color:var(--text-secondary)">${causesHtml}</ul>
    </div>
    <div class="result-row" style="margin-top:12px;">
      <div class="result-label">Recommended Remediation Checks</div>
      <ul class="checklist" style="color:var(--text-primary)">${suggestionsHtml}</ul>
    </div>
  `;
}

function openDrawer(title) {
  const drawer = document.getElementById('diagDrawer');
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('drawerBody').innerHTML = '<p style="color:var(--text-muted);font-size:12px;">Analyzing diagnostics...</p>';
  drawer.classList.remove('hidden');
}

// 5. Stack Trace Parser Tab
async function handleParseStacktrace() {
  const trace = document.getElementById('stacktraceInput').value.trim();
  const resBox = document.getElementById('stacktraceResult');
  if (!trace) return;

  resBox.classList.remove('hidden');
  resBox.innerHTML = '<p style="color:var(--text-muted)">Parsing frames...</p>';

  let data = null;
  if (isBackendOnline) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/stacktrace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_trace: trace })
      });
      data = await res.json();
    } catch (_) {}
  }

  // Fallback seamlessly to native internal browser engine
  if (!data && typeof InternalEngine !== 'undefined') {
    data = InternalEngine.parseStacktrace(trace);
  }

  if (data) {
    let framesHtml = (data.frames || []).map(f => `
      <div style="font-family:var(--font-mono);font-size:11px;padding:4px 0;border-bottom:1px solid var(--border-color);">
        <span style="color:var(--accent-blue)">${escapeHtml(f.function || 'anonymous')}</span>
        <span style="color:var(--text-muted)"> at ${escapeHtml(f.file)}:${f.line || 0}</span>
      </div>
    `).join('');

    resBox.innerHTML = `
      <div class="result-row">
        <div class="result-label">Language: ${data.language.toUpperCase()} | Exception: ${escapeHtml(data.exception_type)}</div>
        <div class="result-text" style="font-weight:600;margin-top:2px;">${escapeHtml(data.message)}</div>
      </div>
      <div class="result-row" style="margin-top:8px;">
        <div class="result-label">Root Origin Frame</div>
        <div class="result-text" style="color:var(--accent-green)">${escapeHtml(data.root_cause_hint)}</div>
      </div>
      <div class="result-row" style="margin-top:8px;">
        <div class="result-label">Call Stack (${data.total_frames} frames)</div>
        <div style="max-height:160px;overflow-y:auto;margin-top:4px;">${framesHtml}</div>
      </div>
    `;
  } else {
    resBox.innerHTML = `<p style="color:var(--accent-red)">Unable to parse stack trace format.</p>`;
  }
}

// 6. GitHub Analyzer Tab
async function handleAnalyzeGithub() {
  const inputEl = document.getElementById('githubRepoInput');
  const resBox = document.getElementById('githubResult');
  let repoInput = inputEl ? inputEl.value.trim() : '';

  // If empty, auto-detect from active tab or page profile
  if (!repoInput) {
    chrome.storage.local.get(['page_profiles'], (res) => {
      const profiles = res.page_profiles || {};
      const activeProf = profiles[currentActiveHost];
      let detected = activeProf ? activeProf.github_repo : '';

      if (!detected && currentActiveHost === 'github.com') {
        if (chrome.tabs && chrome.tabs.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
              const parts = new URL(tabs[0].url).pathname.split('/').filter(Boolean);
              if (parts.length >= 2) detected = `${parts[0]}/${parts[1]}`;
            }
            executeGithubAudit(detected || 'facebook/react');
          });
          return;
        }
      }

      executeGithubAudit(detected || 'facebook/react');
    });
    return;
  }

  executeGithubAudit(repoInput);
}

async function executeGithubAudit(repoSlug) {
  const inputEl = document.getElementById('githubRepoInput');
  const resBox = document.getElementById('githubResult');
  if (inputEl) inputEl.value = repoSlug;
  if (!resBox) return;

  resBox.classList.remove('hidden');
  resBox.innerHTML = '<p style="color:var(--text-muted);font-size:11px;">Auditing repository structure & ecosystem...</p>';

  try {
    const res = await fetch(`${BACKEND_URL}/api/github/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repoSlug })
    });
    const data = await res.json();
    if (data.detail) throw new Error(data.detail);

    // Language pills
    const langPills = (data.languages || []).map(l => 
      `<span style="background:rgba(56,189,248,0.15);color:var(--accent-blue);font-size:10px;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);">${escapeHtml(l.name)}: ${l.percentage}%</span>`
    ).join(' ');

    const checksHtml = (data.checks || []).map(c => `
      <li class="${c.passed ? 'pass' : 'fail'}" style="padding:2px 0;">
        ${c.passed ? '✓' : '✗'} <strong>${escapeHtml(c.name)}</strong>: <span style="color:var(--text-secondary)">${escapeHtml(c.detail)}</span>
      </li>
    `).join('');

    const strengthsHtml = (data.strengths || []).map(s => 
      `<li style="color:var(--accent-green)">+ ${escapeHtml(s)}</li>`
    ).join('');

    const recsHtml = (data.recommendations || []).map(r => 
      `<li style="color:var(--accent-amber)">! ${escapeHtml(r)}</li>`
    ).join('');

    resBox.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <strong style="font-size:13px;color:#fff;">${escapeHtml(data.full_name || repoInput)}</strong>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">★ ${data.stars ? data.stars.toLocaleString() : 0} stars | Branch: ${escapeHtml(data.default_branch)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:800;color:${data.health_score >= 80 ? 'var(--accent-green)' : (data.health_score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)')};">${data.health_score}%</div>
          <div style="font-size:9px;color:var(--text-muted);font-weight:700;">HEALTH SCORE</div>
        </div>
      </div>

      <!-- Detected Stack & Languages -->
      <div style="margin-top:8px;padding:6px 8px;background:rgba(15,23,42,0.6);border-radius:6px;border:1px solid var(--border-color);">
        <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Detected Tech Stack: <span style="color:#fff;">${escapeHtml(data.ecosystem || data.primary_language)}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${langPills || '<span style="font-size:10px;color:var(--text-muted)">Single language</span>'}</div>
      </div>

      <!-- AI Diagnostic Assessment -->
      <div style="margin-top:8px;padding:8px;background:rgba(30,41,59,0.5);border-left:3px solid var(--accent-blue);border-radius:4px;">
        <div style="font-size:10px;color:var(--accent-blue);font-weight:700;text-transform:uppercase;margin-bottom:3px;">AI Architectural Verdict</div>
        <div style="font-size:11px;color:var(--text-primary);line-height:1.4;">${escapeHtml(data.ai_verdict).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
      </div>

      <!-- Strengths & Recommendations -->
      ${strengthsHtml || recsHtml ? `
      <div style="margin-top:8px;">
        <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:2px;">Key Findings & Advice</div>
        <ul class="checklist" style="font-size:11px;">
          ${strengthsHtml}
          ${recsHtml}
        </ul>
      </div>
      ` : ''}

      <!-- Detailed Verification Checklist -->
      <div style="margin-top:8px;border-top:1px solid var(--border-color);padding-top:6px;">
        <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Ecosystem Standard Checks</div>
        <ul class="checklist">${checksHtml}</ul>
      </div>
    `;
  } catch (err) {
    resBox.innerHTML = `<p style="color:var(--accent-red)">${escapeHtml(err.message)}</p>`;
  }
}

// 7. Report Generation & Session Clearing
function setupEventListeners() {
  document.getElementById('closeDrawerBtn').addEventListener('click', () => {
    document.getElementById('diagDrawer').classList.add('hidden');
  });

  document.getElementById('parseStacktraceBtn').addEventListener('click', handleParseStacktrace);
  document.getElementById('analyzeGithubBtn').addEventListener('click', handleAnalyzeGithub);

  document.getElementById('clearErrorsBtn').addEventListener('click', clearErrors);
  document.getElementById('clearNetworkBtn').addEventListener('click', clearNetwork);
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);

  document.getElementById('exportMdBtn').addEventListener('click', exportMarkdown);
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);

  // Copy Report to Clipboard
  const copyBtn = document.getElementById('copyReportBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('reportPreview').textContent;
      if (!text || text.startsWith('Click \'Export')) return;
      navigator.clipboard.writeText(text).then(() => {
        const copyTextEl = document.getElementById('copyBtnText');
        copyBtn.classList.add('copied');
        if (copyTextEl) copyTextEl.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (copyTextEl) copyTextEl.textContent = 'Copy';
        }, 1500);
      });
    });
  }

  // Scope Switcher (This Page vs All History)
  const btnScopeThis = document.getElementById('scopeThisPage');
  const btnScopeAll = document.getElementById('scopeAllHistory');
  if (btnScopeThis && btnScopeAll) {
    btnScopeThis.addEventListener('click', () => {
      activeScope = 'this_page';
      btnScopeThis.classList.add('active');
      btnScopeAll.classList.remove('active');
      loadData();
    });
    btnScopeAll.addEventListener('click', () => {
      activeScope = 'all_history';
      btnScopeAll.classList.add('active');
      btnScopeThis.classList.remove('active');
      loadData();
    });
  }

  // Open Sandbox in new tab
  const sandboxBtn = document.getElementById('openSandboxBtn');
  if (sandboxBtn) {
    sandboxBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('sandbox/index.html') });
    });
  }

  // Quick Demo Error Simulator
  const demoTriggerBtn = document.getElementById('demoTriggerBtn');
  if (demoTriggerBtn) {
    demoTriggerBtn.addEventListener('click', () => {
      const sampleErr = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        url: 'https://example.com/user/profile',
        message: "TypeError: Cannot read properties of undefined (reading 'avatar')",
        source_file: "UserProfile.jsx",
        line: 42,
        col: 15,
        stack: "TypeError: Cannot read properties of undefined (reading 'avatar')\n    at UserProfile (UserProfile.jsx:42:15)\n    at renderWithHooks (react-dom.js:14985:18)",
        count: 1
      };
      chrome.storage.local.get(['errors'], (res) => {
        const errors = res.errors || [];
        errors.unshift(sampleErr);
        chrome.storage.local.set({ errors }, () => {
          loadData();
          triggerErrorAnalysis(sampleErr);
        });
      });
    });
  }

  // Quick Demo Network Simulator
  const demoNetworkBtn = document.getElementById('demoNetworkBtn');
  if (demoNetworkBtn) {
    demoNetworkBtn.addEventListener('click', () => {
      const sampleNet = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        page_url: 'https://example.com/api/v1/auth/user',
        url: 'https://example.com/api/v1/auth/user',
        method: 'POST',
        status: 401,
        statusText: 'Unauthorized',
        duration_ms: 184,
        content_type: 'application/json'
      };
      chrome.storage.local.get(['network'], (res) => {
        const network = res.network || [];
        network.unshift(sampleNet);
        chrome.storage.local.set({ network }, () => {
          loadData();
          // Switch to network tab
          document.querySelector('[data-tab="network"]').click();
          triggerNetworkAnalysis(sampleNet);
        });
      });
    });
  }

  // Stack Trace Presets & Automatic Analysis
  const stackInput = document.getElementById('stacktraceInput');
  if (stackInput) {
    // Auto-analyze immediately upon paste
    stackInput.addEventListener('paste', () => {
      setTimeout(() => {
        if (stackInput.value.trim().length > 15) {
          handleParseStacktrace();
        }
      }, 50);
    });

    // Auto-analyze with 600ms debounce on input/typing
    let debounceTimer = null;
    stackInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (stackInput.value.trim().length > 25) {
          handleParseStacktrace();
        }
      }, 600);
    });
  }
}

function clearErrors() {
  chrome.storage.local.set({ errors: [] }, () => {
    chrome.action.setBadgeText({ text: '' });
    loadData();
  });
}

function clearNetwork() {
  chrome.storage.local.set({ network: [] }, () => loadData());
}

function clearAll() {
  chrome.runtime.sendMessage({ type: 'DEV_LENS_CLEAR' }, () => {
    loadData();
    document.getElementById('reportPreview').textContent = 'Session data cleared.';
  });
}

function generateReportData(callback) {
  chrome.storage.local.get(['errors', 'network'], (res) => {
    const errors = res.errors || [];
    const network = res.network || [];
    callback({ errors, network });
  });
}

function exportMarkdown() {
  generateReportData(({ errors, network }) => {
    const md = `# DevLens Diagnostic Report
Generated: ${new Date().toLocaleString()}

## Overview
- **Runtime Errors**: ${errors.length}
- **Network Anomalies**: ${network.length}

## Console Errors
${errors.length === 0 ? '_No runtime errors recorded._' : errors.map((e, idx) => `
### ${idx + 1}. ${e.message}
- **Location**: \`${e.source_file}:${e.line}\`
- **Count**: ${e.count || 1}
- **Timestamp**: ${e.timestamp}
\`\`\`text
${e.stack || 'No stack trace available'}
\`\`\`
`).join('\n')}

## Network Activity
${network.length === 0 ? '_No network issues recorded._' : network.map((n, idx) => `
### ${idx + 1}. [${n.method}] ${n.status} - \`${n.url}\`
- **Duration**: ${n.duration_ms}ms
- **Timestamp**: ${n.timestamp}
`).join('\n')}
`;

    document.getElementById('reportPreview').textContent = md;
    downloadFile('devlens-report.md', md, 'text/markdown');
  });
}

function exportJson() {
  generateReportData((data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    document.getElementById('reportPreview').textContent = jsonStr;
    downloadFile('devlens-report.json', jsonStr, 'application/json');
  });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
