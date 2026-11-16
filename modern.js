/* CAKRA APP — lapisan modern: tema, sapaan, cincin jam kerja, ringkasan 7 hari, pengingat.
   Hanya MEMBACA data lewat fungsi yang sudah ada (api, sesi, statusEfektif). Tidak mengubah alur absen. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var TARGET_DETIK = 8 * 3600;

  function toast(msg, tipe) { try { if (typeof showToast === 'function') showToast(msg, tipe || 'ok'); } catch (e) {} }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- tema terang / gelap ---------- */
  var IKON_BULAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var IKON_MATAHARI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function terapkanTema(t) {
    document.documentElement.setAttribute('data-tema', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = t === 'dark' ? '#0a0c11' : '#1a1d26';
    var b = $('btn-tema'); if (b) b.innerHTML = t === 'dark' ? IKON_MATAHARI : IKON_BULAN;
  }
  var tema = ls('cap_tema') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  terapkanTema(tema);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#btn-tema')) {
      tema = document.documentElement.getAttribute('data-tema') === 'dark' ? 'light' : 'dark';
      ls('cap_tema', tema); terapkanTema(tema);
    }
  });

  /* ---------- sapaan ---------- */
  function sapaan() {
    var j = new Date().getHours();
    return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam';
  }
  function updateSapa() { var e = $('home-sapa'); if (e) e.textContent = sapaan() + ' 👋'; }

  /* ---------- util waktu ---------- */
  function detikDariJam(s) {
    if (!s) return null;
    var m = String(s).match(/(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/);
    if (!m) return null;
    return (+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] || 0));
  }
  function fmtDurasi(d) { d = Math.max(0, Math.round(d)); return pad(Math.floor(d / 3600)) + ':' + pad(Math.floor((d % 3600) / 60)); }
  function selisih(masuk, pulang) { var d = pulang - masuk; if (d < 0) d += 86400; return d; }
  function status() { try { return typeof statusEfektif === 'function' ? statusEfektif() : ((sesi && sesi.status) || {}); } catch (e) { return {}; } }

  /* ---------- cincin jam kerja ---------- */
  var KELILING = 2 * Math.PI * 44;
  function updateCincin() {
    var bar = $('ring-bar'), val = $('home-durasi'), note = $('home-shift-note');
    if (!bar || !val) return;
    var st = status(), now = new Date();
    var nowDetik = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var masuk = detikDariJam(st.jamMasuk), pulang = detikDariJam(st.jamPulang);
    var detik = 0, teks = 'Belum mulai';
    if (st.shiftAktif && masuk != null) {
      detik = selisih(masuk, nowDetik);
      teks = 'Shift berjalan sejak ' + String(st.jamMasuk).slice(0, 5);
    } else if (st.sudahClockOut && masuk != null && pulang != null) {
      detik = selisih(masuk, pulang);
      teks = 'Shift selesai · ' + String(st.jamMasuk).slice(0, 5) + '–' + String(st.jamPulang).slice(0, 5);
    } else if (st.sudahClockIn && masuk != null) {
      detik = selisih(masuk, nowDetik);
      teks = 'Masuk ' + String(st.jamMasuk).slice(0, 5);
    } else {
      teks = 'Belum absen masuk hari ini';
    }
    var p = Math.min(detik / TARGET_DETIK, 1);
    bar.style.strokeDasharray = KELILING;
    bar.style.strokeDashoffset = KELILING * (1 - p);
    val.textContent = fmtDurasi(detik);
    if (note) note.textContent = teks;
  }

  /* ---------- ringkasan 7 hari ---------- */
  var rkTerakhir = 0, rkData = null, rkSedang = false;
  function parseTanggal(s) {
    s = String(s || '');
    var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    return null;
  }
  function renderRingkasan(riwayat) {
    var box = $('rk-isi'); if (!box) return;
    if (!riwayat || !riwayat.length) { box.innerHTML = '<div class="rk-kosong">Belum ada data absensi 7 hari terakhir.</div>'; rkData = null; return; }
    var baris = riwayat.map(function (r) {
      var d = parseTanggal(r.tanggal), m = detikDariJam(r.jamMasuk), p = detikDariJam(r.jamPulang);
      return { d: d, label: d ? HARI[d.getDay()] : String(r.tanggal || '').slice(0, 3), masuk: m, dur: (m != null && p != null) ? selisih(m, p) : null, ada: m != null };
    });
    if (baris.every(function (b) { return b.d; })) baris.sort(function (a, b) { return a.d - b.d; }); else baris.reverse();
    var hadir = baris.filter(function (b) { return b.ada; }).length;
    var ms = baris.filter(function (b) { return b.masuk != null; }).map(function (b) { return b.masuk; });
    var rata = ms.length ? ms.reduce(function (a, b) { return a + b; }, 0) / ms.length : null;
    var total = baris.reduce(function (a, b) { return a + (b.dur || 0); }, 0);
    var maks = Math.max.apply(null, baris.map(function (b) { return b.dur || 0; }).concat([3600]));
    rkData = { rataMasuk: rata };
    box.innerHTML =
      '<div class="rk-grid">' +
      '<div class="rk-stat"><b>' + hadir + '<span style="font-size:13px;color:var(--muted)">/' + baris.length + '</span></b><small>Hari hadir</small></div>' +
      '<div class="rk-stat"><b>' + (rata != null ? pad(Math.floor(rata / 3600)) + ':' + pad(Math.floor((rata % 3600) / 60)) : '--:--') + '</b><small>Rata-rata masuk</small></div>' +
      '<div class="rk-stat"><b>' + Math.floor(total / 3600) + '<span style="font-size:13px;color:var(--muted)">j</span></b><small>Total jam kerja</small></div>' +
      '</div>' +
      '<div class="rk-bars">' + baris.map(function (b) {
        var h = b.dur ? Math.max(10, Math.round(b.dur / maks * 100)) : 6;
        return '<div class="rk-bar' + (b.dur ? ' on' : '') + '"><em>' + (b.dur ? (b.dur / 3600).toFixed(1).replace('.0', '') : '') + '</em><i style="height:' + h + '%"></i><span>' + b.label + '</span></div>';
      }).join('') + '</div>';
  }
  function muatRingkasan(paksa) {
    if (rkSedang) return;
    var now = Date.now();
    if (!paksa && now - rkTerakhir < 60000) return;
    if (!(typeof sesi !== 'undefined' && sesi && sesi.nama) || typeof api !== 'function') return;
    var box = $('rk-isi'); if (!box) return;
    if (!rkData) box.innerHTML = '<div class="skel" style="height:140px"></div>';
    rkSedang = true; rkTerakhir = now;
    api('riwayatAbsensi', { nama: sesi.nama, pin: sesi.pin }).then(function (res) {
      if (res && res.sukses) renderRingkasan(res.riwayat);
      else if (!rkData) box.innerHTML = '<div class="rk-kosong">' + ((res && res.pesan) || 'Ringkasan belum bisa dimuat.') + '</div>';
    }).catch(function () {}).then(function () { rkSedang = false; });
  }

  /* ---------- pengingat absen ---------- */
  var pengingatAktif = ls('cap_pengingat') === '1';
  function perbaruiTombolPengingat() { var b = $('btn-pengingat'); if (b) b.classList.toggle('aktif', pengingatAktif && ('Notification' in window) && Notification.permission === 'granted'); }
  function notif(judul, isi, tag) {
    var opsi = { body: isi, icon: 'icon-192.png', badge: 'icon-192.png', tag: tag, renotify: false };
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (r) { r.showNotification(judul, opsi); }).catch(function () { new Notification(judul, opsi); });
      } else { new Notification(judul, opsi); }
    } catch (e) { toast(judul + ' — ' + isi, 'ok'); }
  }
  function hariIni() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sudahDikirim(k) { return ls('cap_notif_' + k) === hariIni(); }
  function tandai(k) { ls('cap_notif_' + k, hariIni()); }
  function cekPengingat() {
    if (!pengingatAktif || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (!(typeof sesi !== 'undefined' && sesi && sesi.nama)) return;
    var st = status(), now = new Date(), nowDetik = now.getHours() * 3600 + now.getMinutes() * 60;
    if (!st.sudahClockIn && !st.shiftAktif && rkData && rkData.rataMasuk != null && !sudahDikirim('masuk')) {
      var d = nowDetik - rkData.rataMasuk;
      if (d >= -600 && d <= 1800) { notif('Waktunya absen masuk', 'Jangan lupa Clock In supaya kehadiran tercatat.', 'cap-masuk'); tandai('masuk'); }
    }
    if (st.shiftAktif && !sudahDikirim('pulang')) {
      var masuk = detikDariJam(st.jamMasuk);
      if (masuk != null && selisih(masuk, nowDetik) >= TARGET_DETIK - 300) { notif('Jam kerja hampir selesai', 'Jangan lupa Clock Out sebelum pulang.', 'cap-pulang'); tandai('pulang'); }
    }
  }
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('#btn-pengingat'))) return;
    if (!('Notification' in window)) { toast('Browser ini belum mendukung notifikasi.', 'err'); return; }
    if (pengingatAktif && Notification.permission === 'granted') {
      pengingatAktif = false; ls('cap_pengingat', '0'); perbaruiTombolPengingat(); toast('Pengingat dimatikan.', 'ok'); return;
    }
    if (Notification.permission === 'denied') { toast('Notifikasi diblokir. Izinkan lewat pengaturan browser.', 'err'); return; }
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') { pengingatAktif = true; ls('cap_pengingat', '1'); toast('Pengingat aktif. Berjalan selama aplikasi terbuka.', 'ok'); muatRingkasan(true); }
      else { pengingatAktif = false; ls('cap_pengingat', '0'); toast('Izin notifikasi tidak diberikan.', 'err'); }
      perbaruiTombolPengingat();
    });
  });

  /* ---------- getar halus saat tombol ditekan ---------- */
  document.addEventListener('click', function (e) {
    if (navigator.vibrate && e.target.closest && e.target.closest('.btn,.ic-btn,.navbar button,.row-btn')) navigator.vibrate(10);
  }, true);


  /* ---------- jam: selalu tampil HH:MM:SS dengan titik dua ---------- */
  (function () {
    var j = $('home-jam'); if (!j || !window.MutationObserver) return;
    var sedang = false;
    new MutationObserver(function () {
      if (sedang) return; var s = j.textContent;
      if (s.indexOf('.') > -1) { sedang = true; j.textContent = s.replace(/\./g, ':'); sedang = false; }
    }).observe(j, { childList: true, characterData: true, subtree: true });
  })();
  /* ---------- pemicu ---------- */
  function homeTerlihat() { var h = $('screen-home'); return h && !h.classList.contains('hidden'); }
  function tick() {
    updateSapa(); updateCincin();
    if (homeTerlihat()) muatRingkasan(false);
  }
  setInterval(tick, 1000);
  setInterval(cekPengingat, 30000);
  var home = $('screen-home');
  if (home && window.MutationObserver) {
    new MutationObserver(function () { if (homeTerlihat()) { updateSapa(); muatRingkasan(false); perbaruiTombolPengingat(); } }).observe(home, { attributes: true, attributeFilter: ['class'] });
  }
  ['pill-in', 'pill-out'].forEach(function (id) {
    var e = $(id); if (e && window.MutationObserver) new MutationObserver(function () { setTimeout(function () { muatRingkasan(true); }, 1200); }).observe(e, { childList: true, characterData: true, subtree: true });
  });
  document.addEventListener('DOMContentLoaded', function () { terapkanTema(tema); perbaruiTombolPengingat(); });
  terapkanTema(tema); perbaruiTombolPengingat(); updateSapa();
})();
