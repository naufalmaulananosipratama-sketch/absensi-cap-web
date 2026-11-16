/* CAKRA APP — lapisan modern untuk Panel Admin: tema, ikon menu, live dashboard, angka beranimasi.
   Hanya MEMBACA lewat fungsi yang sudah ada di admin.html. Tidak mengubah alur data. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- tema ---------- */
  var BULAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var MATAHARI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function terapkanTema(t) {
    document.documentElement.setAttribute('data-tema', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = t === 'dark' ? '#0a0c11' : '#f3f4f8';
    var b = $('btn-tema-admin'); if (b) b.innerHTML = t === 'dark' ? MATAHARI : BULAN;
  }
  var tema = ls('cap_tema') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  terapkanTema(tema);

  /* ---------- sisipkan tombol tema & penanda live di header ---------- */
  function sisipHeader() {
    var grup = document.querySelector('header.top .filter-group'); if (!grup || $('live-pill')) return;
    var keluar = $('btn-logout-admin');
    var pill = document.createElement('div');
    pill.className = 'live-pill'; pill.id = 'live-pill'; pill.title = 'Klik untuk menyalakan / mematikan pembaruan otomatis';
    pill.innerHTML = '<i></i><span>LIVE</span><b id="live-jam">--:--:--</b>';
    var tombol = document.createElement('button');
    tombol.type = 'button'; tombol.className = 'ic-btn'; tombol.id = 'btn-tema-admin'; tombol.setAttribute('aria-label', 'Ganti tema terang atau gelap'); tombol.innerHTML = tema === 'dark' ? MATAHARI : BULAN;
    grup.insertBefore(pill, keluar || null);
    grup.insertBefore(tombol, keluar || null);
    tombol.addEventListener('click', function () {
      tema = document.documentElement.getAttribute('data-tema') === 'dark' ? 'light' : 'dark';
      ls('cap_tema', tema); terapkanTema(tema);
    });
    pill.addEventListener('click', function () { liveAktif = !liveAktif; ls('cap_live', liveAktif ? '1' : '0'); pill.classList.toggle('mati', !liveAktif); });
  }

  /* ---------- ikon menu samping ---------- */
  var IKON = {
    absensi: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    patroli: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    kejadian: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    cleaning: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    penilaian: '<path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.9L12 17.6 5.9 20.9 7.1 14 2.1 9.2 9 8.3z"/>',
    kelola: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>',
    persetujuan: '<path d="M20 6L9 17l-5-5"/>',
    ai: '<path d="M12 3a7 7 0 0 0-4 12.7V19l4-2 4 2v-3.3A7 7 0 0 0 12 3z"/><path d="M9.5 10.5h.01M14.5 10.5h.01"/>',
    rekap: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'
  };
  function pasangIkon() {
    document.querySelectorAll('#tabs button[data-tab]').forEach(function (b) {
      if (b.querySelector('.ni')) return;
      var d = IKON[b.dataset.tab]; if (!d) return;
      var s = document.createElement('span'); s.className = 'ni';
      s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
      b.insertBefore(s, b.firstChild);
    });
  }

  /* ---------- tinggi header -> variabel CSS (untuk sidebar yang menempel) ---------- */
  function ukurHeader() { var h = document.querySelector('header.top'); if (h) document.documentElement.style.setProperty('--hh', h.offsetHeight + 'px'); }
  window.addEventListener('resize', ukurHeader);

  /* ---------- angka beranimasi ---------- */
  function animasi(el) {
    if (el.dataset.anim === '1') return;
    var m = String(el.textContent).trim().match(/^(\d+)(\.\d+)?(%?)$/); if (!m) return;
    el.dataset.anim = '1';
    var akhir = parseFloat(m[1] + (m[2] || '')), desimal = m[2] ? m[2].length - 1 : 0, sufiks = m[3];
    if (!(akhir > 0)) return;
    var mulai = null, lama = 700;
    function langkah(t) {
      if (mulai === null) mulai = t;
      var p = Math.min((t - mulai) / lama, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (akhir * e).toFixed(desimal) + sufiks;
      if (p < 1) requestAnimationFrame(langkah); else el.textContent = akhir.toFixed(desimal) + sufiks;
    }
    requestAnimationFrame(langkah);
  }
  function amatiAngka() {
    if (!window.MutationObserver) return;
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) {
        mu.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.classList && n.classList.contains('stat-tile')) animasi(n.querySelector('.num') || n);
          else if (n.querySelectorAll) n.querySelectorAll('.stat-tile .num').forEach(animasi);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- live dashboard ---------- */
  var liveAktif = ls('cap_live') !== '0', terakhir = 0, SELANG = 30000;
  function tabAktif() { var b = document.querySelector('#tabs button.active'); return b ? b.dataset.tab : ''; }
  function adaSesi() { var a = $('app'); return a && a.classList.contains('show'); }
  function segarkan() {
    if (!liveAktif || !adaSesi() || document.hidden) return;
    var tab = tabAktif();
    try {
      if (tab === 'absensi') { if (typeof muatDashboardAbsensi === 'function') muatDashboardAbsensi(); if (typeof muatRingkasanHarianAbsensi === 'function') muatRingkasanHarianAbsensi(); }
      else if (tab === 'patroli') { if (typeof muatDashboardOperasional === 'function') muatDashboardOperasional('ambilDashboardPatroli', 'patroli-stats', 'patroli-table'); if (typeof muatRingkasanHarianPatroli === 'function') muatRingkasanHarianPatroli(); }
      else if (tab === 'cleaning') { if (typeof muatDashboardOperasional === 'function') muatDashboardOperasional('ambilDashboardCleaning', 'cleaning-stats', 'cleaning-table'); }
      else if (tab === 'persetujuan') { if (typeof muatPersetujuan === 'function') muatPersetujuan(); }
      else return;
      terakhir = Date.now();
    } catch (e) {}
  }
  function tickLive() {
    var j = $('live-jam'); if (!j) return;
    var d = new Date(terakhir || Date.now());
    j.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    var p = $('live-pill'); if (p) p.classList.toggle('mati', !liveAktif);
    if (liveAktif && adaSesi() && !document.hidden && Date.now() - (terakhir || 0) >= SELANG) { if (!terakhir) terakhir = Date.now(); else segarkan(); }
  }

  function mulai() {
    sisipHeader(); pasangIkon(); ukurHeader(); amatiAngka();
    var app = $('app');
    if (app && window.MutationObserver) new MutationObserver(function () { if (adaSesi()) { sisipHeader(); pasangIkon(); ukurHeader(); if (!terakhir) terakhir = Date.now(); } }).observe(app, { attributes: true, attributeFilter: ['class'] });
    var tabs = $('tabs'); if (tabs) tabs.addEventListener('click', function () { setTimeout(function () { terakhir = Date.now(); }, 50); });
    setInterval(tickLive, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && liveAktif && adaSesi()) segarkan(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
