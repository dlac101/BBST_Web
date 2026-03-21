/* =============================================================================
   SmartOS Speed Test Page - Logic, Mock Data & Rendering
   ============================================================================= */

'use strict';

/* ===== Utilities ===== */
const el = id => document.getElementById(id);

function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

// Returns rgba string for canvas text/grid elements that adapts to theme
function canvasText(alpha) {
  return isDarkTheme()
    ? 'rgba(255,255,255,' + alpha + ')'
    : 'rgba(0,0,0,' + alpha + ')';
}

function gradeColor(g) {
  return g === 'A' ? 'var(--accent-green)' : g === 'B' ? 'var(--accent-cyan)' : g === 'C' ? 'var(--accent-amber)' : 'var(--accent-red)';
}

function gradeColorRaw(g) {
  return g === 'A' ? '#34d399' : g === 'B' ? '#22d3ee' : g === 'C' ? '#f59e0b' : '#ef4444';
}

function gradeTint(g) {
  return g === 'A' ? 'rgba(52,211,153,0.12)' : g === 'B' ? 'rgba(34,211,238,0.12)' : g === 'C' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
}

function formatSpeed(mbps) {
  if (mbps >= 1000) return (mbps / 1000).toFixed(2);
  return Math.round(mbps).toString();
}

function formatSpeedUnit(mbps) {
  return mbps >= 1000 ? 'Gbps' : 'Mbps';
}

function formatEpoch(epoch) {
  return new Date(epoch * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function formatEpochShort(epoch) {
  const d = new Date(epoch * 1000);
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return DAYS[d.getDay()] + ' ' + (d.getMonth()+1) + '/' + d.getDate();
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

/* ===== Mock Data ===== */
const MOCK = {
  wan: {
    service_rate_dl: 8000,
    service_rate_ul: 4000
  },

  latestResult: {
    test_status: 'complete',
    starttime: '2026-03-21T14:30:00Z',
    endtime: '2026-03-21T14:30:42Z',
    runtime: 42,
    client_version: '0.4.2',
    download: { mbps: 7540, pct_utilization: 94.3, total_byte_rx: 9823456000 },
    upload:   { mbps: 3820, pct_utilization: 95.5, total_byte_tx: 4912345000 },
    latency: {
      idle_avg: 8.2, download_avg: 14.6, upload_avg: 20.1,
      idle_jitter: 1.1, download_jitter: 3.4, upload_jitter: 5.2,
      download_bufferbloat_grade: 'A', upload_bufferbloat_grade: 'B'
    },
    server_selection: [
      { host: 'speedtest-atl.adtran.net', city: 'Atlanta', latency_ms: 8.2, rank: 1, selected: true },
      { host: 'speedtest-nyc.adtran.net', city: 'New York', latency_ms: 12.4, rank: 2, selected: false },
      { host: 'speedtest-dc.adtran.net',  city: 'Washington DC', latency_ms: 15.1, rank: 3, selected: false }
    ],
    client: { ip: '99.39.42.110', isp: 'AT&T Internet', city: 'Orlando', country: 'US' },
    server: { host: 'speedtest-atl.adtran.net', city: 'Atlanta', country: 'US', distance: '680 km' },
    test_options: {
      downstream_service_rate: 8000, upstream_service_rate: 4000,
      num_streams_download: 4, num_streams_upload: 4, client_mode: 'bbst'
    }
  },

  // 30 historical entries, newest-first
  history: (function() {
    const entries = [];
    const baseEpoch = Math.floor(new Date('2026-03-21T14:30:00Z').getTime() / 1000);
    const servers = ['speedtest-atl.adtran.net', 'speedtest-nyc.adtran.net', 'speedtest-dc.adtran.net'];
    const grades = ['A','A','A','B','B','B','B','C','A','A','B','A','A','C','B','B','A','A','B','C','A','A','B','B','A','A','B','C','A','B'];
    const dlSpeeds = [7540,6840,7350,5920,4180,7540,6380,7790,6910,5480,7210,7850,4120,6820,7580,7210,7490,5340,7310,6930,7610,6880,7350,6590,7660,7210,7530,6940,6420,7190];
    const ulSpeeds = [3820,3210,3890,2760,1840,3820,2970,3940,3340,2540,3690,3980,1780,3420,3950,3760,3820,2540,3750,3340,3920,3380,3810,3160,3970,3720,3870,3430,3090,3640];

    for (let i = 0; i < 30; i++) {
      const epoch = baseEpoch - i * 86400;
      const dl = dlSpeeds[i];
      const ul = ulSpeeds[i];
      const dlG = grades[i];
      const ulG = grades[(i + 3) % grades.length];
      const idle = 8 + Math.random() * 8;
      const dlLat = idle + 3 + Math.random() * 12;
      const ulLat = idle + 6 + Math.random() * 14;

      entries.push({
        test_status: 'complete',
        starttime: new Date(epoch * 1000).toISOString(),
        endtime: new Date((epoch + 42) * 1000).toISOString(),
        runtime: 42,
        download: { mbps: dl, pct_utilization: dl / 80 },
        upload: { mbps: ul, pct_utilization: ul / 40 },
        latency: {
          idle_avg: +idle.toFixed(1),
          download_avg: +dlLat.toFixed(1),
          upload_avg: +ulLat.toFixed(1),
          idle_jitter: +(0.5 + Math.random() * 2).toFixed(1),
          download_jitter: +(1 + Math.random() * 5).toFixed(1),
          upload_jitter: +(2 + Math.random() * 6).toFixed(1),
          download_bufferbloat_grade: dlG,
          upload_bufferbloat_grade: ulG
        },
        server: { host: servers[i % 3], city: ['Atlanta','New York','Washington DC'][i % 3], distance: ['680 km','1320 km','1100 km'][i % 3] },
        client: { ip: '99.39.42.110', isp: 'AT&T Internet' },
        epoch: epoch
      });
    }
    return entries;
  })()
};

// Add epoch to latestResult for convenience
MOCK.latestResult.epoch = Math.floor(new Date(MOCK.latestResult.starttime).getTime() / 1000);

/* ===== State ===== */
const TestState = { IDLE: 'idle', LATENCY: 'latency', DOWNLOAD: 'download', UPLOAD: 'upload', COMPLETE: 'complete' };
let currentState = TestState.IDLE;
let testRAF = null;
let advancedOpen = false;
let historyWindow = 0; // 0 = all
let historyMode = 'raw';
let realtimeSamples = { dl: [], ul: [] };
let currentResult = MOCK.latestResult;

/* ===== Theme Toggle ===== */
function initTheme() {
  const saved = localStorage.getItem('st-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('st-theme', next);
  updateThemeIcon();
  // Redraw charts
  if (advancedOpen) {
    renderHistoryChart();
    if (realtimeSamples.dl.length > 0 || realtimeSamples.ul.length > 0) drawRealtimeChart('st-realtime-adv-canvas');
  }
  renderSparkline();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const icon = el('themeIcon');
  if (icon) icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

/* ===== Sidebar Toggle ===== */
function initSidebar() {
  const btn = el('sidebarToggle');
  if (btn) btn.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
}

/* ===== Bufferbloat Summary ===== */
function gradeRank(g) { const r = { A: 0, B: 1, C: 2, D: 3 }; return g in r ? r[g] : 3; }

function bbSummary(dlG, ulG) {
  const dlR = gradeRank(dlG), ulR = gradeRank(ulG);
  const worst = dlR > ulR ? dlG : ulG;
  let msg = '';
  if (worst === 'A') {
    msg = 'Connection handles congestion <strong>well</strong>. Latency stays low even under full load.';
  } else if (worst === 'B') {
    msg = 'Connection handles congestion <strong>well</strong>.';
    if (dlR > ulR) msg += ' Download latency increases slightly under load.';
    else if (ulR > dlR) msg += ' Upload latency increases slightly under load.';
    else msg += ' Minor latency increase under load.';
  } else if (worst === 'C') {
    msg = '<strong class="warn">Moderate bufferbloat.</strong>';
    if (dlR >= 2) msg += ' Download latency increases noticeably under load.';
    if (ulR >= 2) msg += ' Upload latency increases noticeably under load.';
  } else {
    msg = '<strong class="bad">Significant bufferbloat.</strong>';
    if (dlR >= 3) msg += ' Download quality degrades under heavy use.';
    if (ulR >= 3) msg += ' Upload quality degrades under heavy use.';
  }
  return msg;
}

/* ===== Quality Assessment ===== */
function assessQuality(result) {
  const dl = result.download.mbps;
  const ul = result.upload.mbps;
  const lat = result.latency;
  const dlBB = gradeRank(lat.download_bufferbloat_grade);
  const ulBB = gradeRank(lat.upload_bufferbloat_grade);

  function check(condition, bbSensitive) {
    if (!condition) return 'no';
    if (bbSensitive && (dlBB >= 2 || ulBB >= 2)) return 'limited';
    return 'yes';
  }

  return [
    { name: '4K Streaming',   icon: 'fa-solid fa-tv',            status: check(dl >= 25, false) },
    { name: 'Video Calls',    icon: 'fa-solid fa-video',         status: check(dl >= 5 && ul >= 5 && lat.idle_avg < 50, true) },
    { name: 'Cloud Gaming',   icon: 'fa-solid fa-gamepad',       status: check(dl >= 50 && lat.idle_avg < 30, true) },
    { name: 'Remote Work',    icon: 'fa-solid fa-briefcase',     status: check(dl >= 25 && ul >= 10 && lat.idle_avg < 50, true) },
    { name: 'Large Uploads',  icon: 'fa-solid fa-cloud-arrow-up',status: check(ul >= 100, false) },
    { name: 'Multi-device',   icon: 'fa-solid fa-laptop',        status: check(dl >= 100, false) }
  ];
}

/* ===== Render Results ===== */
function renderResults(result) {
  const dlMbps = result.download.mbps;
  const ulMbps = result.upload.mbps;
  const lat = result.latency;
  const dlRate = MOCK.wan.service_rate_dl || 0;
  const ulRate = MOCK.wan.service_rate_ul || 0;

  // Speed values
  el('st-dl-value').textContent = formatSpeed(dlMbps);
  el('st-dl-unit').textContent = formatSpeedUnit(dlMbps);
  el('st-ul-value').textContent = formatSpeed(ulMbps);
  el('st-ul-unit').textContent = formatSpeedUnit(ulMbps);

  // Grade pills (large)
  const dlPill = el('st-dl-grade');
  dlPill.textContent = lat.download_bufferbloat_grade;
  dlPill.setAttribute('data-grade', lat.download_bufferbloat_grade);
  el('st-dl-grade-label').textContent = 'Bufferbloat Grade';
  const ulPill = el('st-ul-grade');
  ulPill.textContent = lat.upload_bufferbloat_grade;
  ulPill.setAttribute('data-grade', lat.upload_bufferbloat_grade);
  el('st-ul-grade-label').textContent = 'Bufferbloat Grade';

  // Utilization bars with prominent plan text
  if (dlRate > 0) {
    const dlPct = Math.min(100, (dlMbps / dlRate) * 100);
    el('st-dl-util-fill').style.width = dlPct.toFixed(1) + '%';
    el('st-dl-util-fill').style.background = dlPct >= 80 ? 'var(--accent-cyan)' : dlPct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
    const dlFmt = dlMbps >= 1000 ? (dlMbps/1000).toFixed(2) + ' Gbps' : Math.round(dlMbps) + ' Mbps';
    const dlRateFmt = dlRate >= 1000 ? (dlRate/1000).toFixed(0) + ' Gbps' : dlRate + ' Mbps';
    el('st-dl-util-text').textContent = dlFmt + ' of ' + dlRateFmt + ' plan (' + dlPct.toFixed(1) + '%)';
    el('st-dl-util').style.display = '';
  } else {
    el('st-dl-util').style.display = 'none';
  }

  if (ulRate > 0) {
    const ulPct = Math.min(100, (ulMbps / ulRate) * 100);
    el('st-ul-util-fill').style.width = ulPct.toFixed(1) + '%';
    el('st-ul-util-fill').style.background = ulPct >= 80 ? 'var(--accent-magenta)' : ulPct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
    const ulFmt = ulMbps >= 1000 ? (ulMbps/1000).toFixed(2) + ' Gbps' : Math.round(ulMbps) + ' Mbps';
    const ulRateFmt = ulRate >= 1000 ? (ulRate/1000).toFixed(0) + ' Gbps' : ulRate + ' Mbps';
    el('st-ul-util-text').textContent = ulFmt + ' of ' + ulRateFmt + ' plan (' + ulPct.toFixed(1) + '%)';
    el('st-ul-util').style.display = '';
  } else {
    el('st-ul-util').style.display = 'none';
  }

  // Latency bars (in their own card)
  renderLatencyBars(lat);
  el('st-latency-slim-card').style.display = '';
  el('st-latency-slim-card').className = 'card st-latency-slim-card st-fade-in';

  // BB summary
  el('st-bb-summary').innerHTML = bbSummary(lat.download_bufferbloat_grade, lat.upload_bufferbloat_grade);

  // Show results
  el('st-results').style.display = '';
  el('st-results').className = 'st-results st-fade-in';

  // Last test time
  el('st-last-time').textContent = 'Last test: ' + timeAgo(result.starttime);

  // Connection info
  renderConnectionInfo(result);

  // Quality
  renderQuality(result);

  // Sparkline
  renderSparkline();

  // Advanced panels
  renderLatencyGrid(result);

  currentResult = result;
}

/* ===== Latency Stacked Bar ===== */
function renderLatencyBars(lat) {
  // Fixed scale: 0-200ms so good latency looks small and reassuring
  const scale = 200;
  const idle = lat.idle_avg;
  const dlDelta = Math.max(0, lat.download_avg - lat.idle_avg);
  const ulDelta = Math.max(0, lat.upload_avg - lat.idle_avg);

  el('st-lat-seg-idle').style.width = (idle / scale * 100).toFixed(1) + '%';
  el('st-lat-seg-dl').style.width = (dlDelta / scale * 100).toFixed(1) + '%';
  el('st-lat-seg-ul').style.width = (ulDelta / scale * 100).toFixed(1) + '%';

  // Legend with values and bufferbloat grades
  const dlGrade = lat.download_bufferbloat_grade;
  const ulGrade = lat.upload_bufferbloat_grade;
  el('st-lat-stacked-legend').innerHTML =
    '<div class="lat-leg-row">' +
      '<span><span class="lat-leg-swatch idle"></span>Idle ' + idle.toFixed(1) + ' ms</span>' +
      '<span><span class="lat-leg-swatch dl"></span>DL +' + dlDelta.toFixed(1) + ' ms</span>' +
      '<span><span class="lat-leg-swatch ul"></span>UL +' + ulDelta.toFixed(1) + ' ms</span>' +
      '<span style="color:var(--text-muted)">Peak ' + Math.max(lat.download_avg, lat.upload_avg).toFixed(1) + ' ms</span>' +
    '</div>' +
    '<div class="lat-leg-row lat-leg-grades">' +
      '<span class="lat-leg-grades-label">Bufferbloat Grade</span>' +
      '<span>DL <span class="lat-leg-grade" style="background:' + gradeTint(dlGrade) + ';color:' + gradeColorRaw(dlGrade) + '">' + dlGrade + '</span></span>' +
      '<span>UL <span class="lat-leg-grade" style="background:' + gradeTint(ulGrade) + ';color:' + gradeColorRaw(ulGrade) + '">' + ulGrade + '</span></span>' +
    '</div>';
}

/* ===== Connection Info ===== */
function renderConnectionInfo(result) {
  el('st-info-server').textContent = result.server.city;
  el('st-info-isp').textContent = result.client.isp;
  el('st-info-ip').textContent = result.client.ip;
  const dlR = MOCK.wan.service_rate_dl;
  const ulR = MOCK.wan.service_rate_ul;
  if (dlR > 0 && ulR > 0) {
    const dlFmt = dlR >= 1000 ? (dlR/1000).toFixed(0) + 'G' : dlR + 'M';
    const ulFmt = ulR >= 1000 ? (ulR/1000).toFixed(0) + 'G' : ulR + 'M';
    el('st-info-plan').textContent = dlFmt + ' / ' + ulFmt;
  } else {
    el('st-info-plan').textContent = 'Not configured';
  }
  // Convert distance to miles for countries that use imperial
  const imperialCountries = ['US', 'GB', 'MM', 'LR'];
  const clientCountry = result.client.country || '';
  const distStr = result.server.distance || '';
  if (distStr && imperialCountries.indexOf(clientCountry) !== -1) {
    const kmMatch = distStr.match(/([\d.]+)\s*km/i);
    if (kmMatch) {
      const miles = Math.round(parseFloat(kmMatch[1]) * 0.621371);
      el('st-info-distance').textContent = miles + ' mi';
    } else {
      el('st-info-distance').textContent = distStr;
    }
  } else {
    el('st-info-distance').textContent = distStr || '--';
  }
  el('st-info-duration').textContent = result.runtime + 's';
  // Server candidates tested
  if (result.server_selection && result.server_selection.length > 0) {
    const count = result.server_selection.length;
    el('st-info-servers').textContent = count + ' server' + (count > 1 ? 's' : '') + ' evaluated';
  }
}

/* ===== Quality Assessment Render ===== */
function renderQuality(result) {
  const items = assessQuality(result);
  const grid = el('st-quality-grid');
  grid.innerHTML = items.map(item => `
    <div class="st-quality-item">
      <div class="st-quality-icon ${item.status}"><i class="${item.icon}"></i></div>
      <div class="st-quality-text">
        <span class="st-quality-name">${item.name}</span>
        <span class="st-quality-status ${item.status}">${item.status === 'yes' ? 'Supported' : item.status === 'limited' ? 'Limited' : 'Not supported'}</span>
      </div>
    </div>
  `).join('');
  el('st-quality-card').style.display = '';
  el('st-quality-card').className = 'card st-quality-card st-fade-in st-fade-in-delay-3';
}

/* ===== Latency Grid (Advanced) ===== */
function renderLatencyGrid(result) {
  const lat = result.latency;
  el('st-lat-idle-avg').textContent = lat.idle_avg.toFixed(1);
  el('st-lat-idle-jitter').textContent = lat.idle_jitter.toFixed(1);
  el('st-lat-dl-avg').textContent = lat.download_avg.toFixed(1);
  el('st-lat-dl-jitter').textContent = lat.download_jitter.toFixed(1);
  el('st-lat-ul-avg').textContent = lat.upload_avg.toFixed(1);
  el('st-lat-ul-jitter').textContent = lat.upload_jitter.toFixed(1);

  // Deltas
  const dlDelta = lat.download_avg - lat.idle_avg;
  const ulDelta = lat.upload_avg - lat.idle_avg;

  function deltaClass(d) {
    if (d < 5) return 'good';
    if (d < 20) return 'moderate';
    return 'bad';
  }

  const dlDeltaEl = el('st-lat-dl-delta');
  dlDeltaEl.textContent = '+' + dlDelta.toFixed(1) + ' ms';
  dlDeltaEl.className = 'st-latency-delta ' + deltaClass(dlDelta);

  const ulDeltaEl = el('st-lat-ul-delta');
  ulDeltaEl.textContent = '+' + ulDelta.toFixed(1) + ' ms';
  ulDeltaEl.className = 'st-latency-delta ' + deltaClass(ulDelta);
}

/* ===== Speed Gauge (Canvas) ===== */
function drawSpeedGauge(value, maxValue, color, phaseLabel) {
  const canvas = el('st-gauge-canvas');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const cssW = wrap.clientWidth;
  const cssH = wrap.clientHeight;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const DEG = Math.PI / 180;
  const sweepRad = 240 * DEG;
  const startAngle = 150 * DEG;
  const endAngle = 30 * DEG;

  const cx = cssW / 2;
  const cy = cssH * 0.55;
  const r = Math.min(cy - 6, cx - 10);

  // Use logarithmic scale for wide speed range
  const logMax = Math.log10(Math.max(10, maxValue));
  const logVal = Math.log10(Math.max(1, value));
  const norm = Math.min(1, logVal / logMax);
  const needleAngle = startAngle + norm * sweepRad;

  // Arc track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle, false);
  ctx.strokeStyle = canvasText(0.12);
  ctx.lineWidth = Math.max(3, r * 0.035);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Colored progress arc
  if (value > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, needleAngle, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, r * 0.035);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // Graduation ticks
  const tickValues = [0, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const visibleTicks = tickValues.filter(v => v <= maxValue);
  visibleTicks.forEach(tv => {
    const tNorm = tv === 0 ? 0 : Math.log10(Math.max(1, tv)) / logMax;
    const a = startAngle + tNorm * sweepRad;
    const isMajor = [0, 100, 1000, 5000, 10000].includes(tv);
    const inner = r - (isMajor ? r * 0.14 : r * 0.08);
    const outer = r + 1;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
    ctx.lineTo(cx + outer * Math.cos(a), cy + outer * Math.sin(a));
    ctx.strokeStyle = isMajor ? canvasText(0.5) : canvasText(0.2);
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.stroke();

    // Tick labels for major ticks
    if (isMajor && tv > 0) {
      const lblR = r - r * 0.24;
      const lx = cx + lblR * Math.cos(a);
      const ly = cy + lblR * Math.sin(a);
      ctx.font = '500 ' + Math.round(r * 0.09) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = canvasText(0.4);
      const lbl = tv >= 1000 ? (tv/1000) + 'G' : tv.toString();
      ctx.fillText(lbl, lx, ly);
    }
  });

  // Tapered needle
  const needleLen = r - 6;
  const tipX = cx + needleLen * Math.cos(needleAngle);
  const tipY = cy + needleLen * Math.sin(needleAngle);
  const baseHalf = Math.max(3, r * 0.05);
  const perpN = needleAngle + Math.PI / 2;
  ctx.save();
  var needleColor = isDarkTheme() ? '#ffffff' : '#1f2937';
  ctx.shadowColor = canvasText(0.4);
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(cx + baseHalf * Math.cos(perpN), cy + baseHalf * Math.sin(perpN));
  ctx.lineTo(cx - baseHalf * Math.cos(perpN), cy - baseHalf * Math.sin(perpN));
  ctx.closePath();
  ctx.fillStyle = needleColor;
  ctx.fill();
  ctx.restore();

  // Pivot dot
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, r * 0.05), 0, Math.PI * 2);
  ctx.fillStyle = needleColor;
  ctx.fill();
}

/* ===== Real-time Throughput Chart ===== */
function drawRealtimeChart(canvasId) {
  const canvas = el(canvasId || 'st-realtime-canvas');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 10, right: 10, bottom: 24, left: 50 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const allSamples = [...realtimeSamples.dl, ...realtimeSamples.ul];
  if (allSamples.length === 0) {
    ctx.fillStyle = canvasText(0.15);
    ctx.font = '12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Run a test to see throughput data', W / 2, H / 2);
    return;
  }

  const maxT = Math.max(...allSamples.map(s => s.t), 10);
  // Pre-scale Y to service rate so user sees performance relative to plan
  const serviceMax = Math.max(MOCK.wan.service_rate_dl || 0, MOCK.wan.service_rate_ul || 0);
  const yMax = serviceMax > 0 ? Math.ceil(serviceMax * 1.1 / 100) * 100 : Math.ceil(Math.max(...allSamples.map(s => s.mbps), 100) * 1.15 / 100) * 100;
  const xScale = cW / maxT;
  const yScale = cH / yMax;

  // Grid
  const gridSteps = 4;
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (let i = 0; i <= gridSteps; i++) {
    const val = yMax * i / gridSteps;
    const y = pad.top + cH - val * yScale;
    ctx.strokeStyle = i === 0 ? canvasText(0.15) : canvasText(0.06);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    const lbl = val >= 1000 ? (val/1000).toFixed(0) + 'G' : Math.round(val).toString();
    ctx.fillStyle = canvasText(0.35);
    ctx.fillText(lbl, pad.left - 5, y);
  }

  // Draw area chart for each direction
  function drawArea(samples, strokeColor, fillTop, fillBot) {
    if (samples.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pad.left + samples[0].t * xScale, pad.top + cH - samples[0].mbps * yScale);
    for (let i = 1; i < samples.length; i++) {
      ctx.lineTo(pad.left + samples[i].t * xScale, pad.top + cH - samples[i].mbps * yScale);
    }
    // Stroke
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill
    const lastSample = samples[samples.length - 1];
    ctx.lineTo(pad.left + lastSample.t * xScale, pad.top + cH);
    ctx.lineTo(pad.left + samples[0].t * xScale, pad.top + cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBot);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Contracted rate dashed lines
  const dlRate = MOCK.wan.service_rate_dl;
  const ulRate = MOCK.wan.service_rate_ul;
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1;
  ctx.font = '9px monospace';
  ctx.textBaseline = 'bottom';
  if (dlRate > 0 && dlRate <= yMax) {
    const yDl = pad.top + cH - dlRate * yScale;
    ctx.strokeStyle = 'rgba(34,211,238,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.left, yDl); ctx.lineTo(pad.left + cW, yDl); ctx.stroke();
    ctx.fillStyle = 'rgba(34,211,238,0.6)';
    ctx.textAlign = 'right';
    const dlLbl = dlRate >= 1000 ? (dlRate/1000).toFixed(0) + 'G DL' : dlRate + ' DL';
    ctx.fillText(dlLbl, pad.left + cW, yDl - 2);
  }
  if (ulRate > 0 && ulRate <= yMax) {
    const yUl = pad.top + cH - ulRate * yScale;
    ctx.strokeStyle = 'rgba(232,121,249,0.5)';
    ctx.beginPath(); ctx.moveTo(pad.left, yUl); ctx.lineTo(pad.left + cW, yUl); ctx.stroke();
    ctx.fillStyle = 'rgba(232,121,249,0.6)';
    ctx.textAlign = 'right';
    const ulLbl = ulRate >= 1000 ? (ulRate/1000).toFixed(0) + 'G UL' : ulRate + ' UL';
    ctx.fillText(ulLbl, pad.left + cW, yUl - 2);
  }
  ctx.restore();

  drawArea(realtimeSamples.dl, '#22d3ee', 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.02)');
  drawArea(realtimeSamples.ul, '#e879f9', 'rgba(232,121,249,0.30)', 'rgba(232,121,249,0.02)');

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '10px monospace';
  ctx.fillStyle = canvasText(0.35);
  for (let t = 0; t <= maxT; t += Math.max(1, Math.round(maxT / 6))) {
    const x = pad.left + t * xScale;
    ctx.fillText(t + 's', x, pad.top + cH + 6);
  }
}

/* ===== Sparkline ===== */
function renderSparkline() {
  const canvas = el('st-sparkline-canvas');
  if (!canvas) return;

  const tests = MOCK.history.filter(s => s.test_status === 'complete').slice(0, 10);
  if (tests.length < 2) return;

  el('st-sparkline-card').style.display = '';
  el('st-sparkline-card').className = 'card st-sparkline-card st-fade-in st-fade-in-delay-4';
  el('st-sparkline-count').textContent = '(last ' + tests.length + ')';

  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const reversed = tests.slice().reverse(); // oldest first
  const maxMbps = Math.max(...reversed.map(t => t.download.mbps));
  const minMbps = Math.min(...reversed.map(t => t.download.mbps));
  const range = maxMbps - minMbps || 1;

  // Layout: leave room for Y labels on left, X labels on bottom
  const yLabelW = 48;
  const xLabelH = 20;
  const padT = 8, padR = 24;
  const plotL = yLabelW;
  const plotT = padT;
  const plotW = W - yLabelW - padR;
  const plotH = H - padT - xLabelH - 4;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  // Y-axis: draw grid lines at min, mid, max
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const midMbps = (minMbps + maxMbps) / 2;
  const yTicks = [maxMbps, midMbps, minMbps];
  yTicks.forEach(val => {
    const y = plotT + plotH - ((val - minMbps) / range) * plotH;
    // Grid line
    ctx.beginPath();
    ctx.moveTo(plotL, y);
    ctx.lineTo(plotL + plotW, y);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Label
    ctx.fillStyle = labelColor;
    ctx.fillText(formatSpeedLabel(val), plotL - 6, y);
  });

  // Download line + area fill
  ctx.beginPath();
  reversed.forEach((t, i) => {
    const x = plotL + (i / (reversed.length - 1)) * plotW;
    const y = plotT + plotH - ((t.download.mbps - minMbps) / range) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(34,211,238,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Area fill under line
  const lastX = plotL + ((reversed.length - 1) / (reversed.length - 1)) * plotW;
  ctx.lineTo(lastX, plotT + plotH);
  ctx.lineTo(plotL, plotT + plotH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,211,238,0.08)';
  ctx.fill();

  // Dots with grade color + store coordinates for hover
  var sparkPoints = [];
  reversed.forEach((t, i) => {
    const x = plotL + (i / (reversed.length - 1)) * plotW;
    const y = plotT + plotH - ((t.download.mbps - minMbps) / range) * plotH;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = gradeColorRaw(t.latency.download_bufferbloat_grade);
    ctx.fill();
    sparkPoints.push({ x: x, y: y, test: t });
  });
  canvas._sparkPoints = sparkPoints;

  // X-axis: date labels
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = labelColor;
  // Show first, middle, last date
  const dateIndices = [0, Math.floor((reversed.length - 1) / 2), reversed.length - 1];
  dateIndices.forEach(i => {
    const x = plotL + (i / (reversed.length - 1)) * plotW;
    const d = new Date(reversed[i].starttime);
    const label = (d.getMonth() + 1) + '/' + d.getDate();
    ctx.fillText(label, x, plotT + plotH + 4);
  });
}

function formatSpeedLabel(mbps) {
  if (mbps >= 1000) return (mbps / 1000).toFixed(1) + 'G';
  return Math.round(mbps) + '';
}

/* ===== Sparkline Hover Tooltip ===== */
(function() {
  var bound = false;
  var activeIdx = -1;

  function bindSparklineHover() {
    var canvas = document.getElementById('st-sparkline-canvas');
    if (!canvas || bound) return;
    bound = true;

    canvas.addEventListener('mousemove', function(e) {
      var points = canvas._sparkPoints;
      if (!points || points.length === 0) return;

      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var mx = (e.clientX - rect.left) * (canvas.width / rect.width) / dpr;
      var my = (e.clientY - rect.top) * (canvas.height / rect.height) / dpr;

      // Find closest point within 20px
      var closest = -1, closestDist = 20;
      for (var i = 0; i < points.length; i++) {
        var dx = mx - points[i].x;
        var dy = my - points[i].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) { closestDist = d; closest = i; }
      }

      var tt = document.getElementById('st-spark-tooltip');
      if (closest === -1) {
        tt.style.display = 'none';
        activeIdx = -1;
        return;
      }

      if (closest === activeIdx) return; // same point, no update needed
      activeIdx = closest;

      var pt = points[closest];
      var t = pt.test;
      var d = new Date(t.starttime);
      var dateStr = (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
        d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
      var dlSpeed = t.download.mbps >= 1000
        ? (t.download.mbps / 1000).toFixed(2) + ' Gbps'
        : t.download.mbps + ' Mbps';
      var ulSpeed = t.upload.mbps >= 1000
        ? (t.upload.mbps / 1000).toFixed(2) + ' Gbps'
        : t.upload.mbps + ' Mbps';
      var dlGrade = t.latency.download_bufferbloat_grade;
      var ulGrade = t.latency.upload_bufferbloat_grade;

      tt.innerHTML =
        '<div class="spark-tt-speed">' + dlSpeed +
          ' <span class="spark-tt-grade" style="background:' + gradeTint(dlGrade) + ';color:' + gradeColorRaw(dlGrade) + '">' + dlGrade + '</span></div>' +
        '<div class="spark-tt-row">UL: ' + ulSpeed +
          ' <span class="spark-tt-grade" style="background:' + gradeTint(ulGrade) + ';color:' + gradeColorRaw(ulGrade) + '">' + ulGrade + '</span></div>' +
        '<div class="spark-tt-row">Latency: ' + t.latency.idle_avg.toFixed(1) + ' ms idle</div>' +
        '<div class="spark-tt-row" style="color:var(--text-muted)">' + dateStr + '</div>';

      tt.style.display = '';

      // Position: above the point, centered horizontally
      var wrap = canvas.parentElement;
      var cssX = pt.x;
      var cssY = pt.y;
      var ttW = tt.offsetWidth;
      var ttH = tt.offsetHeight;
      var tx = cssX - ttW / 2;
      var ty = cssY - ttH - 12;
      // Clamp to wrapper bounds
      if (tx < 4) tx = 4;
      if (tx + ttW > wrap.clientWidth - 4) tx = wrap.clientWidth - ttW - 4;
      if (ty < 0) ty = cssY + 16; // flip below if no room above
      tt.style.left = tx + 'px';
      tt.style.top = ty + 'px';
    });

    canvas.addEventListener('mouseout', function() {
      document.getElementById('st-spark-tooltip').style.display = 'none';
      activeIdx = -1;
    });
  }

  // Bind after DOM ready, and re-check periodically (canvas may not exist yet)
  document.addEventListener('DOMContentLoaded', function() {
    bindSparklineHover();
    // Also try after a delay in case sparkline renders later
    setTimeout(bindSparklineHover, 1000);
  });

  // Expose so we can rebind if needed
  window.bindSparklineHover = bindSparklineHover;
})();

/* ===== History Chart ===== */
function setHistoryWindow(days) {
  historyWindow = days;
  document.querySelectorAll('#sth-btn-10, #sth-btn-30, #sth-btn-all').forEach(b => b.classList.remove('active'));
  if (days === 10) el('sth-btn-10').classList.add('active');
  else if (days === 30) el('sth-btn-30').classList.add('active');
  else el('sth-btn-all').classList.add('active');
  renderHistoryChart();
}

function setHistoryMode(mode) {
  const dlRate = MOCK.wan.service_rate_dl || 0;
  const ulRate = MOCK.wan.service_rate_ul || 0;
  if (mode === 'pct' && (!dlRate || !ulRate)) return;
  historyMode = mode;
  el('sth-btn-pct').classList.toggle('active', mode === 'pct');
  el('sth-btn-raw').classList.toggle('active', mode === 'raw');
  renderHistoryChart();
}

function renderHistoryChart() {
  const canvas = el('st-history-canvas');
  if (!canvas) return;

  const dlRate = MOCK.wan.service_rate_dl || 0;
  const ulRate = MOCK.wan.service_rate_ul || 0;
  const hasRates = dlRate > 0 && ulRate > 0;

  // Enable/disable pct button
  const pctBtn = el('sth-btn-pct');
  if (hasRates) { pctBtn.disabled = false; pctBtn.title = ''; }
  else { pctBtn.disabled = true; pctBtn.title = 'Service rate not configured'; if (historyMode === 'pct') historyMode = 'raw'; }

  const usePct = historyMode === 'pct' && hasRates;
  const maxRate = Math.max(dlRate, ulRate);
  el('sth-btn-raw').textContent = maxRate > 999 ? 'Gbps' : 'Mbps';

  // Filter tests
  let tests = MOCK.history.filter(s => s.test_status === 'complete');
  if (historyWindow > 0) tests = tests.slice(0, historyWindow);
  tests = tests.slice().reverse(); // oldest first for drawing
  const n = tests.length;
  if (n === 0) return;

  // Size canvas
  const scrollEl = el('sth-scroll');
  const wrapW = scrollEl.clientWidth || 400;
  const H = scrollEl.clientHeight || 250;
  const minGroupW = 52;
  const naturalW = n * minGroupW + 60;
  const W = Math.max(wrapW, naturalW);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 10, right: 8, bottom: 50, left: 8 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  // Y axis
  let yMax;
  if (usePct) {
    yMax = 100;
  } else {
    const rawMax = Math.max(...tests.map(t => t.download.mbps));
    const headroom = rawMax * 1.3;
    const ceil = rawMax <= 1000 ? Math.ceil(headroom / 100) * 100 : Math.ceil(headroom / 1000) * 1000;
    yMax = Math.min(ceil, 10000);
  }
  const yScale = cH / yMax;

  // Render persistent Y-axis labels into HTML overlay
  const yAxisEl = el('sth-yaxis');
  if (yAxisEl) {
    const gridSteps = 4;
    let labels = '';
    for (let i = gridSteps; i >= 0; i--) {
      const val = yMax * i / gridSteps;
      let lbl;
      if (usePct) lbl = i === 0 ? '0' : Math.round(val) + '%';
      else lbl = val === 0 ? '0' : val >= 1000 ? (val/1000).toFixed(0) + 'G' : Math.round(val).toString();
      labels += '<span>' + lbl + '</span>';
    }
    yAxisEl.innerHTML = labels;
  }

  // Grid lines (no Y labels on canvas)
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = yMax * i / gridSteps;
    const y = pad.top + cH - val * yScale;
    ctx.strokeStyle = i === 0 ? canvasText(0.20) : canvasText(0.07);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
  }

  // Service rate lines
  if (!usePct && hasRates) {
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    const dlLineY = pad.top + cH - Math.min(dlRate, yMax) * yScale;
    ctx.strokeStyle = 'rgba(0,210,190,0.50)';
    ctx.beginPath(); ctx.moveTo(pad.left, dlLineY); ctx.lineTo(pad.left + cW, dlLineY); ctx.stroke();
    ctx.font = '9px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,210,190,0.65)';
    ctx.fillText((dlRate >= 1000 ? (dlRate/1000).toFixed(0) + 'G' : dlRate + 'M') + ' DL', pad.left + cW - 4, dlLineY - 2);

    const ulLineY = pad.top + cH - Math.min(ulRate, yMax) * yScale;
    ctx.strokeStyle = 'rgba(0,210,100,0.50)';
    ctx.beginPath(); ctx.moveTo(pad.left, ulLineY); ctx.lineTo(pad.left + cW, ulLineY); ctx.stroke();
    ctx.fillStyle = 'rgba(0,210,100,0.65)';
    ctx.fillText((ulRate >= 1000 ? (ulRate/1000).toFixed(0) + 'G' : ulRate + 'M') + ' UL', pad.left + cW - 4, ulLineY - 2);
    ctx.setLineDash([]);
  }

  // Bars
  const groupW = cW / n;
  const gap = groupW * 0.22;
  const barW = Math.max(2, (groupW - gap * 2) / 2 - 1.5);
  const baseY = pad.top + cH;
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const labelEvery = Math.max(1, Math.floor(n / 7));

  canvas._bars = [];

  tests.forEach((st, i) => {
    const dlMbps = st.download.mbps;
    const ulMbps = st.upload.mbps;
    const dlVal = usePct ? Math.min(100, dlMbps / dlRate * 100) : dlMbps;
    const ulVal = usePct ? Math.min(100, ulMbps / ulRate * 100) : ulMbps;
    const gx = pad.left + i * groupW + gap;
    const dlH = Math.max(2, dlVal * yScale);
    const ulH = Math.max(2, ulVal * yScale);
    const dlX = gx;
    const ulX = gx + barW + 1.5;
    const barCx = gx + barW;

    // DL bar (cyan)
    ctx.fillStyle = 'rgba(0,210,190,0.82)';
    ctx.fillRect(dlX, baseY - dlH, barW, dlH);

    // UL bar (green)
    ctx.fillStyle = 'rgba(0,210,100,0.82)';
    ctx.fillRect(ulX, baseY - ulH, barW, ulH);

    // Grade dot below bars
    const worse = gradeRank(st.latency.download_bufferbloat_grade) > gradeRank(st.latency.upload_bufferbloat_grade)
      ? st.latency.download_bufferbloat_grade : st.latency.upload_bufferbloat_grade;
    ctx.beginPath();
    ctx.arc(barCx, baseY + 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = gradeColorRaw(worse);
    ctx.fill();

    // X labels
    const epoch = st.epoch || Math.floor(new Date(st.starttime).getTime() / 1000);
    if (i === 0 || i === n - 1 || i % labelEvery === 0) {
      const d = new Date(epoch * 1000);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = canvasText(0.60); ctx.font = '11px monospace';
      ctx.fillText(DAYS[d.getDay()], barCx, baseY + 10);
      ctx.fillStyle = canvasText(0.35); ctx.font = '10px monospace';
      ctx.fillText((d.getMonth()+1) + '/' + d.getDate(), barCx, baseY + 24);
    }

    canvas._bars.push({
      x1: gx, x2: gx + barW * 2 + 1.5 + gap,
      dlVal, ulVal, usePct, st, epoch
    });
  });

  // Mouse events
  if (!canvas._sthEvents) {
    canvas._sthEvents = true;
    canvas.addEventListener('mousemove', onHistoryMouseMove);
    canvas.addEventListener('mouseleave', () => { el('st-history-tooltip').style.display = 'none'; });
    canvas.addEventListener('click', onHistoryClick);
  }

  // Scroll to right
  if (W > wrapW) {
    requestAnimationFrame(() => { scrollEl.scrollLeft = scrollEl.scrollWidth; });
  }
}

function onHistoryMouseMove(e) {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const bar = (canvas._bars || []).find(b => mx >= b.x1 && mx <= b.x2);
  const tt = el('st-history-tooltip');
  if (!bar) { tt.style.display = 'none'; return; }

  const st = bar.st;
  const epoch = bar.epoch || Math.floor(new Date(st.starttime).getTime() / 1000);
  const d = new Date(epoch * 1000);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const fmtDL = bar.usePct ? bar.dlVal.toFixed(1) + '%' : (bar.dlVal >= 1000 ? (bar.dlVal/1000).toFixed(2) + ' Gbps' : Math.round(bar.dlVal) + ' Mbps');
  const fmtUL = bar.usePct ? bar.ulVal.toFixed(1) + '%' : (bar.ulVal >= 1000 ? (bar.ulVal/1000).toFixed(2) + ' Gbps' : Math.round(bar.ulVal) + ' Mbps');

  tt.innerHTML =
    `<div class="sth-tt-date">${date}</div>` +
    `<div class="sth-tt-server">${st.server.host || st.server.city}</div>` +
    `<div class="sth-tt-row"><span class="sth-tt-dl">DL</span> ${fmtDL} <span class="sth-tt-grade" data-grade="${st.latency.download_bufferbloat_grade}">${st.latency.download_bufferbloat_grade}</span></div>` +
    `<div class="sth-tt-row"><span class="sth-tt-ul">UL</span> ${fmtUL} <span class="sth-tt-grade" data-grade="${st.latency.upload_bufferbloat_grade}">${st.latency.upload_bufferbloat_grade}</span></div>` +
    `<div class="sth-tt-lat">${st.latency.idle_avg.toFixed(0)} ms idle / ${st.latency.download_avg.toFixed(0)} ms loaded</div>`;
  tt.style.display = 'block';

  const wrap = canvas.parentElement;
  const wRect = wrap.getBoundingClientRect();
  const ttW = 170;
  let tx = e.clientX - wRect.left + 12;
  let ty = e.clientY - wRect.top - 10;
  if (tx + ttW > wRect.width - 4) tx = e.clientX - wRect.left - ttW - 12;
  if (ty < 0) ty = 4;
  tt.style.left = tx + 'px';
  tt.style.top = ty + 'px';
}

function onHistoryClick(e) {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const bar = (canvas._bars || []).find(b => mx >= b.x1 && mx <= b.x2);
  if (!bar) return;
  renderDetailPanel(bar.st);
}

/* ===== History Grab-to-Scroll ===== */
function initHistoryScroll() {
  const scrollEl = el('sth-scroll');
  if (!scrollEl) return;
  let isDragging = false, startX = 0, startScrollLeft = 0;
  scrollEl.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.pageX;
    startScrollLeft = scrollEl.scrollLeft;
    scrollEl.style.cursor = 'grabbing';
    scrollEl.style.userSelect = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    scrollEl.scrollLeft = startScrollLeft - (e.pageX - startX);
  });
  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    scrollEl.style.cursor = '';
    scrollEl.style.userSelect = '';
  });
}

/* ===== Detail Panel ===== */
function renderDetailPanel(result) {
  const panel = el('st-detail-card');
  panel.style.display = '';
  const epoch = result.epoch || Math.floor(new Date(result.starttime).getTime() / 1000);
  el('st-detail-title').textContent = 'Test Detail: ' + new Date(epoch * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const dlMbps = result.download.mbps;
  const ulMbps = result.upload.mbps;
  const lat = result.latency;
  const dlRate = MOCK.wan.service_rate_dl;
  const ulRate = MOCK.wan.service_rate_ul;

  el('st-detail-body').innerHTML = `
    <div class="st-detail-section">
      <div class="st-detail-heading">Speed</div>
      <div class="st-detail-row"><span class="st-detail-key">Download</span><span class="st-detail-val">${formatSpeed(dlMbps)} ${formatSpeedUnit(dlMbps)}</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Upload</span><span class="st-detail-val">${formatSpeed(ulMbps)} ${formatSpeedUnit(ulMbps)}</span></div>
      ${dlRate > 0 ? `<div class="st-detail-row"><span class="st-detail-key">DL Utilization</span><span class="st-detail-val">${(dlMbps/dlRate*100).toFixed(1)}%</span></div>` : ''}
      ${ulRate > 0 ? `<div class="st-detail-row"><span class="st-detail-key">UL Utilization</span><span class="st-detail-val">${(ulMbps/ulRate*100).toFixed(1)}%</span></div>` : ''}
    </div>
    <div class="st-detail-section">
      <div class="st-detail-heading">Latency</div>
      <div class="st-detail-row"><span class="st-detail-key">Idle</span><span class="st-detail-val">${lat.idle_avg.toFixed(1)} ms</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Download</span><span class="st-detail-val">${lat.download_avg.toFixed(1)} ms (+${(lat.download_avg - lat.idle_avg).toFixed(1)})</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Upload</span><span class="st-detail-val">${lat.upload_avg.toFixed(1)} ms (+${(lat.upload_avg - lat.idle_avg).toFixed(1)})</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Jitter (idle)</span><span class="st-detail-val">${lat.idle_jitter.toFixed(1)} ms</span></div>
    </div>
    <div class="st-detail-section">
      <div class="st-detail-heading">Bufferbloat</div>
      <div class="st-detail-row"><span class="st-detail-key">Download Grade</span><span class="st-detail-val" style="color:${gradeColorRaw(lat.download_bufferbloat_grade)}">${lat.download_bufferbloat_grade}</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Upload Grade</span><span class="st-detail-val" style="color:${gradeColorRaw(lat.upload_bufferbloat_grade)}">${lat.upload_bufferbloat_grade}</span></div>
    </div>
    <div class="st-detail-section">
      <div class="st-detail-heading">Server</div>
      <div class="st-detail-row"><span class="st-detail-key">Host</span><span class="st-detail-val">${result.server.host || '--'}</span></div>
      <div class="st-detail-row"><span class="st-detail-key">City</span><span class="st-detail-val">${result.server.city || '--'}</span></div>
      <div class="st-detail-row"><span class="st-detail-key">Distance</span><span class="st-detail-val">${result.server.distance || '--'}</span></div>
    </div>
  `;
}

function closeDetail() {
  el('st-detail-card').style.display = 'none';
}

/* ===== Export ===== */
function exportHistory() {
  const data = JSON.stringify(MOCK.history, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'speedtest-history.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ===== Advanced Toggle ===== */
function toggleAdvanced() {
  advancedOpen = !advancedOpen;
  const panel = el('st-advanced');
  const btn = el('st-advanced-toggle');
  const text = el('st-advanced-toggle-text');

  if (advancedOpen) {
    panel.style.display = '';
    btn.classList.add('open');
    text.textContent = 'Hide Advanced Details';
    renderHistoryChart();
    if (realtimeSamples.dl.length > 0 || realtimeSamples.ul.length > 0) {
      drawRealtimeChart('st-realtime-adv-canvas');
    }
  } else {
    panel.style.display = 'none';
    btn.classList.remove('open');
    text.textContent = 'Show Advanced Details';
  }
  localStorage.setItem('st-advanced', advancedOpen ? '1' : '0');
}

/* ===== Test State Machine ===== */
function generateSpeedCurve(targetMbps, durationMs, sampleIntervalMs) {
  const samples = [];
  const tau = durationMs * 0.25; // time constant
  const numSamples = Math.floor(durationMs / sampleIntervalMs);
  for (let i = 0; i <= numSamples; i++) {
    const t = i * sampleIntervalMs;
    const base = targetMbps * (1 - Math.exp(-t / tau));
    const jitter = targetMbps * 0.04 * (Math.random() - 0.5);
    const val = Math.max(0, base + jitter);
    samples.push({ t: t / 1000, mbps: val });
  }
  return samples;
}

function startTest() {
  if (currentState !== TestState.IDLE) return;

  // Cancel any lingering animation frame from a previous test
  if (testRAF) { cancelAnimationFrame(testRAF); testRAF = null; }

  // Morph GO button into gauge -- hide button, show canvas + live speed
  const goBtn = el('st-go-btn');
  goBtn.classList.remove('pulsing');
  goBtn.classList.add('hidden');
  el('st-gauge-area').classList.add('testing');
  el('st-live-speed').style.display = '';

  // Fade out previous results before hiding
  var fadeEls = [el('st-results'), el('st-latency-slim-card')];
  fadeEls.forEach(function(elem) {
    if (elem && elem.style.display !== 'none') {
      elem.style.transition = 'opacity 0.6s ease-out';
      elem.style.opacity = '0';
    }
  });
  setTimeout(function() {
    fadeEls.forEach(function(elem) {
      if (elem) { elem.style.display = 'none'; elem.style.opacity = ''; elem.style.transition = ''; }
    });
  }, 600);

  el('st-phase-bar').style.display = 'flex';
  el('st-realtime-inline').style.display = 'none';
  el('st-realtime-card').style.display = 'none';
  el('st-bb-summary').innerHTML = '';

  // Reset phases
  document.querySelectorAll('.st-phase').forEach(p => { p.classList.remove('active', 'done'); });

  // Reset utilization bar widths
  el('st-dl-util-fill').style.width = '0%';
  el('st-ul-util-fill').style.width = '0%';
  el('st-lat-seg-idle').style.width = '0%';
  el('st-lat-seg-dl').style.width = '0%';
  el('st-lat-seg-ul').style.width = '0%';

  // Reset real-time samples
  realtimeSamples = { dl: [], ul: [] };

  // Target values (from mock)
  const targetDL = MOCK.latestResult.download.mbps;
  const targetUL = MOCK.latestResult.upload.mbps;
  const targetLat = MOCK.latestResult.latency;

  // Generate speed curves
  const dlCurve = generateSpeedCurve(targetDL, 8000, 50);
  const ulCurve = generateSpeedCurve(targetUL, 8000, 50);

  // Phase 1: Multi-server ping race
  currentState = TestState.LATENCY;
  el('st-phase-latency').classList.add('active');
  el('st-live-speed').style.display = 'none'; // hide speed readout during race
  el('st-gauge-area').classList.add('racing'); // expand to full width for race lanes
  el('st-go-subtitle').style.display = '';
  el('st-go-subtitle').textContent = 'Evaluating servers';

  // Server race config from mock data
  var servers = MOCK.latestResult.server_selection.map(function(s) {
    return { name: s.city, latency: s.latency_ms, selected: s.selected };
  });
  // Sort by latency so fastest finishes first
  servers.sort(function(a, b) { return a.latency - b.latency; });

  var raceColors = ['#22d3ee', '#e879f9', '#fbbf24']; // cyan, magenta, amber
  var baseCycle = 900; // ms per round-trip for fastest server
  var maxLat = Math.max.apply(null, servers.map(function(s) { return s.latency; }));
  var totalRoundTrips = 1;
  var raceTotalDur = baseCycle * (maxLat / servers[0].latency) * totalRoundTrips;
  var settleDur = 1200;

  var raceStart = performance.now();

  function animatePingRace(now) {
    var elapsed = now - raceStart;
    var canvas = el('st-gauge-canvas');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var wrap = canvas.parentElement;
    var cssW = wrap.clientWidth;
    var cssH = wrap.clientHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var padL = cssW * 0.08;
    var padR = cssW * 0.34; // room for server name labels right of endpoint
    var x0 = padL, x1 = cssW - padR;
    var laneH = 36;
    var startY = cssH * 0.28;

    // "You" label
    ctx.font = '600 11px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('YOU', x0, startY - 18);

    // You endpoint dot
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(x0, startY, 4, 0, Math.PI * 2); ctx.fill();

    servers.forEach(function(srv, idx) {
      var color = raceColors[idx] || '#64748b';
      var cycleDur = baseCycle * (srv.latency / servers[0].latency);
      var srvTotalDur = cycleDur * totalRoundTrips;
      var y = startY + idx * laneH;

      // Lane dashed line
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 + 10, y); ctx.lineTo(x1 - 10, y); ctx.stroke();
      ctx.restore();

      // Server label (left of endpoint dot)
      ctx.font = '500 10px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(srv.name, x1 + 12, y + 4);

      // Server endpoint
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x1, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      if (elapsed < srvTotalDur) {
        // Animate dot
        var cycleT = (elapsed % cycleDur) / cycleDur;
        var t, goingRight;
        if (cycleT < 0.5) { t = cycleT * 2; goingRight = true; }
        else { t = (cycleT - 0.5) * 2; goingRight = false; }
        var ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        var dotX = goingRight ? x0 + (x1 - x0) * ease : x1 - (x1 - x0) * ease;

        // Glow
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(dotX, y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Dot
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(dotX, y, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        // Done: show latency result
        var doneT = Math.min(1, (elapsed - srvTotalDur) / 400);
        ctx.globalAlpha = doneT;
        ctx.font = '600 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(srv.latency.toFixed(1) + ' ms', (x0 + x1) / 2, y + 4);
        ctx.globalAlpha = 1;
      }
    });

    // Winner highlight after all servers done
    if (elapsed > raceTotalDur + 400) {
      var winT = Math.min(1, (elapsed - raceTotalDur - 400) / 500);
      var winY = startY; // first lane (fastest)
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.globalAlpha = winT * 0.5;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.roundRect(x0 - 8, winY - 13, x1 - x0 + 16, 26, 5);
      ctx.stroke();
      ctx.globalAlpha = winT;
      ctx.font = '700 9px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.letterSpacing = '0.05em';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('SELECTED', x1 - 2, winY - 16);
      ctx.restore();

      // Update subtitle
      el('st-go-subtitle').textContent = servers[0].name + ' selected (' + servers[0].latency.toFixed(1) + ' ms)';
    }

    // Check if race + settle is done
    if (elapsed < raceTotalDur + settleDur) {
      testRAF = requestAnimationFrame(animatePingRace);
    } else {
      // Fade out race canvas, then transition to gauge
      var gaugeArea = el('st-gauge-area');
      var gaugeCanvas = el('st-gauge-canvas');
      // Fade out the race
      gaugeCanvas.style.transition = 'opacity 0.5s ease-out';
      gaugeCanvas.style.opacity = '0';

      setTimeout(function() {
        // Clear and resize for gauge
        ctx.clearRect(0, 0, cssW, cssH);
        gaugeArea.classList.remove('racing');
        gaugeCanvas.style.transition = 'none';
        gaugeCanvas.style.opacity = '0';

        // Show speed readout (also faded in)
        var liveSpeed = el('st-live-speed');
        liveSpeed.style.display = '';
        liveSpeed.style.opacity = '0';
        liveSpeed.style.transition = 'opacity 0.4s ease-in';

        el('st-phase-latency').classList.remove('active');
        el('st-phase-latency').classList.add('done');

        // Short delay then fade in gauge + text
        requestAnimationFrame(function() {
          gaugeCanvas.style.transition = 'opacity 0.4s ease-in';
          gaugeCanvas.style.opacity = '1';
          liveSpeed.style.opacity = '1';
          // Clean up transitions after fade-in
          setTimeout(function() {
            gaugeCanvas.style.transition = '';
            liveSpeed.style.transition = '';
            liveSpeed.style.opacity = '';
          }, 450);
        });

        startDownloadPhase(dlCurve, ulCurve, targetLat);
      }, 600);
      return; // don't request another frame
    }
  }
  testRAF = requestAnimationFrame(animatePingRace);
}

function startDownloadPhase(dlCurve, ulCurve, targetLat) {
  currentState = TestState.DOWNLOAD;
  el('st-phase-download').classList.add('active');
  el('st-go-subtitle').textContent = 'Testing download';
  el('st-realtime-inline').style.display = ''; // show throughput chart now

  const dlStart = performance.now();
  const dlDuration = 8000;
  let sampleIdx = 0;

  function animateDownload(now) {
    const elapsed = now - dlStart;
    const progress = Math.min(1, elapsed / dlDuration);
    const idx = Math.min(dlCurve.length - 1, Math.floor(progress * dlCurve.length));
    const currentSpeed = dlCurve[idx].mbps;

    // Update live display
    if (currentSpeed >= 1000) {
      el('st-live-value').textContent = (currentSpeed / 1000).toFixed(2);
      document.querySelector('.st-live-unit').textContent = 'Gbps';
    } else {
      el('st-live-value').textContent = Math.round(currentSpeed).toString();
      document.querySelector('.st-live-unit').textContent = 'Mbps';
    }

    // Update gauge
    drawSpeedGauge(currentSpeed, 10000, '#22d3ee', 'Download');

    // Collect real-time samples
    if (idx > sampleIdx) {
      for (let i = sampleIdx + 1; i <= idx; i++) {
        realtimeSamples.dl.push(dlCurve[i]);
      }
      sampleIdx = idx;
      drawRealtimeChart();
    }

    if (progress < 1) {
      testRAF = requestAnimationFrame(animateDownload);
    } else {
      el('st-phase-download').classList.remove('active');
      el('st-phase-download').classList.add('done');
      startUploadPhase(ulCurve, targetLat);
    }
  }
  testRAF = requestAnimationFrame(animateDownload);
}

function startUploadPhase(ulCurve, targetLat) {
  currentState = TestState.UPLOAD;
  el('st-phase-upload').classList.add('active');
  el('st-go-subtitle').textContent = 'Testing upload';

  const ulStart = performance.now();
  const ulDuration = 8000;
  let sampleIdx = 0;
  const timeOffset = realtimeSamples.dl.length > 0 ? realtimeSamples.dl[realtimeSamples.dl.length - 1].t + 0.5 : 0;

  function animateUpload(now) {
    const elapsed = now - ulStart;
    const progress = Math.min(1, elapsed / ulDuration);
    const idx = Math.min(ulCurve.length - 1, Math.floor(progress * ulCurve.length));
    const currentSpeed = ulCurve[idx].mbps;

    // Update live display
    if (currentSpeed >= 1000) {
      el('st-live-value').textContent = (currentSpeed / 1000).toFixed(2);
      document.querySelector('.st-live-unit').textContent = 'Gbps';
    } else {
      el('st-live-value').textContent = Math.round(currentSpeed).toString();
      document.querySelector('.st-live-unit').textContent = 'Mbps';
    }

    // Update gauge
    drawSpeedGauge(currentSpeed, 10000, '#e879f9', 'Upload');

    // Collect real-time samples with time offset
    if (idx > sampleIdx) {
      for (let i = sampleIdx + 1; i <= idx; i++) {
        realtimeSamples.ul.push({ t: ulCurve[i].t + timeOffset, mbps: ulCurve[i].mbps });
      }
      sampleIdx = idx;
      drawRealtimeChart();
    }

    if (progress < 1) {
      testRAF = requestAnimationFrame(animateUpload);
    } else {
      el('st-phase-upload').classList.remove('active');
      el('st-phase-upload').classList.add('done');
      completeTest();
    }
  }
  testRAF = requestAnimationFrame(animateUpload);
}

function completeTest() {
  currentState = TestState.COMPLETE;

  // Morph gauge back to GO button
  el('st-gauge-area').classList.remove('testing');
  el('st-live-speed').style.display = 'none';
  // Clear gauge canvas
  const gaugeCanvas = el('st-gauge-canvas');
  const gCtx = gaugeCanvas.getContext('2d');
  gCtx.clearRect(0, 0, gaugeCanvas.width, gaugeCanvas.height);

  const goBtn = el('st-go-btn');
  goBtn.classList.remove('hidden');
  goBtn.classList.add('pulsing');
  goBtn.querySelector('.st-go-text').textContent = 'GO';
  el('st-go-subtitle').style.display = '';
  el('st-go-subtitle').textContent = 'Tap to run again';

  // Generate a varied new result based on service rates (not previous result, to avoid drift)
  const baseDl = MOCK.wan.service_rate_dl * (0.85 + Math.random() * 0.15); // 85-100% of plan
  const baseUl = MOCK.wan.service_rate_ul * (0.85 + Math.random() * 0.15);
  const baseIdle = 6 + Math.random() * 8; // 6-14ms
  const baseDlLat = baseIdle + 2 + Math.random() * 12;
  const baseUlLat = baseIdle + 4 + Math.random() * 16;
  const grades = ['A','A','A','A','B','B','B','C'];
  const dlG = grades[Math.floor(Math.random() * grades.length)];
  const ulG = grades[Math.floor(Math.random() * grades.length)];

  const now = new Date();
  const newResult = {
    test_status: 'complete',
    starttime: now.toISOString(),
    endtime: new Date(now.getTime() + 42000).toISOString(),
    epoch: Math.floor(now.getTime() / 1000),
    runtime: 42,
    download: { mbps: Math.round(baseDl), pct_utilization: +(baseDl / MOCK.wan.service_rate_dl * 100).toFixed(1) },
    upload: { mbps: Math.round(baseUl), pct_utilization: +(baseUl / MOCK.wan.service_rate_ul * 100).toFixed(1) },
    latency: {
      idle_avg: +baseIdle.toFixed(1),
      download_avg: +baseDlLat.toFixed(1),
      upload_avg: +baseUlLat.toFixed(1),
      idle_jitter: +(0.5 + Math.random() * 2).toFixed(1),
      download_jitter: +(1 + Math.random() * 5).toFixed(1),
      upload_jitter: +(2 + Math.random() * 6).toFixed(1),
      download_bufferbloat_grade: dlG,
      upload_bufferbloat_grade: ulG
    },
    server_selection: MOCK.latestResult.server_selection,
    server: MOCK.latestResult.server,
    client: MOCK.latestResult.client,
    test_options: MOCK.latestResult.test_options
  };

  // Push to history (newest first) and update latest
  MOCK.history.unshift(newResult);
  MOCK.latestResult = newResult;

  // Render results
  renderResults(newResult);

  // Animate inline chart flying down to the advanced section (ghost clone technique)
  var inlineChart = el('st-realtime-inline');
  var advCard = el('st-realtime-card');

  // Capture the inline chart's current viewport position
  var srcRect = inlineChart.getBoundingClientRect();

  // Hide inline immediately
  inlineChart.style.display = 'none';

  // Show advanced card (hidden visually until clone arrives) and draw its canvas
  advCard.style.display = '';
  advCard.style.opacity = '0';
  drawRealtimeChart('st-realtime-adv-canvas');

  // Measure destination position
  var destRect = advCard.getBoundingClientRect();

  // Create a ghost clone at the source position
  var ghost = inlineChart.cloneNode(true);
  ghost.style.display = '';
  Object.assign(ghost.style, {
    position: 'fixed',
    left: srcRect.left + 'px',
    top: srcRect.top + 'px',
    width: srcRect.width + 'px',
    height: srcRect.height + 'px',
    zIndex: '9000',
    pointerEvents: 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(34, 211, 238, 0.3)',
    background: 'var(--card-bg)',
    margin: '0',
    padding: '8px 4px 4px',
    borderTop: 'none'
  });
  document.body.appendChild(ghost);

  // Compute the delta from source to destination
  var dx = destRect.left - srcRect.left;
  var dy = destRect.top - srcRect.top;
  var scaleX = destRect.width / srcRect.width;
  var scaleY = destRect.height / srcRect.height;
  var dist = Math.sqrt(dx * dx + dy * dy);
  var dur = Math.min(2400, Math.max(1200, (dist / 160) * 1000));

  // Animate the ghost flying to the destination using WAAPI
  var anim = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scaleX + ', ' + scaleY + ')', opacity: 0.7 }
    ],
    {
      duration: dur,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      fill: 'forwards'
    }
  );

  anim.onfinish = function() {
    ghost.remove();
    advCard.style.opacity = '1';
    // Brief highlight glow on arrival
    advCard.classList.add('highlight');
    setTimeout(function() { advCard.classList.remove('highlight'); }, 1000);
  };

  // Redraw advanced charts
  if (advancedOpen) {
    renderHistoryChart();
  }

  // Reset state
  testRAF = null;
  setTimeout(() => {
    currentState = TestState.IDLE;
    el('st-phase-bar').style.display = 'none';
  }, 500);
}

/* ===== Initialize ===== */
function init() {
  initTheme();
  initSidebar();

  // Restore advanced state
  advancedOpen = localStorage.getItem('st-advanced') === '1';
  if (advancedOpen) {
    el('st-advanced').style.display = '';
    el('st-advanced-toggle').classList.add('open');
    el('st-advanced-toggle-text').textContent = 'Hide Advanced Details';
  }

  // Pulse GO button
  el('st-go-btn').classList.add('pulsing');

  // Show last result
  if (MOCK.latestResult && MOCK.latestResult.test_status === 'complete') {
    renderResults(MOCK.latestResult);
  }

  // Init history chart if advanced is open
  if (advancedOpen) {
    renderHistoryChart();
  }

  // Show advanced realtime chart if we have samples (inline only shown during test)
  if (realtimeSamples.dl.length > 0 || realtimeSamples.ul.length > 0) {
    el('st-realtime-card').style.display = '';
    if (advancedOpen) drawRealtimeChart('st-realtime-adv-canvas');
  }

  // Init history scroll
  initHistoryScroll();
}

// Register theme toggle
document.addEventListener('DOMContentLoaded', () => {
  init();
  const themeBtn = el('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});

// Resize handler
window.addEventListener('resize', () => {
  if (advancedOpen) {
    renderHistoryChart();
    if (realtimeSamples.dl.length > 0 || realtimeSamples.ul.length > 0) drawRealtimeChart('st-realtime-adv-canvas');
  }
  if (currentState !== TestState.IDLE && el('st-realtime-inline').style.display !== 'none') drawRealtimeChart();
  renderSparkline();
});
