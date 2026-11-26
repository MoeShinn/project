/* Chướng ngại vật, vật phẩm, phi tiêu, hiệu ứng vỡ và bộ sinh màn chơi */
(function () {
  var C = window.GAME_CONFIG, U = window.U, A = window.Assets;
  var W = C.world.width, GY = C.world.groundY;

  // inset = [trái, trên, phải, dưới] thu nhỏ hitbox cho dễ chịu; bottom = khoảng cách từ mặt đất lên đáy vật thể bay
  var OB = {
    crate_a:  { img: 'obstacle_crate_a', kind: 'crate',  inset: [0, 0, 0, 0] },
    crate_b:  { img: 'obstacle_crate_b', kind: 'crate',  inset: [0, 0, 0, 0] },
    spikes:   { img: 'obstacle_spikes',  kind: 'spikes', inset: [5, 5, 5, 0] },
    rock:     { img: 'obstacle_rock',    kind: 'rock',   inset: [6, 7, 6, 0] },
    bird_low: { img: 'obstacle_bird',    kind: 'bird',   inset: [7, 7, 7, 7], bottom: 6,  extraV: 70 },
    bird_mid: { img: 'obstacle_bird',    kind: 'bird',   inset: [7, 7, 7, 7], bottom: 26, extraV: 70 },
    drone:    { img: 'obstacle_drone',   kind: 'drone',  inset: [7, 7, 7, 8], bottom: 36, bob: 3 }
  };
  var DEBRIS = {
    crate: ['#8a5a32', '#b27b45', '#5c3a1c', '#d6a56b'], spikes: ['#555a63', '#8a909b', '#2d3036'],
    rock: ['#7f8890', '#9aa3ab', '#4c545c'], bird: ['#c81f1f', '#8a1a12', '#f0b23a'], drone: ['#6d747d', '#2d3036', '#ff2a2a']
  };

  var E = { obs: [], items: [], shots: [], fx: [], pops: [], sp: null, onBreak: null };

  E.reset = function () {
    E.obs = []; E.items = []; E.shots = []; E.fx = []; E.pops = [];
    E.sp = { gapLeft: W * 0.55, giftTimer: C.gift.intervalSec, pendingGift: false };
  };

  E.hitRect = function (o) {
    var bob = o.bob ? Math.sin(o.t * 3) * o.bob : 0;
    return { x: o.x + o.ins[0], y: o.y + bob + o.ins[1], w: o.w - o.ins[0] - o.ins[2], h: o.h - o.ins[1] - o.ins[3] };
  };

  function addObstacle(type, x) {
    var d = OB[type], img = A.img[d.img], frames = A.frames[d.img] || 1;
    var w = img.width / frames, h = img.height;
    var y = d.bottom ? GY - d.bottom - h : GY - h;
    var o = { type: type, kind: d.kind, img: d.img, frames: frames, x: x, y: y, w: w, h: h, ins: d.inset, extraV: d.extraV || 0, bob: d.bob || 0, t: Math.random() * 6, frame: 0, dead: false };
    E.obs.push(o); return o;
  }
  function addItem(kind, x, y) { E.items.push({ kind: kind, x: x, y: y, t: Math.random() * 6, dead: false }); }

  /* ---------- sinh màn chơi ---------- */
  function spawnNext(speed) {
    var S = C.spawn, type = U.pickWeighted(S.weights), x = W + 24, d = OB[type];
    if (d.extraV) x += d.extraV * ((W + 24 - C.player.x) / speed); // chim bay nhanh hơn -> sinh xa hơn cho kịp thời gian phản ứng
    var o = addObstacle(type, x), width = o.w;
    if (type === 'spikes' && speed >= S.doubleSpikesFromSpeed && Math.random() < 0.4) { addObstacle('spikes', x + o.w - 2); width += o.w - 2; }
    var prog = U.clamp((speed - C.speed.base) / 300, 0, 1);
    var gapPx = speed * (U.lerp(S.gapSecStart, S.gapSecMin, prog) + U.rand(0, S.gapRandom));
    E.sp.gapLeft = width + gapPx;
    // vật phẩm
    var groundObs = (o.kind === 'crate' || o.kind === 'spikes' || o.kind === 'rock' || type === 'bird_low');
    var rs = x + width + 28, re = x + E.sp.gapLeft - 28, i, n;
    if (E.sp.pendingGift && re - rs > 20) {
      E.sp.pendingGift = false; addItem('gift', (rs + re) / 2, GY - 30);
    } else if (groundObs && Math.random() < S.starArcChance) {
      n = 6;
      for (i = 0; i < n; i++) { var t = i / (n - 1); addItem('star', x - 36 + t * (width + 72), GY - 20 - Math.sin(Math.PI * t) * (o.h + 34)); }
    } else if (re - rs > 70) {
      var r = Math.random();
      if (r < S.coinLineChance) { n = C.coin.lineLength; for (i = 0; i < n; i++) addItem('coin', rs + 10 + i * 20, GY - 28); }
      else if (r < S.coinLineChance + S.starLineChance) { n = 5; for (i = 0; i < n; i++) addItem('star', rs + 10 + i * 20, GY - 28); }
    }
  }

  /* ---------- hiệu ứng ---------- */
  E.burst = function (x, y, colors, n, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = U.rand(0.3, 1) * (power || 160);
      E.fx.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0, max: U.rand(0.35, 0.8), c: colors[U.randi(0, colors.length - 1)], s: U.randi(2, 3) });
    }
  };
  E.popup = function (x, y, text, color) { E.pops.push({ x: x, y: y, text: text, color: color || '#fff', life: 0 }); };

  E.destroy = function (o) {
    if (o.dead) return;
    o.dead = true;
    E.burst(o.x + o.w / 2, o.y + o.h / 2, DEBRIS[o.kind], o.kind === 'rock' ? 16 : 12, 190);
  };
  E.shoot = function (x, y, speed) { E.shots.push({ x: x, y: y, vx: speed, rot: 0 }); };

  /* ---------- cập nhật ---------- */
  E.update = function (dt, speed, ctx) {
    var i, o, it, s, S = C.spawn;
    // sinh
    if (!ctx.noSpawn) {
      E.sp.gapLeft -= speed * dt;
      if (E.sp.gapLeft <= 0) spawnNext(speed);
      E.sp.giftTimer -= dt;
      if (E.sp.giftTimer <= 0) { E.sp.giftTimer += C.gift.intervalSec; if (Math.random() < C.gift.chance) E.sp.pendingGift = true; }
    }
    // chướng ngại
    for (i = E.obs.length - 1; i >= 0; i--) {
      o = E.obs[i]; o.t += dt; o.x -= (speed + o.extraV) * dt;
      if (o.frames > 1) { o.ft = (o.ft || 0) + dt; if (o.ft > 0.15) { o.ft = 0; o.frame = (o.frame + 1) % o.frames; } }
      if (o.dead || o.x < -o.w - 20) E.obs.splice(i, 1);
    }
    // vật phẩm (nam châm hút)
    for (i = E.items.length - 1; i >= 0; i--) {
      it = E.items[i]; it.t += dt; it.x -= speed * dt;
      if (ctx.magnet && !ctx.noItems) {
        var dx = ctx.px - it.x, dy = ctx.py - it.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ctx.magnetR && dist > 1) { var pull = 380 * dt; it.x += dx / dist * pull; it.y += dy / dist * pull; }
      }
      if (it.dead || it.x < -20) E.items.splice(i, 1);
    }
    // phi tiêu
    for (i = E.shots.length - 1; i >= 0; i--) {
      s = E.shots[i]; s.x += s.vx * dt; s.rot += dt * 22;
      var hitSomething = false;
      for (var j = 0; j < E.obs.length && !hitSomething; j++) {
        o = E.obs[j]; if (o.dead) continue;
        var r = E.hitRect(o);
        if (s.x + 6 > r.x - 2 && s.x - 6 < r.x + r.w + 2 && s.y + 12 > r.y && s.y - 12 < r.y + r.h) {
          hitSomething = true;
          if (C.skills.shuriken.breaks.indexOf(o.kind) >= 0) { E.destroy(o); if (E.onBreak) E.onBreak(o, 'shuriken'); }
          else E.burst(s.x, s.y, ['#ffffff', '#c0c6cf', '#ffd84a'], 6, 120);
        }
      }
      if (hitSomething || s.x > W + 20) E.shots.splice(i, 1);
    }
    // hạt vỡ + chữ nổi
    for (i = E.fx.length - 1; i >= 0; i--) {
      var f = E.fx[i]; f.life += dt; f.vy += 620 * dt; f.x += f.vx * dt - speed * 0.2 * dt; f.y += f.vy * dt;
      if (f.life > f.max || f.y > GY + 30) E.fx.splice(i, 1);
    }
    for (i = E.pops.length - 1; i >= 0; i--) { var p = E.pops[i]; p.life += dt; p.y -= 26 * dt; p.x -= speed * 0.15 * dt; if (p.life > 0.9) E.pops.splice(i, 1); }
  };

  /* ---------- vẽ ---------- */
  E.drawObstacles = function (ctx) {
    for (var i = 0; i < E.obs.length; i++) {
      var o = E.obs[i], bob = o.bob ? Math.sin(o.t * 3) * o.bob : 0;
      A.draw(ctx, null, o.img, o.frame, o.x, o.y + bob);
    }
  };
  E.drawItems = function (ctx) {
    for (var i = 0; i < E.items.length; i++) {
      var it = E.items[i], bob = Math.sin(it.t * 4) * 1.5;
      if (it.kind === 'star') { var s = A.img.item_star; ctx.drawImage(s, Math.round(it.x - s.width / 2), Math.round(it.y - s.height / 2 + bob)); }
      else if (it.kind === 'coin') {
        var c = A.img.item_coin, cw = Math.max(3, Math.round(c.width * Math.abs(Math.cos(it.t * 5))));
        ctx.drawImage(c, Math.round(it.x - cw / 2), Math.round(it.y - c.height / 2 + bob), cw, c.height);
      } else {
        var g = A.img.item_giftbox; ctx.drawImage(g, Math.round(it.x - g.width / 2), Math.round(it.y - g.height / 2 + bob * 2));
        if (Math.floor(it.t * 6) % 2 === 0) { ctx.fillStyle = '#fff6a8'; ctx.fillRect(Math.round(it.x + 8), Math.round(it.y - 12 + bob), 2, 2); ctx.fillRect(Math.round(it.x - 11), Math.round(it.y - 5 + bob), 2, 2); }
      }
    }
  };
  E.drawShots = function (ctx) {
    var img = A.img.item_shuriken;
    for (var i = 0; i < E.shots.length; i++) {
      var s = E.shots[i]; ctx.save(); ctx.translate(Math.round(s.x), Math.round(s.y)); ctx.rotate(s.rot);
      ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
    }
  };
  E.drawFx = function (ctx) {
    var i;
    for (i = 0; i < E.fx.length; i++) { var f = E.fx[i]; ctx.globalAlpha = Math.min(1, (f.max - f.life) * 3); ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
    ctx.globalAlpha = 1; ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center';
    for (i = 0; i < E.pops.length; i++) {
      var p = E.pops[i]; ctx.globalAlpha = Math.min(1, (0.9 - p.life) * 3);
      ctx.fillStyle = '#000'; ctx.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y) + 1);
      ctx.fillStyle = p.color; ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  };

  E.OB = OB;
  window.Entities = E;
})();
