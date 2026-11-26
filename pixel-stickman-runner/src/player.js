/* Ninja: vật lí, hitbox, hoạt ảnh, vẽ (kể cả Khổng Lồ + bóng ma + khiên) */
(function () {
  var C = window.GAME_CONFIG, U = window.U, A = window.Assets, E = window.Entities;
  var P = C.player, GY = C.world.groundY;
  var Pl = {};

  Pl.reset = function () {
    Pl.x = P.x; Pl.feet = GY; Pl.vy = 0; Pl.onGround = true;
    Pl.sliding = false; Pl.slideT = 0; Pl.slideHeld = false; Pl.jumpBuf = 0;
    Pl.dead = false; Pl.spin = 0; Pl.anim = 0; Pl.throwT = 0; Pl.hue = null;
    Pl.giantT = 0; Pl.shieldT = 0; Pl.shieldOn = false; Pl.invulT = 0; Pl.hist = []; Pl.t = 0; Pl.landed = false;
  };
  Pl.isGiant = function () { return Pl.giantT > 0; };
  Pl.pressJump = function () { Pl.jumpBuf = 0.13; };
  Pl.setSlide = function (v) { Pl.slideHeld = v; };

  Pl.hit = function () {
    if (Pl.isGiant()) return { x: Pl.x - 17, y: Pl.feet - 78, w: 34, h: 78 };
    if (Pl.sliding) return { x: Pl.x - 18, y: Pl.feet - P.slideHitH, w: P.slideHitW, h: P.slideHitH };
    return { x: Pl.x - P.hitW / 2, y: Pl.feet - P.hitH, w: P.hitW, h: P.hitH };
  };

  function supportY() { // mặt thùng gỗ có thể đứng lên
    var best = GY, i, o, L = Pl.x - P.hitW / 2 + 1, R = Pl.x + P.hitW / 2 - 1;
    for (i = 0; i < E.obs.length; i++) {
      o = E.obs[i];
      if (o.kind !== 'crate' || o.dead) continue;
      if (o.x < R && o.x + o.w > L && Pl.prevFeet <= o.y + 6) best = Math.min(best, o.y);
    }
    return best;
  }

  Pl.update = function (dt, sfx) {
    Pl.t += dt;
    if (Pl.dead) { Pl.spin += dt * 9; Pl.vy += 1700 * dt; Pl.feet += Pl.vy * dt; return; }
    Pl.anim += dt;
    Pl.jumpBuf = Math.max(0, Pl.jumpBuf - dt);
    Pl.throwT = Math.max(0, Pl.throwT - dt);
    Pl.invulT = Math.max(0, Pl.invulT - dt);
    var giant = Pl.isGiant();

    if (Pl.shieldT > 0) { Pl.shieldT -= dt; if (Pl.shieldT <= 0) { Pl.shieldT = 0; Pl.shieldOn = false; } }

    // trượt
    if (Pl.slideHeld && !Pl.sliding && Pl.onGround && !giant) { Pl.sliding = true; Pl.slideT = P.slideMinSec; sfx('slide'); }
    if (Pl.sliding) {
      Pl.slideT -= dt;
      if (giant || (!Pl.slideHeld && Pl.slideT <= 0)) Pl.sliding = false;
    }
    // nhảy
    if (Pl.jumpBuf > 0 && Pl.onGround) {
      Pl.vy = -P.jumpVelocity; Pl.onGround = false; Pl.jumpBuf = 0; Pl.sliding = false; sfx('jump');
    }
    // trọng lực (giữ nút trượt khi đang rơi = rơi nhanh)
    var g = (!Pl.onGround && Pl.slideHeld && Pl.vy > -80) ? P.fastFallGravity : P.gravity;
    Pl.prevFeet = Pl.feet;
    Pl.vy += g * dt; Pl.feet += Pl.vy * dt;
    var support = giant ? GY : supportY();
    if (Pl.feet >= support) {
      if (!Pl.onGround && Pl.vy > 120) { sfx('land'); Pl.landed = true; }
      Pl.feet = support; Pl.vy = 0; Pl.onGround = true;
    } else Pl.onGround = false;

    // lịch sử vị trí cho bóng ma
    Pl.hist.push({ t: Pl.t, feet: Pl.feet, anim: Pl.anim, air: !Pl.onGround });
    while (Pl.hist.length > 60) Pl.hist.shift();
  };

  function histAt(lag) {
    var target = Pl.t - lag, h = Pl.hist, i;
    for (i = h.length - 1; i >= 0; i--) if (h[i].t <= target) return h[i];
    return h[0] || { feet: Pl.feet, anim: Pl.anim, air: !Pl.onGround };
  }

  function giantFrame(anim, air) { return air ? 2 : Math.floor(anim * 10) % 6; }

  Pl.draw = function (ctx) {
    var hue = Pl.hue, x = Math.round(Pl.x), i;
    if (Pl.dead) {
      var jump = A.skinned('ninja_jump', hue);
      ctx.save(); ctx.translate(x, Math.round(Pl.feet - 30)); ctx.rotate(Pl.spin);
      ctx.drawImage(jump, 0, 0, 64, 64, -30, -32, 64, 64); ctx.restore();
      return;
    }
    var blink = Pl.invulT > 0 && Math.floor(Pl.invulT * 14) % 2 === 0;
    if (Pl.isGiant()) {
      var gs = A.skinned('ninja_giant', hue), ghosts = C.skills.giant.ghosts;
      for (i = ghosts; i >= 1; i--) { // 3 bóng ma đỏ chạy theo sau
        var h = histAt(i * 0.09), tint = A.tinted(gs, 'giant' + hue, '#ff1a1a', 0.6);
        ctx.globalAlpha = 0.42 - i * 0.09;
        ctx.drawImage(tint, giantFrame(h.anim, h.air) * 96, 0, 96, 96, x - 46 - i * 22, Math.round(h.feet - 93), 96, 96);
      }
      ctx.globalAlpha = (Pl.giantT < 1.2 && Math.floor(Pl.giantT * 10) % 2 === 0) ? 0.55 : 1;
      ctx.drawImage(gs, giantFrame(Pl.anim, !Pl.onGround) * 96, 0, 96, 96, x - 46, Math.round(Pl.feet - 93), 96, 96);
      ctx.globalAlpha = 1;
    } else if (!blink) {
      var sheet, frame = 0, name, dx = 30;
      if (!Pl.onGround) { name = 'ninja_jump'; frame = Pl.vy < 0 ? 0 : 1; }
      else if (Pl.sliding) { name = 'ninja_slide'; dx = 31; }
      else if (Pl.throwT > 0) { name = 'ninja_throw'; frame = Pl.throwT > 0.17 ? 0 : 1; }
      else { name = 'ninja_run'; frame = Math.floor(Pl.anim * P.runFps) % 6; }
      sheet = A.skinned(name, hue);
      ctx.drawImage(sheet, frame * 64, 0, 64, 64, x - dx, Math.round(Pl.feet - 62), 64, 64);
    }
    // khiên
    if (Pl.shieldOn) {
      var sh = A.img.fx_shield, k = Pl.isGiant() ? 1.55 : 1, sz = Math.round(sh.width * k), cy = Pl.feet - (Pl.isGiant() ? 46 : 31);
      var a = 0.85 + 0.15 * Math.sin(Pl.t * 6);
      if (Pl.shieldT < 2 && Math.floor(Pl.shieldT * 8) % 2 === 0) a = 0.35;
      ctx.globalAlpha = a; ctx.drawImage(sh, x - Math.round(sz / 2) + 1, Math.round(cy - sz / 2), sz, sz); ctx.globalAlpha = 1;
    }
  };

  window.Player = Pl;
})();
