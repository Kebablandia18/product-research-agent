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
  a.download = `market-research-${Date.now()}.json`;
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
  const map = {
    high:     'background:#fee2e2;color:#b91c1c',
    medium:   'background:#fef3c7;color:#92400e',
    low:      'background:#d1fae5;color:#065f46',
    emerging: 'background:#dbeafe;color:#1e40af',
    growing:  'background:#d1fae5;color:#065f46',
    mature:   'background:#f1f5f9;color:#475569',
    declining:'background:#fee2e2;color:#b91c1c',
  };
  const style = map[(level || '').toLowerCase()] || 'background:#f3f4f6;color:#374151';
  return `<span style="${style};display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:0.75rem;font-weight:600;">${escHtml(text || level)}</span>`;
}

function pill(text, bgColor = '#eff6ff', textColor = '#1d4ed8') {
  return `<span style="display:inline-block;font-size:0.75rem;font-weight:500;padding:2px 8px;border-radius:6px;background:${bgColor};color:${textColor};">${escHtml(text)}</span>`;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ul(items, checkColor = '#6366f1') {
  if (!Array.isArray(items) || !items.length) return '<p style="font-size:0.875rem;color:#9ca3af;font-style:italic;">None listed.</p>';
  return `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px;">
    ${items.map(i => `
      <li style="display:flex;align-items:flex-start;gap:8px;font-size:0.875rem;color:#374151;">
        <svg style="width:14px;height:14px;margin-top:2px;flex-shrink:0;color:${checkColor}" fill="none" stroke="${checkColor}" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${escHtml(i)}</span>
      </li>`).join('')}
  </ul>`;
}

function sectionTitle(title, subtitle = '') {
  return `<div style="margin-bottom:1.5rem;">
    <h3 style="font-size:1.25rem;font-weight:700;color:#111827;margin:0 0 4px 0;">${escHtml(title)}</h3>
    ${subtitle ? `<p style="font-size:0.875rem;color:#6b7280;margin:0;">${escHtml(subtitle)}</p>` : ''}
  </div>`;
}

function card(content, extraStyle = '') {
  return `<div style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;transition:transform 0.2s,box-shadow 0.2s;${extraStyle}">${content}</div>`;
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

// ── Normalise keys (handles snake_case or camelCase from model) ───────────────

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
    ['Searching Amazon...', 'Finding competing products in the marketplace'],
    ['Fetching product details...', 'Gathering pricing, ratings & features'],
    ['Reading customer reviews...', 'Identifying pain points and sentiment'],
    ['Finding market opportunities...', 'Spotting gaps and underserved niches'],
    ['Building strategic insights...', 'Synthesizing competitive intelligence'],
    ['Finalizing report...', 'Almost done'],
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

    // Show section FIRST so Tailwind CDN can process dynamic classes
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

  const dateStr = `Generated on ${new Date(data.analysisDate || Date.now()).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`;
  const webBadge = data._amazonDataUsed
    ? ` &nbsp;<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.7rem;font-weight:600;background:#fff7ed;color:#c2410c;padding:2px 8px;border-radius:9999px;vertical-align:middle;border:1px solid #fed7aa;">` +
      `<span style="font-size:0.65rem;">📦</span>Live Amazon Data</span>`
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
    { label: 'Market Size',       value: mo.marketSize   || mo.market_size   || '—', icon: '💰', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Growth Rate',       value: mo.growthRate   || mo.growth_rate   || '—', icon: '📈', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Maturity Stage',    value: mo.maturityStage|| mo.maturity_stage|| '—', icon: '🎯', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Competitors Found', value: String(competitorCount),                    icon: '🏢', bg: '#fffbeb', border: '#fde68a' },
  ];

  document.getElementById('overviewCards').innerHTML = cards.map(c => `
    <div style="background:linear-gradient(135deg,${c.bg},white);border:1px solid ${c.border};border-radius:16px;padding:20px;transition:transform 0.2s,box-shadow 0.2s;">
      <div style="font-size:1.5rem;margin-bottom:8px;">${c.icon}</div>
      <p style="font-size:0.7rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">${c.label}</p>
      <p style="font-size:1rem;font-weight:700;color:#1f2937;margin:0;text-transform:capitalize;">${escHtml(c.value)}</p>
    </div>
  `).join('');

  const summary = mo.summary;
  const existing = document.getElementById('overviewSummary');
  if (existing) existing.remove();
  if (summary) {
    const div = document.createElement('div');
    div.id = 'overviewSummary';
    div.style.cssText = 'background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:2rem;';
    div.innerHTML = `
      <p style="font-size:0.7rem;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Market Overview</p>
      <p style="font-size:0.9375rem;color:#374151;line-height:1.7;margin:0;">${escHtml(summary)}</p>
    `;
    document.getElementById('overviewCards').after(div);
  }
}

// ── Competitors ────────────────────────────────────────────────────────────────

function renderCompetitors(competitors) {
  const el = document.getElementById('tab-competitors');
  if (!competitors?.length) { el.innerHTML = empty('No competitor data available.'); return; }

  el.innerHTML = sectionTitle('Competitive Landscape', `${competitors.length} key competitors identified`) +
    `<div style="display:flex;flex-direction:column;gap:20px;">` +
    competitors.map(c => card(`
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#e0e7ff,#ede9fe);display:flex;align-items:center;justify-content:center;font-weight:700;color:#4338ca;font-size:1.125rem;flex-shrink:0;">
            ${escHtml((c.name || '?')[0].toUpperCase())}
          </div>
          <div>
            <h4 style="font-weight:700;color:#111827;margin:0 0 2px 0;">${escHtml(c.name || 'Unknown')}</h4>
            <p style="font-size:0.75rem;color:#6b7280;margin:0;">${escHtml(c.targetSegment || c.target_segment || '')}</p>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="font-size:0.7rem;color:#9ca3af;font-weight:500;text-transform:uppercase;margin:0 0 2px 0;">Pricing</p>
          <p style="font-size:0.875rem;font-weight:600;color:#374151;margin:0;">${escHtml(c.pricingModel || c.pricing_model || '—')}</p>
        </div>
      </div>

      <p style="font-size:0.875rem;color:#4b5563;margin:0 0 16px 0;">${escHtml(c.positioning || '')}</p>

      ${(c.keyFeatures || c.key_features)?.length ? `
        <div style="margin-bottom:16px;">
          <p style="font-size:0.7rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Key Features</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${(c.keyFeatures || c.key_features).map(f => pill(f, '#eff6ff', '#1d4ed8')).join('')}
          </div>
        </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-top:12px;border-top:1px solid #f3f4f6;">
        <div>
          <p style="font-size:0.7rem;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Strengths</p>
          ${ul(c.strengths, '#059669')}
        </div>
        <div>
          <p style="font-size:0.7rem;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Weaknesses</p>
          ${ul(c.weaknesses, '#dc2626')}
        </div>
      </div>
    `)).join('') + `</div>`;
}

// ── Target Segments ────────────────────────────────────────────────────────────

function renderSegments(segments) {
  const el = document.getElementById('tab-segments');
  if (!segments?.length) { el.innerHTML = empty('No segment data available.'); return; }

  el.innerHTML = sectionTitle('Target Market Segments', 'Primary audiences and their needs') +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">` +
    segments.map(s => card(`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:32px;height:32px;border-radius:10px;background:#fef3c7;color:#92400e;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0;">
          ${escHtml((s.segment || '?')[0].toUpperCase())}
        </div>
        <h4 style="font-weight:700;color:#111827;margin:0;">${escHtml(s.segment || 'Segment')}</h4>
      </div>
      <p style="font-size:0.875rem;color:#4b5563;margin:0 0 16px 0;">${escHtml(s.description || '')}</p>
      ${(s.painPoints || s.pain_points)?.length ? `
        <div style="margin-bottom:12px;">
          <p style="font-size:0.7rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">Pain Points</p>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px;">
            ${(s.painPoints || s.pain_points).map(p => `
              <li style="display:flex;align-items:flex-start;gap:8px;font-size:0.875rem;color:#374151;">
                <span style="color:#f59e0b;margin-top:1px;">⚡</span>${escHtml(p)}
              </li>`).join('')}
          </ul>
        </div>` : ''}
      ${s.willingnessToPay || s.willingness_to_pay ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:0.75rem;color:#6b7280;font-weight:500;margin:0;">Willingness to Pay</p>
          <p style="font-size:0.875rem;font-weight:600;color:#111827;margin:0;">${escHtml(s.willingnessToPay || s.willingness_to_pay)}</p>
        </div>` : ''}
    `)).join('') + `</div>`;
}

// ── Trends ─────────────────────────────────────────────────────────────────────

function renderTrends(trends) {
  const el = document.getElementById('tab-trends');
  if (!trends?.length) { el.innerHTML = empty('No trend data available.'); return; }

  const impactBg = { high: '#fee2e2', medium: '#fef3c7', low: '#d1fae5' };
  const impactIcon = { high: '🔥', medium: '📊', low: '💡' };

  el.innerHTML = sectionTitle('Market Trends', 'Forces shaping the competitive landscape') +
    `<div style="display:flex;flex-direction:column;gap:16px;">` +
    trends.map(t => {
      const imp = (t.impact || '').toLowerCase();
      return card(`
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="flex-shrink:0;width:40px;height:40px;border-radius:12px;background:${impactBg[imp] || '#f3f4f6'};display:flex;align-items:center;justify-content:center;font-size:1.125rem;">
            ${impactIcon[imp] || '📌'}
          </div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
              <h4 style="font-weight:700;color:#111827;margin:0;">${escHtml(t.trend || '')}</h4>
              ${badge(t.impact, `${cap(t.impact)} Impact`)}
            </div>
            <p style="font-size:0.875rem;color:#4b5563;margin:0;">${escHtml(t.description || '')}</p>
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
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">` +
    gaps.map((g, i) => card(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:24px;height:24px;border-radius:50%;background:#e0e7ff;color:#4338ca;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">${i+1}</span>
          <h4 style="font-weight:700;color:#111827;margin:0;">${escHtml(g.gap || '')}</h4>
        </div>
        ${badge(g.difficulty, `${cap(g.difficulty)} Difficulty`)}
      </div>
      <p style="font-size:0.875rem;color:#4b5563;margin:0;">${escHtml(g.rationale || '')}</p>
    `)).join('') + `</div>`;
}

// ── SWOT ───────────────────────────────────────────────────────────────────────

function renderSwot(swot) {
  const el = document.getElementById('tab-swot');
  if (!swot) { el.innerHTML = empty('No SWOT data available.'); return; }

  const quadrants = [
    { key: 'strengths',     label: 'Strengths',     icon: '💪', bg: '#f0fdf4', border: '#bbf7d0', head: '#065f46', check: '#059669' },
    { key: 'weaknesses',    label: 'Weaknesses',    icon: '⚠️', bg: '#fef2f2', border: '#fecaca', head: '#991b1b', check: '#dc2626' },
    { key: 'opportunities', label: 'Opportunities', icon: '🚀', bg: '#eff6ff', border: '#bfdbfe', head: '#1e3a8a', check: '#2563eb' },
    { key: 'threats',       label: 'Threats',       icon: '🛡️', bg: '#fffbeb', border: '#fde68a', head: '#78350f', check: '#d97706' },
  ];

  el.innerHTML = sectionTitle('SWOT Analysis', 'Strategic position assessment') +
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">` +
    quadrants.map(q => `
      <div style="background:${q.bg};border:1px solid ${q.border};border-radius:16px;padding:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-size:1.25rem;">${q.icon}</span>
          <h4 style="font-weight:700;color:${q.head};text-transform:uppercase;letter-spacing:0.05em;font-size:0.8125rem;margin:0;">${q.label}</h4>
        </div>
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

  const numBg = { high: '#fee2e2', medium: '#fef3c7', low: '#d1fae5' };
  const numTxt = { high: '#b91c1c', medium: '#92400e', low: '#065f46' };

  el.innerHTML = sectionTitle('Strategic Recommendations', 'Prioritized action plan based on market analysis') +
    `<div style="display:flex;flex-direction:column;gap:16px;">` +
    sorted.map((r, i) => {
      const p = (r.priority || '').toLowerCase();
      return card(`
        <div style="display:flex;gap:16px;">
          <div style="flex-shrink:0;width:40px;height:40px;border-radius:12px;background:${numBg[p]||'#f3f4f6'};color:${numTxt[p]||'#374151'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;">
            ${i + 1}
          </div>
          <div style="flex:1;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
              <h4 style="font-weight:700;color:#111827;margin:0;">${escHtml(r.recommendation || '')}</h4>
              ${badge(r.priority, `${cap(r.priority)} Priority`)}
            </div>
            <p style="font-size:0.875rem;color:#4b5563;margin:0;">${escHtml(r.rationale || '')}</p>
          </div>
        </div>
      `);
    }).join('') + `</div>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function empty(msg) {
  return `<p style="color:#9ca3af;font-style:italic;font-size:0.875rem;">${msg}</p>`;
}

// ── Keyboard shortcut ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runResearch();
});
