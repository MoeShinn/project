/* Lưu dữ liệu vào trình duyệt (localStorage). Lỗi thì giữ trong bộ nhớ tạm. */
(function () {
  var KEY = 'pixel_stickman_runner_save_v1';
  var C = window.GAME_CONFIG;

  function defaults() {
    return {
      coins: C.start.coins,
      inv: { shuriken: C.start.shuriken, giant: C.start.giant, shield: C.start.shield },
      high: 0,
      skins: { owned: ['classic'], equipped: 'classic' },
      quests: { date: '', list: [] },
      settings: { sfx: C.sfx.enabled, music: true },
      stats: { runs: 0, meters: 0 }
    };
  }
  function merge(base, extra) {
    for (var k in extra) {
      if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object') merge(base[k], extra[k]);
      else base[k] = extra[k];
    }
    return base;
  }

  var Save = { data: defaults() };

  Save.load = function () {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) merge(Save.data, JSON.parse(raw));
    } catch (e) { /* bỏ qua */ }
    if (!Save.data.skins.owned || Save.data.skins.owned.indexOf('classic') < 0) Save.data.skins.owned = ['classic'];
  };
  Save.save = function () {
    try { window.localStorage.setItem(KEY, JSON.stringify(Save.data)); } catch (e) { /* bỏ qua */ }
  };
  Save.reset = function () { Save.data = defaults(); Save.save(); };

  Save.count = function (id) { return Save.data.inv[id] || 0; };
  Save.addInv = function (id, n) {
    var max = C.maxStack[id] || 99;
    var before = Save.data.inv[id] || 0;
    Save.data.inv[id] = Math.min(max, before + n);
    Save.save();
    return Save.data.inv[id] - before; // số lượt thực sự cộng được
  };
  Save.useInv = function (id) {
    if ((Save.data.inv[id] || 0) <= 0) return false;
    Save.data.inv[id]--; Save.save(); return true;
  };
  Save.addCoins = function (n) { Save.data.coins = Math.max(0, Save.data.coins + n); Save.save(); };

  window.Save = Save;
  Save.load();
})();
