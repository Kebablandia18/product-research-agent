let currentData = null;

// ── Utilities ─────────────────────────────────────────────────────────────────

function setExample(text) {
  document.getElementById('productInput').value = text;
  document.getElementById('productInput').focus();
}

function scrollToTop() {
  document.getElementById('reportSection').classList.add('hidden');
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
}

function exportJSON() {
  if (!currentData) return;
  const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `argus-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  const banner = document.getElementById('errorBanner');
  banner.classList.remove('hidden');
  setTimeout(hideError, 8000);
}
function hideError() {
  document.getElementById('errorBanner').classList.add('hidden');
}

function badge(level, text) {
  const cls = `badge badge-${(level || '').toLowerCase()}`;
  return `<span class="${cls}">${escHtml(text || level)}</span>`;
}

function pill(text) {
  return `<span class="pill">${escHtml(text)}</span>`;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function checkIcon(color) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`;
}

function ul(items, color = 'var(--accent)') {
  if (!Array.isArray(items) || !items.length) return '<p style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">None listed.</p>';
  return `<ul class="check-list">${items.map(i => `<li>${checkIcon(color)}<span>${escHtml(i)}</span></li>`).join('')}</ul>`;
}

function sectionTitle(title, subtitle = '') {
  return `<div style="margin-bottom:1.5rem;">
    <h3 class="section-title">${escHtml(title)}</h3>
    ${subtitle ? `<p class="section-subtitle">${escHtml(subtitle)}</p>` : ''}
  </div>`;
}

function card(content) {
  return `<div class="content-card">${content}</div>`;
}

// ── Tab switching ──────────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`tab-${name}`);
  const btn   = document.querySelector(`[data-tab="${name}"]`);
  if (panel) panel.classList.remove('hidden');
  if (btn)   btn.classList.add('active');
}

// ── Normalise keys ────────────────────────────────────────────────────────────

function normalise(data) {
  const get = (obj, ...keys) => { for (const k of keys) if (obj?.[k] !== undefined) return obj[k]; return undefined; };
  return {
    product:                get(data, 'product'),
    analysisDate:           get(data, 'analysisDate', 'analysis_date'),
    marketOverview:         get(data, 'marketOverview', 'market_overview'),
    competitors:            get(data, 'competitors') ?? [],
    targetSegments:         get(data, 'targetSegments', 'target_segments') ?? [],
    marketTrends:           get(data, 'marketTrends', 'market_trends') ?? [],
    opportunityGaps:        get(data, 'opportunityGaps', 'opportunity_gaps') ?? [],
    strategicRecommendations: get(data, 'strategicRecommendations', 'strategic_recommendations') ?? [],
    swotAnalysis:           get(data, 'swotAnalysis', 'swot_analysis', 'swot'),
    _amazonDataUsed:        !!data._amazonDataUsed,
  };
}

// ── Main research function ─────────────────────────────────────────────────────

async function runResearch() {
  const product = document.getElementById('productInput').value.trim();
  if (!product) { showError('Please describe your product or market first.'); return; }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;

  const loading = document.getElementById('loadingState');
  loading.classList.remove('hidden');

  const steps = [
    ['Scanning Amazon marketplace...', 'Finding competing products'],
    ['Extracting product data...', 'Gathering pricing, ratings & features'],
    ['Analyzing customer reviews...', 'Identifying pain points and sentiment'],
    ['Mapping opportunities...', 'Spotting gaps and underserved niches'],
    ['Synthesizing intelligence...', 'Building competitive analysis'],
    ['Compiling report...', 'Almost done'],
  ];
  let step = 0;
  const bar = document.getElementById('progressBar');
  const interval = setInterval(() => {
    if (step < steps.length) {
      document.getElementById('loadingMsg').textContent    = steps[step][0];
      document.getElementById('loadingSubMsg').textContent = steps[step][1];
      bar.style.width = `${Math.round(((step + 1) / steps.length) * 85)}%`;
      step++;
    }
  }, 900);

  try {
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });

    clearInterval(interval);
    bar.style.width = '100%';

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const raw = await res.json();
    console.log('API response:', raw);
    currentData = raw;

    const data = normalise(raw);

    await new Promise(r => setTimeout(r, 400));
    loading.classList.add('hidden');

    const section = document.getElementById('reportSection');
    section.classList.remove('hidden');

    renderReport(data);
    section.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    clearInterval(interval);
    loading.classList.add('hidden');
    console.error('Research error:', err);
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
    bar.style.width = '0%';
  }
}

// ── Render orchestrator ────────────────────────────────────────────────────────

function renderReport(data) {
  document.getElementById('reportTitle').textContent = data.product || 'Market Analysis';

  const dateStr = new Date(data.analysisDate || Date.now()).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const webBadge = data._amazonDataUsed
    ? ` <span class="amazon-badge">LIVE DATA</span>`
    : '';
  document.getElementById('reportDate').innerHTML = escHtml(dateStr) + webBadge;

  try { renderOverviewCards(data.marketOverview, data.competitors?.length ?? 0); } catch(e) { console.error('Overview render error:', e); }
  try { renderCompetitors(data.competitors); }                                    catch(e) { console.error('Competitors render error:', e); }
  try { renderSegments(data.targetSegments); }                                    catch(e) { console.error('Segments render error:', e); }
  try { renderTrends(data.marketTrends); }                                        catch(e) { console.error('Trends render error:', e); }
  try { renderGaps(data.opportunityGaps); }                                       catch(e) { console.error('Gaps render error:', e); }
  try { renderSwot(data.swotAnalysis); }                                          catch(e) { console.error('SWOT render error:', e); }
  try { renderStrategy(data.strategicRecommendations); }                          catch(e) { console.error('Strategy render error:', e); }

  switchTab('competitors');
}

// ── Overview cards ─────────────────────────────────────────────────────────────

function renderOverviewCards(overview, competitorCount) {
  const mo = overview || {};
  const cards = [
    { label: 'Market Size',       value: mo.marketSize   || mo.market_size   || '—', icon: '💰' },
    { label: 'Growth Rate',       value: mo.growthRate   || mo.growth_rate   || '—', icon: '📈' },
    { label: 'Maturity Stage',    value: mo.maturityStage|| mo.maturity_stage|| '—', icon: '🎯' },
    { label: 'Competitors Found', value: String(competitorCount),                    icon: '🏢' },
  ];

  document.getElementById('overviewCards').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-icon">${c.icon}</div>
      <p class="stat-label mono">${c.label}</p>
      <p class="stat-value">${escHtml(c.value)}</p>
    </div>
  `).join('');

  const summary = mo.summary;
  const wrap = document.getElementById('overviewSummaryWrap');
  if (summary) {
    wrap.innerHTML = `
      <div class="content-card" style="margin-bottom:2rem;">
        <p class="mono" style="font-size:0.65rem;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Market Overview</p>
        <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;">${escHtml(summary)}</p>
      </div>`;
  } else {
    wrap.innerHTML = '';
  }
}

// ── Competitors ────────────────────────────────────────────────────────────────

function renderCompetitors(competitors) {
  const el = document.getElementById('tab-competitors');
  if (!competitors?.length) { el.innerHTML = empty('No competitor data available.'); return; }

  el.innerHTML = sectionTitle('Competitive Landscape', `${competitors.length} key competitors identified`) +
    `<div style="display:flex;flex-direction:column;gap:1rem;">` +
    competitors.map(c => card(`
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="avatar">${escHtml((c.name || '?')[0].toUpperCase())}</div>
          <div>
            <h4 style="font-weight:700;color:var(--text-primary);margin:0 0 2px 0;">${escHtml(c.name || 'Unknown')}</h4>
            <p class="mono" style="font-size:0.7rem;color:var(--text-muted);margin:0;">${escHtml(c.targetSegment || c.target_segment || '')}</p>
          </div>
        </div>
        <div style="text-align:right;">
          <p class="mono" style="font-size:0.6rem;color:var(--text-muted);text-transform:uppercase;margin:0 0 2px 0;">Pricing</p>
          <p style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin:0;">${escHtml(c.pricingModel || c.pricing_model || '—')}</p>
        </div>
      </div>

      <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 1rem 0;">${escHtml(c.positioning || '')}</p>

      ${(c.keyFeatures || c.key_features)?.length ? `
        <div style="margin-bottom:1rem;">
          <p class="mono" style="font-size:0.6rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem 0;">Key Features</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.375rem;">
            ${(c.keyFeatures || c.key_features).map(f => pill(f)).join('')}
          </div>
        </div>` : ''}

      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div>
          <p class="mono" style="font-size:0.6rem;font-weight:600;color:var(--success);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem 0;">Strengths</p>
          ${ul(c.strengths, 'var(--success)')}
        </div>
        <div>
          <p class="mono" style="font-size:0.6rem;font-weight:600;color:var(--error);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem 0;">Weaknesses</p>
          ${ul(c.weaknesses, 'var(--error)')}
        </div>
      </div>
    `)).join('') + `</div>`;
}

// ── Target Segments ────────────────────────────────────────────────────────────

function renderSegments(segments) {
  const el = document.getElementById('tab-segments');
  if (!segments?.length) { el.innerHTML = empty('No segment data available.'); return; }

  el.innerHTML = sectionTitle('Target Market Segments', 'Primary audiences and their needs') +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">` +
    segments.map(s => card(`
      <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:0.75rem;">
        <div class="avatar" style="font-size:0.75rem;">${escHtml((s.segment || '?')[0].toUpperCase())}</div>
        <h4 style="font-weight:700;color:var(--text-primary);margin:0;">${escHtml(s.segment || 'Segment')}</h4>
      </div>
      <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 1rem 0;">${escHtml(s.description || '')}</p>
      ${(s.painPoints || s.pain_points)?.length ? `
        <div style="margin-bottom:0.75rem;">
          <p class="mono" style="font-size:0.6rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem 0;">Pain Points</p>
          <ul class="check-list">
            ${(s.painPoints || s.pain_points).map(p => `<li><span style="color:var(--warning);">⚡</span><span>${escHtml(p)}</span></li>`).join('')}
          </ul>
        </div>` : ''}
      ${s.willingnessToPay || s.willingness_to_pay ? `
        <div class="divider"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="mono" style="font-size:0.65rem;color:var(--text-muted);">Willingness to Pay</span>
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">${escHtml(s.willingnessToPay || s.willingness_to_pay)}</span>
        </div>` : ''}
    `)).join('') + `</div>`;
}

// ── Trends ─────────────────────────────────────────────────────────────────────

function renderTrends(trends) {
  const el = document.getElementById('tab-trends');
  if (!trends?.length) { el.innerHTML = empty('No trend data available.'); return; }

  const impactIcon = { high: '🔥', medium: '📊', low: '💡' };

  el.innerHTML = sectionTitle('Market Trends', 'Forces shaping the competitive landscape') +
    `<div style="display:flex;flex-direction:column;gap:0.75rem;">` +
    trends.map(t => {
      const imp = (t.impact || '').toLowerCase();
      return card(`
        <div style="display:flex;gap:1rem;align-items:flex-start;">
          <div class="avatar" style="font-size:1rem;">${impactIcon[imp] || '📌'}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;flex-wrap:wrap;">
              <h4 style="font-weight:700;color:var(--text-primary);margin:0;">${escHtml(t.trend || '')}</h4>
              ${badge(t.impact, `${cap(t.impact)} Impact`)}
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${escHtml(t.description || '')}</p>
          </div>
        </div>
      `);
    }).join('') + `</div>`;
}

// ── Opportunity Gaps ───────────────────────────────────────────────────────────

function renderGaps(gaps) {
  const el = document.getElementById('tab-gaps');
  if (!gaps?.length) { el.innerHTML = empty('No opportunity data available.'); return; }

  el.innerHTML = sectionTitle('Opportunity Gaps', 'Underserved needs and white spaces') +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">` +
    gaps.map((g, i) => card(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;gap:0.5rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div class="avatar" style="width:1.5rem;height:1.5rem;font-size:0.7rem;border-radius:50%;">${i+1}</div>
          <h4 style="font-weight:700;color:var(--text-primary);margin:0;">${escHtml(g.gap || '')}</h4>
        </div>
        ${badge(g.difficulty, `${cap(g.difficulty)} Difficulty`)}
      </div>
      <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${escHtml(g.rationale || '')}</p>
    `)).join('') + `</div>`;
}

// ── SWOT ───────────────────────────────────────────────────────────────────────

function renderSwot(swot) {
  const el = document.getElementById('tab-swot');
  if (!swot) { el.innerHTML = empty('No SWOT data available.'); return; }

  const quadrants = [
    { key: 'strengths',     label: 'Strengths',     icon: '💪', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.15)', head: 'var(--success)', check: 'var(--success)' },
    { key: 'weaknesses',    label: 'Weaknesses',    icon: '⚠️', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', head: 'var(--error)', check: 'var(--error)' },
    { key: 'opportunities', label: 'Opportunities', icon: '🚀', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.15)', head: '#60a5fa', check: '#60a5fa' },
    { key: 'threats',       label: 'Threats',       icon: '🛡️', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.15)', head: 'var(--warning)', check: 'var(--warning)' },
  ];

  el.innerHTML = sectionTitle('SWOT Analysis', 'Strategic position assessment') +
    `<div class="swot-grid">` +
    quadrants.map(q => `
      <div class="swot-quad" style="background:${q.bg};border:1px solid ${q.border};">
        <h4 style="color:${q.head};">${q.icon} ${q.label}</h4>
        ${ul(swot[q.key], q.check)}
      </div>`).join('') + `</div>`;
}

// ── Strategy ───────────────────────────────────────────────────────────────────

function renderStrategy(recs) {
  const el = document.getElementById('tab-strategy');
  if (!recs?.length) { el.innerHTML = empty('No recommendations available.'); return; }

  const order = { high: 0, medium: 1, low: 2 };
  const sorted = [...recs].sort((a, b) =>
    (order[(a.priority||'').toLowerCase()] ?? 3) - (order[(b.priority||'').toLowerCase()] ?? 3)
  );

  el.innerHTML = sectionTitle('Strategic Recommendations', 'Prioritized action plan based on market analysis') +
    `<div style="display:flex;flex-direction:column;gap:0.75rem;">` +
    sorted.map((r, i) => {
      return card(`
        <div style="display:flex;gap:1rem;">
          <div class="avatar">${i + 1}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;margin-bottom:0.5rem;flex-wrap:wrap;">
              <h4 style="font-weight:700;color:var(--text-primary);margin:0;">${escHtml(r.recommendation || '')}</h4>
              ${badge(r.priority, `${cap(r.priority)} Priority`)}
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${escHtml(r.rationale || '')}</p>
          </div>
        </div>
      `);
    }).join('') + `</div>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function empty(msg) {
  return `<p style="color:var(--text-muted);font-style:italic;font-size:0.8rem;">${msg}</p>`;
}

// ── Keyboard shortcut ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runResearch();
});
