/* Vòng lặp chính, luật chơi, kĩ năng, điểm số, bot demo ở màn hình chính */
(function () {
  var C = window.GAME_CONFIG, U = window.U, S = window.Save, A = window.Assets, Sfx = window.Sfx;
  var W = window.World, E = window.Entities, P = window.Player, Q = window.Quests, Shop = window.Shop, UI = window.UI;
  var GY = C.world.groundY, WW = C.world.width, HH = C.world.height;
  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var NAME = { shuriken: 'PHI TIÊU', giant: 'KHỔNG LỒ', shield: 'KHIÊN' };
  var DEMO_SPEED = 255;

  var G = { mode: 'boot', shopFromOver: false, shake: 0, hudT: 0 };

  function sfx(n) { if (G.mode !== 'menu') Sfx.play(n); } // màn hình chính (demo) không phát tiếng

  function resetRun(demo) {
    E.reset(); P.reset(); P.hue = Shop.equippedHue(); W.reset(demo);
    G.time = 0; G.speed = C.speed.base; G.meters = 0; G.bonus = 0; G.stars = 0; G.runCoins = 0; G.breaks = 0;
    G.combo = 0; G.comboT = 0; G.cool = 0; G.deadT = 0; G.shake = 0; G.botCool = 0; G.result = null;
  }
  function curSpeed() {
    if (G.mode === 'menu') return DEMO_SPEED;
    var s = C.speed.base + C.speed.accel * G.time;
    if (C.speed.max != null) s = Math.min(s, C.speed.max);
    return P.isGiant() ? s * C.skills.giant.speedMul : s;
  }
  function score() { return Math.floor(G.meters) * C.scoring.perMeter + G.bonus; }

  /* ---------- combo + phá chướng ngại ---------- */
  function onBreak(o, by) {
    var sc = C.scoring;
    G.combo = (G.comboT > 0) ? Math.min(sc.comboMax, G.combo + 1) : 1;
    G.comboT = sc.comboWindowSec;
    var pts = sc.breakBase * G.combo;
    G.bonus += pts; G.breaks++; Q.add('breaks', 1);
    E.popup(o.x + o.w / 2, o.y - 4, '+' + pts, G.combo >= 3 ? '#ff9a3a' : '#fff');
    if (G.combo >= 2) sfx('combo'); else sfx('smash');
  }
  E.onBreak = function (o, by) { if (G.mode === 'playing') onBreak(o, by); };

  /* ---------- kĩ năng ---------- */
  function deny(id) { sfx('deny'); UI.shakeSkill(id); }
  G.useSkill = function (id) {
    if (G.mode !== 'playing' || P.dead) return;
    var n = S.count(id), sk = C.skills;
    if (id === 'shuriken') {
      if (G.cool > 0) return;
      if (n <= 0) return deny(id);
      S.useInv('shuriken'); G.cool = sk.shuriken.cooldownSec; P.throwT = 0.25;
      E.shoot(P.x + 24, P.feet - (P.isGiant() ? 42 : 36), sk.shuriken.speed); sfx('throw_'); Q.add('shurikens', 1);
    } else if (id === 'giant') {
      if (P.isGiant()) return deny(id);
      if (n <= 0) return deny(id);
      S.useInv('giant'); P.giantT = sk.giant.durationSec; P.sliding = false; sfx('giant'); G.shake = 5; Q.add('giant', 1);
      E.burst(P.x, P.feet - 30, ['#ff2a2a', '#ff7a4a', '#ffd84a'], 18, 220);
    } else if (id === 'shield') {
      if (P.shieldT > 0) return deny(id);
      if (n <= 0) return deny(id);
      S.useInv('shield'); P.shieldT = sk.shield.durationSec; P.shieldOn = true; sfx('shield'); Q.add('shield', 1);
    }
    UI.refreshSkills(activeFrac());
  };
  function activeFrac() {
    return { giant: P.giantT > 0 ? P.giantT / C.skills.giant.durationSec : 0, shield: P.shieldT > 0 ? P.shieldT / C.skills.shield.durationSec : 0 };
  }

  /* ---------- nhặt vật phẩm ---------- */
  function collect(it, demo) {
    if (demo) { E.burst(it.x, it.y, ['#ffd84a', '#ffffff'], 4, 70); return; }
    if (it.kind === 'star') {
      G.stars++; G.bonus += C.scoring.star; Q.add('stars', 1); sfx('star'); E.burst(it.x, it.y, ['#ffe27a', '#fff'], 4, 70);
    } else if (it.kind === 'coin') {
      G.runCoins += C.coin.perPickup; Q.add('coins', C.coin.perPickup); sfx('coin'); E.popup(it.x, it.y - 8, '+' + C.coin.perPickup, '#ffd84a');
    } else {
      var id = U.pickWeighted(C.gift.weights), added = S.addInv(id, C.gift.amount[id]);
      sfx('gift'); E.burst(it.x, it.y, ['#ff4a4a', '#4aa0ff', '#ffd84a', '#fff'], 14, 150);
      E.popup(it.x, it.y - 12, added > 0 ? '+' + added + ' ' + NAME[id] : 'KHO ĐẦY!', added > 0 ? '#9dff9a' : '#ff8a8a');
      UI.refreshSkills(activeFrac());
    }
  }

  /* ---------- va chạm ---------- */
  function collide(demo) {
    var hb = P.hit(), giant = P.isGiant(), i, o, r;
    for (i = 0; i < E.obs.length; i++) {
      o = E.obs[i]; if (o.dead) continue;
      r = E.hitRect(o);
      if (!U.rectsOverlap(hb, r)) continue;
      if (giant || demo) {
        E.destroy(o);
        if (giant && !demo) { onBreak(o, 'giant'); G.shake = Math.max(G.shake, 3); }
        continue;
      }
      if (o.kind === 'crate' && P.feet <= o.y + 6) continue;   // đứng/đáp lên mặt thùng thì an toàn
      if (P.invulT > 0) continue;
      if (P.shieldOn) {                                           // khiên đỡ 1 lần
        P.shieldOn = false; P.invulT = 1.0; E.destroy(o); sfx('pop'); G.shake = 4;
        E.popup(P.x, P.feet - 62, 'KHIÊN VỠ!', '#d6b3ff'); UI.refreshSkills(activeFrac()); continue;
      }
      die(); return;
    }
    var ib = { x: hb.x - 4, y: hb.y - 4, w: hb.w + 8, h: hb.h + 8 };
    for (i = 0; i < E.items.length; i++) {
      var it = E.items[i]; if (it.dead) continue;
      if (U.rectsOverlap(ib, { x: it.x - 8, y: it.y - 8, w: 16, h: 16 })) { it.dead = true; collect(it, demo); }
    }
  }

  /* ---------- chết / kết thúc ---------- */
  function die() {
    P.dead = true; P.vy = -380; P.sliding = false; G.mode = 'dead'; G.deadT = 0; G.shake = 9;
    Sfx.play('die'); Sfx.stopMusic(); E.burst(P.x, P.feet - 30, ['#111', '#c8201a', '#5b4030', '#444'], 22, 230);
    UI.playing(true);
  }
  function gameOver() {
    var sc = score(), coins = G.runCoins + Math.floor(sc / 100) * C.scoring.coinsPer100Score, newHigh = sc > S.data.high;
    if (newHigh) S.data.high = sc;
    S.data.stats.runs++; S.data.stats.meters += Math.floor(G.meters);
    Q.add('meters', Math.floor(G.meters)); Q.setMax('score', sc);
    S.addCoins(coins);
    G.result = { score: sc, newHigh: newHigh, meters: Math.floor(G.meters), stars: G.stars, breaks: G.breaks, coins: coins, high: S.data.high };
    G.mode = 'over'; UI.playing(false); UI.renderOver(G.result); UI.show('over');
  }

  /* ---------- bot ở màn hình chính ---------- */
  function bot(dt, speed) {
    var target = null, i, o;
    for (i = 0; i < E.obs.length; i++) { o = E.obs[i]; if (!o.dead && o.x + o.w > P.x - 14 && (!target || o.x < target.x)) target = o; }
    var slideNeeded = false;
    if (target) {
      var dist = target.x - (P.x + 8);
      var lead = speed * 0.3 - (target.w + 16) / 2;
      if (target.type === 'bird_mid' || target.kind === 'drone') {
        if (dist < 34 + speed * 0.12 && target.x + target.w > P.x - 26) slideNeeded = true;
      } else if (dist < lead && dist > -target.w * 0.5 && P.onGround) P.pressJump();
      G.botCool -= dt;
      if (G.botCool <= 0 && dist > 90 && dist < 230 && (target.kind === 'crate' || target.kind === 'bird' || target.kind === 'drone') && Math.random() < dt * 1.6) {
        E.shoot(P.x + 24, P.feet - 36, C.skills.shuriken.speed); P.throwT = 0.25; G.botCool = 1.2;
      }
    }
    P.setSlide(slideNeeded);
  }

  /* ---------- cập nhật mỗi khung ---------- */
  G.update = function (dt) {
    if (G.mode === 'paused' || G.mode === 'boot') return;
    G.shake = Math.max(0, G.shake - dt * 22);
    var playing = G.mode === 'playing', demo = G.mode === 'menu', speed;
    if (playing || demo) {
      speed = curSpeed(); G.speed = speed;
      if (playing) {
        G.time += dt; G.cool = Math.max(0, G.cool - dt);
        G.comboT -= dt; if (G.comboT <= 0 && G.combo > 0) G.combo = 0;
        if (P.giantT > 0) { P.giantT -= dt; if (P.giantT <= 0) { P.giantT = 0; P.invulT = Math.max(P.invulT, 1.0); UI.refreshSkills(activeFrac()); } }
        G.meters += speed * dt / C.scoring.pixelsPerMeter;
      } else { G.botT = (G.botT || 0) + dt; bot(dt, speed); P.throwT = Math.max(0, P.throwT); }
      W.update(dt, speed, G.meters);
      E.update(dt, speed, { px: P.x, py: P.feet - 30, magnet: P.shieldT > 0, magnetR: C.skills.shield.magnetRadius });
      P.update(dt, sfx);
      collide(demo);
      if (P.landed) { P.landed = false; E.burst(P.x, P.feet, ['#d9d2b8', '#a89f86'], 3, 50); }
      if (playing) {
        G.hudT -= dt;
        if (G.hudT <= 0) { G.hudT = 0.08; UI.hud({ score: score(), high: Math.max(S.data.high, score()), coins: G.runCoins, stars: G.stars, combo: G.combo, season: W.seasonName() }); UI.refreshSkills(activeFrac()); }
      }
    } else { // dead / over: thế giới đứng yên, hiệu ứng vẫn chạy
      W.update(dt, 20, G.meters);
      E.update(dt, 0, { noSpawn: true, px: P.x, py: P.feet, magnet: false });
      P.update(dt, function () {});
      if (G.mode === 'dead') { G.deadT += dt; if (G.deadT > 1.0) gameOver(); }
    }
  };

  /* ---------- vẽ ---------- */
  G.render = function () {
    ctx.save();
    if (G.shake > 0.3) ctx.translate(Math.round(U.rand(-G.shake, G.shake) * 0.5), Math.round(U.rand(-G.shake, G.shake) * 0.5));
    W.drawBack(ctx); W.drawGround(ctx);
    E.drawObstacles(ctx); E.drawItems(ctx);
    P.draw(ctx);
    E.drawShots(ctx); E.drawFx(ctx);
    if (P.isGiant() && G.mode === 'playing') { // vạch tốc độ khi hoá Khổng Lồ
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      for (var i = 0; i < 7; i++) ctx.fillRect(Math.floor(U.rand(0, WW)), Math.floor(U.rand(10, GY - 10)), Math.floor(U.rand(18, 40)), 1);
    }
    W.drawFront(ctx);
    ctx.restore();
  };

  /* ---------- điều khiển ---------- */
  G.press = function (a) {
    if (G.mode !== 'playing') return;
    if (a === 'jump') P.pressJump();
    else if (a === 'slide') P.setSlide(true);
  };
  G.release = function (a) { if (a === 'slide') P.setSlide(false); };

  G.startRun = function () {
    Sfx.init(); resetRun(false); G.mode = 'playing'; P.invulT = 0.6;
    UI.show(null); UI.playing(true); Q.ensure(); UI.last = {}; G.hudT = 0; UI.refreshSkills(activeFrac());
    Sfx.startMusic();
  };
  G.bot = bot; // dùng cho kiểm thử tự động
  G.pause = function () {
    if (G.mode !== 'playing') return;
    G.mode = 'paused'; P.setSlide(false); UI.show('pause'); Sfx.setMusicVolumeDuck(true); S.save();
  };
  G.resume = function () {
    if (G.mode !== 'paused') return;
    G.mode = 'playing'; UI.show(null); Sfx.setMusicVolumeDuck(false);
  };
  G.showMenu = function () { UI.refreshMenu(); UI.show('menu'); };
  G.toMenu = function () {
    var wasMenu = G.mode === 'menu';
    G.mode = 'menu'; if (!wasMenu) resetRun(true);
    G.shopFromOver = false; Sfx.stopMusic(); UI.playing(false); G.showMenu(); S.save();
  };
  G.backFromShop = function () {
    if (G.shopFromOver && G.result) { G.shopFromOver = false; UI.renderOver(G.result); UI.show('over'); }
    else G.showMenu();
  };
  G.skinChanged = function () { P.hue = Shop.equippedHue(); };

  function bindKeys() {
    var map = { Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyS: 'slide', ArrowDown: 'slide' };
    var skillKeys = {};
    Object.keys(C.skills).forEach(function (id) { skillKeys['Key' + C.skills[id].key.toUpperCase()] = id; });
    window.addEventListener('keydown', function (e) {
      Sfx.init();
      if (['Space', 'ArrowUp', 'ArrowDown'].indexOf(e.code) >= 0) e.preventDefault();
      if (e.code === 'Escape' || e.code === 'KeyP') { if (G.mode === 'playing') G.pause(); else if (G.mode === 'paused') G.resume(); return; }
      if (e.code === 'Enter' && G.mode === 'menu' && !document.getElementById('scr-menu').classList.contains('hidden')) { UI.tryLandscape(); G.startRun(); return; }
      if (e.code === 'KeyM') { S.data.settings.sfx = !S.data.settings.sfx; S.save(); UI.refreshMenu(); return; }
      if (e.repeat) return;
      if (map[e.code]) G.press(map[e.code]);
      else if (skillKeys[e.code]) G.useSkill(skillKeys[e.code]);
    });
    window.addEventListener('keyup', function (e) { if (map[e.code] === 'slide') G.release('slide'); });
    window.addEventListener('blur', function () { G.release('slide'); if (G.mode === 'playing') G.pause(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && G.mode === 'playing') G.pause(); });
    window.addEventListener('beforeunload', function () { S.save(); });
  }

  /* ---------- khởi động ---------- */
  var last = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    try { G.update(dt); G.render(); } catch (err) { if (window.console) console.error(err); }
    requestAnimationFrame(frame);
  }
  function boot() {
    ctx.imageSmoothingEnabled = false;
    A.load().then(function () {
      W.init(); UI.init(); bindKeys(); Q.ensure();
      resetRun(true); G.mode = 'menu'; G.showMenu();
      document.getElementById('loading').classList.add('hidden');
      requestAnimationFrame(frame);
    });
  }
  window.Game = G;
  boot();
})();
