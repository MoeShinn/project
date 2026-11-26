/* Nạp ảnh. Bản gộp 1 file HTML sẽ nhúng sẵn ảnh (window.EMBEDDED_ASSETS). */
(function () {
  var FILES = {
    ninja_run: 'assets/ninja/ninja_run.png', ninja_jump: 'assets/ninja/ninja_jump.png',
    ninja_slide: 'assets/ninja/ninja_slide.png', ninja_throw: 'assets/ninja/ninja_throw.png',
    ninja_giant: 'assets/ninja/ninja_giant.png',
    obstacle_crate_a: 'assets/obstacles/obstacle_crate_a.png', obstacle_crate_b: 'assets/obstacles/obstacle_crate_b.png',
    obstacle_spikes: 'assets/obstacles/obstacle_spikes.png', obstacle_rock: 'assets/obstacles/obstacle_rock.png',
    obstacle_bird: 'assets/obstacles/obstacle_bird.png', obstacle_drone: 'assets/obstacles/obstacle_drone.png',
    item_star: 'assets/items/item_star.png', item_coin: 'assets/items/item_coin.png',
    item_giftbox: 'assets/items/item_giftbox.png', item_shuriken: 'assets/items/item_shuriken.png',
    item_magnet_shield: 'assets/items/item_magnet_shield.png', fx_shield: 'assets/items/fx_shield.png',
    icon_shuriken: 'assets/items/icon_shuriken.png', icon_giant: 'assets/items/icon_giant.png',
    icon_shield_magnet: 'assets/items/icon_shield_magnet.png'
  };
  var FRAMES = { ninja_run: 6, ninja_jump: 2, ninja_throw: 2, ninja_giant: 6, obstacle_bird: 2, obstacle_drone: 2 };
  var FALLBACK = { ninja_run: [384, 64], ninja_jump: [128, 64], ninja_slide: [64, 64], ninja_throw: [128, 64], ninja_giant: [576, 96] };

  var Assets = { img: {}, frames: FRAMES, cache: {} };

  Assets.url = function (name) {
    var emb = window.EMBEDDED_ASSETS;
    return (emb && emb[name]) ? emb[name] : FILES[name];
  };
  function placeholder(name) { // thiếu ảnh -> hình tạm để game vẫn chạy
    var sz = FALLBACK[name] || [24, 24], c = document.createElement('canvas');
    c.width = sz[0]; c.height = sz[1];
    var x = c.getContext('2d'); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#000'; x.fillRect(2, 2, c.width - 4, c.height - 4);
    return c;
  }
  Assets.load = function () {
    var names = Object.keys(FILES);
    return Promise.all(names.map(function (n) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = function () { Assets.img[n] = im; res(); };
        im.onerror = function () { Assets.img[n] = placeholder(n); res(); };
        im.src = Assets.url(n);
      });
    }));
  };
  Assets.fw = function (name) { return Assets.img[name].width / (FRAMES[name] || 1); };
  Assets.fh = function (name) { return Assets.img[name].height; };

  // vẽ khung số i của ảnh nhiều khung
  Assets.draw = function (ctx, src, name, i, x, y, flip, scale) {
    var fw = Assets.fw(name), fh = Assets.fh(name), s = scale || 1;
    ctx.drawImage(src || Assets.img[name], i * fw, 0, fw, fh, Math.round(x), Math.round(y), Math.round(fw * s), Math.round(fh * s));
  };

  // ảnh đổi màu skin (dùng blend 'hue', không cần đọc điểm ảnh nên chạy được cả khi mở file trực tiếp)
  Assets.skinned = function (name, hue) {
    var src = Assets.img[name];
    if (hue == null) return src;
    var key = name + '|h' + hue;
    if (Assets.cache[key]) return Assets.cache[key];
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    var x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'hue';
    x.fillStyle = 'hsl(' + hue + ',100%,50%)'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    Assets.cache[key] = c; return c;
  };
  // ảnh phủ màu (bóng ma đỏ, nhấp nháy khi trúng...)
  Assets.tinted = function (srcImg, keyName, color, alpha) {
    var key = keyName + '|t' + color + alpha;
    if (Assets.cache[key]) return Assets.cache[key];
    var c = document.createElement('canvas'); c.width = srcImg.width; c.height = srcImg.height;
    var x = c.getContext('2d');
    x.drawImage(srcImg, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = alpha; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    Assets.cache[key] = c; return c;
  };
  Assets.clearSkinCache = function () {
    Object.keys(Assets.cache).forEach(function (k) { if (k.indexOf('|h') > 0) delete Assets.cache[k]; });
  };

  window.Assets = Assets;
})();
