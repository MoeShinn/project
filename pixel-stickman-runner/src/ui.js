/* Giao diện HTML phủ lên canvas: HUD, nút bấm, menu, cửa hàng, nhiệm vụ... */
(function () {
  var C = window.GAME_CONFIG, U = window.U, S = window.Save, A = window.Assets;
  var UI = { rotated: false, shopTab: 'items', last: {} };
  var $ = function (id) { return document.getElementById(id); };
  var ICON = { shuriken: 'icon_shuriken', giant: 'icon_giant', shield: 'icon_shield_magnet' };
  var SCREENS = ['menu', 'shop', 'quests', 'pause', 'over'];

  /* ---------- co giãn + ép xoay ngang ---------- */
  UI.fit = function () {
    var st = $('stage'), vw = window.innerWidth, vh = window.innerHeight, f = C.forceLandscape, s;
    UI.rotated = !!(f.enabled && f.cssRotateFallback && U.isTouch() && vh > vw);
    if (UI.rotated) { s = Math.min(vh / 960, vw / 540); st.style.transform = 'translate(-50%,-50%) rotate(90deg) scale(' + s + ')'; }
    else { s = Math.min(vw / 960, vh / 540); st.style.transform = 'translate(-50%,-50%) scale(' + s + ')'; }
  };
  UI.tryLandscape = function () { // gọi trong lúc bấm CHƠI (cần thao tác của người dùng)
    var f = C.forceLandscape;
    if (!f.enabled || !U.isTouch()) return;
    var el = document.documentElement;
    var lock = function () {
      try {
        if (f.tryOrientationLock && window.screen && screen.orientation && screen.orientation.lock) {
          var p = screen.orientation.lock('landscape');
          if (p && p.then) p.then(function () { setTimeout(UI.fit, 300); }, function () {});
        }
      } catch (e) { /* bỏ qua */ }
    };
    try {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f.tryFullscreen && req && !document.fullscreenElement && !document.webkitFullscreenElement) {
        var r = req.call(el);
        if (r && r.then) r.then(lock, lock); else lock();
      } else lock();
    } catch (e) { lock(); }
  };

  /* ---------- hiển thị màn hình ---------- */
  UI.show = function (name) {
    SCREENS.forEach(function (n) { $('scr-' + n).classList.toggle('hidden', n !== name); });
  };
  UI.playing = function (on) {
    $('hud').classList.toggle('hidden', !on);
    $('controls').classList.toggle('hidden', !on);
    $('skills').classList.toggle('hidden', !on);
  };
  UI.toast = function (msg, ms) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(UI._tt); UI._tt = setTimeout(function () { t.classList.remove('show'); }, ms || 1400);
  };

  /* ---------- HUD ---------- */
  UI.hud = function (o) {
    var L = UI.last, k;
    var set = function (id, key, val) { if (L[key] !== val) { L[key] = val; $(id).textContent = val; } };
    set('hud-score', 'score', String(o.score)); set('hud-high', 'high', 'KỈ LỤC ' + o.high);
    set('hud-coin', 'coin', String(o.coins)); set('hud-star', 'star', String(o.stars)); set('hud-season', 'season', o.season);
    k = o.combo >= 2 ? 'COMBO x' + o.combo + '!' : '';
    if (L.combo !== k) { L.combo = k; var el = $('hud-combo'); el.textContent = k; el.classList.remove('show'); if (k) { void el.offsetWidth; el.classList.add('show'); } }
  };
  UI.refreshSkills = function (active) {
    document.querySelectorAll('.skill').forEach(function (b) {
      var id = b.getAttribute('data-skill'), n = S.count(id), frac = (active && active[id]) || 0;
      b.querySelector('.cnt').textContent = n;
      b.querySelector('.key').textContent = C.skills[id].key;
      b.classList.toggle('off', n <= 0 && frac <= 0);
      b.classList.toggle('active', frac > 0);
      b.style.setProperty('--p', Math.round(frac * 100));
    });
  };
  UI.shakeSkill = function (id) {
    var b = document.querySelector('.skill[data-skill="' + id + '"]'); if (!b) return;
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  };

  /* ---------- Menu ---------- */
  UI.refreshMenu = function () {
    $('menu-coin').textContent = S.data.coins;
    $('menu-high').textContent = 'KỈ LỤC ' + S.data.high;
    var pend = window.Quests.pending(), badge = $('quest-badge');
    badge.classList.toggle('hidden', pend <= 0); badge.textContent = pend;
    $('btn-sfx').textContent = 'ÂM THANH: ' + (S.data.settings.sfx ? 'BẬT' : 'TẮT');
    var hasMusic = (C.music.url || '').trim() || C.music.chiptuneWhenNoUrl;
    $('btn-music').classList.toggle('hidden', !hasMusic);
    $('btn-music').textContent = 'NHẠC: ' + (S.data.settings.music ? 'BẬT' : 'TẮT');
    $('menu-hint').textContent = U.isTouch() ? 'Bấm các nút trên màn hình để nhảy, trượt và dùng kĩ năng' :
      'W / Space = nhảy · S = trượt · ' + C.skills.shuriken.key + ' / ' + C.skills.giant.key + ' / ' + C.skills.shield.key + ' = kĩ năng · Esc = tạm dừng';
  };

  /* ---------- Cửa hàng ---------- */
  function coinImg() { return '<img src="' + A.url('item_coin') + '" style="height:20px;vertical-align:-4px" alt="">'; }
  UI.renderShop = function (tab) {
    if (tab) UI.shopTab = tab;
    $('shop-coin').textContent = S.data.coins;
    document.querySelectorAll('#scr-shop .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-tab') === UI.shopTab); });
    var html = '', list = $('shop-list');
    if (UI.shopTab === 'items') {
      C.shop.items.forEach(function (it) {
        var have = S.count(it.id), max = C.maxStack[it.id] || 99, full = have >= max, poor = S.data.coins < it.price;
        html += '<div class="item"><img class="pv round" src="' + A.url(ICON[it.id]) + '" alt=""><div class="info">' + it.name +
          '<small>Đang có: ' + have + ' / ' + max + ' · phím ' + C.skills[it.id].key + '</small></div>' +
          '<button class="btn ' + (full ? 'gray' : 'green') + '" data-act="buy-item" data-id="' + it.id + '"' + ((full || poor) ? ' disabled' : '') + '>' + (full ? 'ĐẦY KHO' : 'MUA ' + it.price + ' ' + coinImg()) + '</button></div>';
      });
    } else {
      C.shop.skins.forEach(function (sk) {
        var owned = S.data.skins.owned.indexOf(sk.id) >= 0, eq = S.data.skins.equipped === sk.id, btn;
        if (eq) btn = '<button class="btn gray" disabled>ĐANG DÙNG</button>';
        else if (owned) btn = '<button class="btn blue" data-act="equip" data-id="' + sk.id + '">CHỌN</button>';
        else btn = '<button class="btn green" data-act="buy-skin" data-id="' + sk.id + '"' + (S.data.coins < sk.price ? ' disabled' : '') + '>MUA ' + sk.price + ' ' + coinImg() + '</button>';
        html += '<div class="item"><canvas class="pv" width="64" height="64" data-skin="' + sk.id + '"></canvas><div class="info">' + sk.name + '<small>' + (owned ? 'Đã sở hữu' : 'Chưa mua') + '</small></div>' + btn + '</div>';
      });
    }
    list.innerHTML = html;
    list.querySelectorAll('canvas[data-skin]').forEach(function (cv) {
      var sk = window.Shop.skin(cv.getAttribute('data-skin')), x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      x.drawImage(A.skinned('ninja_run', sk.hue), 128, 0, 64, 64, 0, 0, 64, 64);
    });
  };

  /* ---------- Nhiệm vụ ---------- */
  UI.renderQuests = function () {
    $('quest-coin').textContent = S.data.coins;
    var html = '';
    window.Quests.list().forEach(function (q) {
      var pct = Math.round(q.progress / q.def.goal * 100), btn;
      if (q.claimed) btn = '<button class="btn gray" disabled>ĐÃ NHẬN</button>';
      else if (q.done) btn = '<button class="btn green" data-act="claim" data-id="' + q.idx + '">NHẬN +' + q.def.reward + ' ' + coinImg() + '</button>';
      else btn = '<button class="btn gray" disabled>+' + q.def.reward + ' ' + coinImg() + '</button>';
      html += '<div class="item"><div class="info">' + q.def.text + '<div class="bar"><i style="width:' + pct + '%"></i></div><small>' + q.progress + ' / ' + q.def.goal + '</small></div>' + btn + '</div>';
    });
    $('quest-list').innerHTML = html;
  };

  /* ---------- Game over ---------- */
  UI.renderOver = function (r) {
    $('over-score').textContent = r.score;
    $('over-new').classList.toggle('hidden', !r.newHigh);
    $('over-stats').innerHTML = 'Quãng đường: ' + r.meters + ' m &nbsp;·&nbsp; Sao: ' + r.stars + ' &nbsp;·&nbsp; Phá: ' + r.breaks +
      '<br>Xu nhận được: +' + r.coins + ' ' + coinImg() + ' &nbsp;·&nbsp; Kỉ lục: ' + r.high;
  };

  /* ---------- gắn sự kiện ---------- */
  function bindHold(el, down, up) {
    var end = function () { el.classList.remove('down'); if (up) up(); };
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (x) {} down(); });
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  function click(id, fn) { $(id).addEventListener('click', function () { window.Sfx.init(); window.Sfx.play('click'); fn(); }); }

  UI.init = function () {
    document.querySelectorAll('img[data-asset]').forEach(function (im) { im.src = A.url(im.getAttribute('data-asset')); });
    UI.fit();
    window.addEventListener('resize', UI.fit); window.addEventListener('orientationchange', function () { setTimeout(UI.fit, 200); });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    $('scr-menu').querySelector('h1').innerHTML = C.title.replace(/ (?=[^ ]*$)/, '<br>');

    bindHold($('btn-jump'), function () { window.Game.press('jump'); });
    bindHold($('btn-slide'), function () { window.Game.press('slide'); }, function () { window.Game.release('slide'); });
    document.querySelectorAll('.skill').forEach(function (b) {
      bindHold(b, function () { window.Sfx.init(); window.Game.useSkill(b.getAttribute('data-skill')); });
    });
    bindHold($('btn-pause'), function () { window.Game.pause(); });

    click('btn-play', function () { UI.tryLandscape(); window.Game.startRun(); });
    click('btn-shop', function () { UI.renderShop(); UI.show('shop'); });
    click('btn-quests', function () { UI.renderQuests(); UI.show('quests'); });
    click('btn-sfx', function () { S.data.settings.sfx = !S.data.settings.sfx; S.save(); UI.refreshMenu(); window.Sfx.play('click'); });
    click('btn-music', function () { S.data.settings.music = !S.data.settings.music; S.save(); UI.refreshMenu(); window.Sfx.startMusic(); });
    click('btn-shop-back', function () { window.Game.backFromShop(); });
    click('btn-quests-back', function () { window.Game.toMenu(); });
    click('btn-resume', function () { window.Game.resume(); });
    click('btn-home', function () { window.Game.toMenu(); });
    click('btn-again', function () { window.Game.startRun(); });
    click('btn-over-shop', function () { UI.renderShop(); UI.show('shop'); window.Game.shopFromOver = true; });
    click('btn-over-home', function () { window.Game.toMenu(); });

    document.querySelectorAll('#scr-shop .tab').forEach(function (t) {
      t.addEventListener('click', function () { window.Sfx.play('click'); UI.renderShop(t.getAttribute('data-tab')); });
    });
    $('shop-list').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b || b.disabled) return;
      var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), r;
      if (act === 'buy-item') r = window.Shop.buyItem(id);
      else if (act === 'buy-skin') r = window.Shop.buySkin(id);
      else if (act === 'equip') r = { ok: window.Shop.equip(id), msg: 'Đã chọn skin' };
      if (r) { window.Sfx.play(r.ok ? 'buy' : 'deny'); UI.toast(r.msg); if (act !== 'buy-item') window.Game.skinChanged(); UI.renderShop(); }
    });
    $('quest-list').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act="claim"]'); if (!b || b.disabled) return;
      var got = window.Quests.claim(parseInt(b.getAttribute('data-id'), 10));
      if (got) { window.Sfx.play('buy'); UI.toast('+' + got + ' xu'); UI.renderQuests(); }
    });
  };

  window.UI = UI;
})();
