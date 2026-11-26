/* Thế giới nền: bầu trời, ngày/đêm, 4 mùa, núi đồi, mặt đất, hạt thời tiết */
(function () {
  var C = window.GAME_CONFIG, U = window.U;
  var W = C.world.width, H = C.world.height, GY = C.world.groundY;
  var SEASONS = C.seasons.order, PAL = C.seasons.palettes;
  var KEYS = ['skyTop', 'skyBottom', 'mount', 'hill', 'tree', 'grass', 'grassDark', 'dirt', 'dirtDark'];

  var World = {
    p: 0.05,            // giờ trong ngày 0..1
    seasonIdx: 0, prevIdx: 0, blend: 1,
    demo: false, demoSeasonT: 0,
    scroll: 0, pal: {}, L: 1, particles: [], clouds: [], stars: [], mount: [], hills: [], trees: [], pAcc: 0
  };

  function genRidge(n, base, amp, rough, rnd) { // đường núi lặp vòng
    var a = [], v = base, i;
    for (i = 0; i < n; i++) { v += (rnd() - 0.5) * rough; v = U.clamp(v, base - amp, base + amp); a.push(v); }
    for (i = 0; i < 40; i++) a[n - 1 - i] = U.lerp(a[n - 1 - i], a[0], 1 - i / 40); // nối đầu-cuối cho mượt
    return a;
  }

  World.init = function () {
    var rnd = U.rng(20241126), i;
    World.mount = genRidge(960, 60, 38, 7, rnd);
    World.hills = genRidge(960, 30, 20, 5, rnd);
    World.trees = [];
    for (i = 0; i < 14; i++) World.trees.push({ x: i * 70 + rnd() * 40, s: 0.8 + rnd() * 0.7 });
    World.stars = [];
    for (i = 0; i < 46; i++) World.stars.push({ x: rnd() * W, y: rnd() * (GY - 70), ph: rnd() * 6.28 });
    World.clouds = [];
    for (i = 0; i < 6; i++) World.clouds.push({ x: rnd() * W, y: 18 + rnd() * 70, s: 0.7 + rnd() * 0.8 });
    World.setSeason(0, true);
  };

  World.reset = function (demo) {
    World.demo = !!demo; World.demoSeasonT = 0; World.scroll = 0; World.p = 0.05;
    World.particles = []; World.setSeason(0, true);
  };

  World.setSeason = function (idx, instant) {
    if (!instant && idx === World.seasonIdx) return;
    World.prevIdx = instant ? idx : World.seasonIdx;
    World.seasonIdx = idx; World.blend = instant ? 1 : 0;
    World.computePal();
  };
  World.seasonName = function () { return PAL[SEASONS[World.seasonIdx]].name; };

  World.computePal = function () {
    var a = PAL[SEASONS[World.prevIdx]], b = PAL[SEASONS[World.seasonIdx]], t = U.smooth(World.blend);
    for (var i = 0; i < KEYS.length; i++) World.pal[KEYS[i]] = U.mix(a[KEYS[i]], b[KEYS[i]], t);
  };

  function daylight(p) { // 1 = ban ngày, 0 = ban đêm
    if (p < 0.45) return 1;
    if (p < 0.56) return 1 - U.smooth((p - 0.45) / 0.11);
    if (p < 0.88) return 0;
    return U.smooth((p - 0.88) / 0.12);
  }

  World.update = function (dt, speed, meters) {
    var dayLen = World.demo ? C.time.demoDayLengthSec : C.time.dayLengthSec;
    World.p = (World.p + dt / dayLen) % 1;
    World.L = daylight(World.p);
    World.scroll += speed * dt;
    // mùa
    var idx;
    if (World.demo) { World.demoSeasonT += dt; idx = Math.floor(World.demoSeasonT / C.time.demoSeasonSec) % SEASONS.length; }
    else idx = Math.floor(meters / C.time.seasonEveryMeters) % SEASONS.length;
    if (idx !== World.seasonIdx) World.setSeason(idx);
    if (World.blend < 1) { World.blend = Math.min(1, World.blend + dt / 1.4); World.computePal(); }
    // mây
    World.clouds.forEach(function (c) { c.x -= (6 + speed * 0.03) * dt * c.s; if (c.x < -50) { c.x = W + 20; c.y = 18 + Math.random() * 70; } });
    // hạt thời tiết
    var type = PAL[SEASONS[World.seasonIdx]].particle;
    if (type !== 'none') {
      World.pAcc += dt * C.seasons.particleRate * (World.demo ? 2 : 1);
      while (World.pAcc >= 1) { World.pAcc -= 1; spawnParticle(type); }
    }
    var ps = World.particles, i;
    for (i = ps.length - 1; i >= 0; i--) {
      var q = ps[i];
      q.life += dt;
      q.x += (q.vx - speed * 0.55) * dt + Math.sin(q.life * q.sw) * 8 * dt;
      q.y += q.vy * dt;
      if (q.y > GY + 40 || q.x < -10) ps.splice(i, 1);
    }
  };
  function spawnParticle(type) {
    if (World.particles.length > 140) return;
    var o = { x: U.rand(0, W + 80), y: -6, vx: 0, vy: 0, life: 0, sw: U.rand(2, 4), type: type, c: '#fff', s: 2 };
    if (type === 'snow') { o.vy = U.rand(24, 52); o.vx = -8; o.s = Math.random() < 0.3 ? 3 : 2; o.c = '#ffffff'; }
    else if (type === 'petal') { o.vy = U.rand(20, 40); o.vx = -20; o.c = Math.random() < 0.5 ? '#ffb3d1' : '#ff8fbd'; }
    else if (type === 'leaf') { o.vy = U.rand(28, 50); o.vx = -24; o.c = ['#d2691e', '#e8892b', '#b5521a', '#f0b429'][U.randi(0, 3)]; o.s = 3; }
    World.particles.push(o);
  }

  function px(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  World.drawBack = function (ctx) {
    var pal = World.pal, L = World.L, i, n = 18, bandH = Math.ceil(GY / n) + 1;
    var night = C.seasons.night;
    // bầu trời (dải màu cứng cho đúng chất pixel)
    for (i = 0; i < n; i++) {
      var dayC = U.mixRgb(pal.skyTop, pal.skyBottom, i / (n - 1));
      var nightC = U.mix(night.skyTop, night.skyBottom, i / (n - 1));
      ctx.fillStyle = U.mixRgb(nightC, dayC, L);
      ctx.fillRect(0, i * bandH, W, bandH);
    }
    // sao
    if (L < 0.9) {
      var t = performance.now() / 600;
      World.stars.forEach(function (s) {
        ctx.globalAlpha = (1 - L) * (0.55 + 0.45 * Math.sin(t + s.ph));
        ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      });
      ctx.globalAlpha = 1;
    }
    // mặt trời / mặt trăng chạy theo vòng cung
    var sp = World.p < 0.5 ? World.p / 0.5 : (World.p - 0.5) / 0.5, ax = U.lerp(36, W - 36, sp), ay = 120 - Math.sin(Math.PI * sp) * 90;
    if (World.p < 0.55) { // mặt trời
      ctx.fillStyle = '#fff3a0'; ctx.fillRect(Math.round(ax) - 7, Math.round(ay) - 9, 14, 18); ctx.fillRect(Math.round(ax) - 9, Math.round(ay) - 7, 18, 14);
      ctx.fillStyle = '#ffd83a'; ctx.fillRect(Math.round(ax) - 5, Math.round(ay) - 7, 10, 14); ctx.fillRect(Math.round(ax) - 7, Math.round(ay) - 5, 14, 10);
    } else if (World.p > 0.5) { // mặt trăng
      ctx.globalAlpha = 1 - L;
      ctx.fillStyle = '#e8edf7'; ctx.fillRect(Math.round(ax) - 6, Math.round(ay) - 8, 12, 16); ctx.fillRect(Math.round(ax) - 8, Math.round(ay) - 6, 16, 12);
      ctx.fillStyle = '#c3cce0'; ctx.fillRect(Math.round(ax) + 1, Math.round(ay) - 3, 3, 3); ctx.fillRect(Math.round(ax) - 4, Math.round(ay) + 2, 2, 2);
      ctx.globalAlpha = 1;
    }
    // mây
    ctx.globalAlpha = 0.25 + 0.65 * L;
    World.clouds.forEach(function (c) {
      var x = Math.round(c.x), y = Math.round(c.y), s = c.s;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + 6 * s, 34 * s, 8 * s); ctx.fillRect(x + 6 * s, y + 2 * s, 20 * s, 8 * s); ctx.fillRect(x + 14 * s, y - 2 * s, 12 * s, 6 * s);
      ctx.fillStyle = 'rgba(160,185,215,0.5)'; ctx.fillRect(x, y + 12 * s, 34 * s, 2 * s);
    });
    ctx.globalAlpha = 1;
    // núi xa (cuộn chậm)
    var off = Math.floor(World.scroll * 0.06), m = World.mount, len = m.length;
    ctx.fillStyle = pal.mount;
    for (i = 0; i < W; i += 2) { var h1 = Math.round(m[(i + off) % len]); ctx.fillRect(i, GY - h1, 2, h1); }
    // đồi gần + cây
    off = Math.floor(World.scroll * 0.2); var hl = World.hills;
    ctx.fillStyle = pal.hill;
    for (i = 0; i < W; i += 2) { var h2 = Math.round(hl[(i + off) % hl.length]); ctx.fillRect(i, GY - h2, 2, h2); }
    var span = 14 * 70, ox = off % span;
    World.trees.forEach(function (tr) {
      var x = Math.round(((tr.x - ox) % span + span) % span - 30), base = GY - Math.round(hl[Math.floor((x + off + 200) % hl.length + hl.length) % hl.length]) + 6;
      if (x < -24 || x > W + 8) return;
      var s = tr.s, tw = Math.round(3 * s), th = Math.round(12 * s), cw = Math.round(18 * s);
      px(ctx, x + cw / 2 - tw / 2, base - th, tw, th, '#5a3a22');
      px(ctx, x, base - th - Math.round(8 * s), cw, Math.round(10 * s), pal.tree);
      px(ctx, x + Math.round(3 * s), base - th - Math.round(13 * s), cw - Math.round(6 * s), Math.round(7 * s), pal.tree);
    });
  };

  World.drawGround = function (ctx) {
    var pal = World.pal, off = Math.floor(World.scroll) % 32, x;
    px(ctx, 0, GY, W, H - GY, pal.dirt);
    px(ctx, 0, GY, W, 6, pal.grass);
    px(ctx, 0, GY + 6, W, 2, pal.grassDark);
    // cỏ lởm chởm + vết đất cuộn theo tốc độ
    for (x = -32; x < W + 32; x += 8) {
      var t = Math.floor((x + Math.floor(World.scroll) - off) / 8), r = (t * 2654435761 >>> 0) % 7, xx = x - off + (Math.floor(World.scroll) % 8 === 0 ? 0 : 0);
      px(ctx, x - (Math.floor(World.scroll) % 8), GY - 1, 2, 1 + (r % 2), pal.grass);
    }
    for (x = -16; x < W + 16; x += 16) {
      var tt = Math.floor((x + Math.floor(World.scroll)) / 16), rr = (tt * 2246822519 >>> 0) % 11;
      var sx = x - (Math.floor(World.scroll) % 16);
      px(ctx, sx + rr, GY + 12 + (rr % 3) * 8, 6, 2, pal.dirtDark);
      px(ctx, sx + 8 - (rr % 5), GY + 26 + (rr % 2) * 9, 4, 2, pal.dirtDark);
    }
  };

  World.drawFront = function (ctx) { // hạt thời tiết + phủ màu đêm/hoàng hôn
    var ps = World.particles, i;
    for (i = 0; i < ps.length; i++) { var q = ps[i]; ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s); }
    var L = World.L, night = C.seasons.night;
    if (L < 1) { ctx.globalAlpha = night.overlayAlpha * (1 - L); ctx.fillStyle = night.overlay; ctx.fillRect(0, 0, W, H); }
    var dusk = 4 * L * (1 - L);
    if (dusk > 0.02) { ctx.globalAlpha = 0.2 * dusk; ctx.fillStyle = '#ff8a3c'; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1;
  };

  window.World = World;
})();
