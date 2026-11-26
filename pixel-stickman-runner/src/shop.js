/* Cửa hàng: mua vật phẩm kĩ năng và skin */
(function () {
  var C = window.GAME_CONFIG, S = window.Save;
  var Shop = {};

  Shop.skin = function (id) {
    for (var i = 0; i < C.shop.skins.length; i++) if (C.shop.skins[i].id === id) return C.shop.skins[i];
    return C.shop.skins[0];
  };
  Shop.equippedHue = function () { return Shop.skin(S.data.skins.equipped).hue; };

  Shop.buyItem = function (id) {
    var it = C.shop.items.filter(function (x) { return x.id === id; })[0];
    if (!it) return { ok: false, msg: 'Không có vật phẩm' };
    if (S.data.coins < it.price) return { ok: false, msg: 'Không đủ xu' };
    var max = C.maxStack[id] || 99;
    if (S.count(id) >= max) return { ok: false, msg: 'Kho đã đầy (' + max + ')' };
    S.data.coins -= it.price;
    S.addInv(id, it.give); // tự lưu
    return { ok: true, msg: 'Đã mua ' + it.name };
  };
  Shop.buySkin = function (id) {
    var sk = Shop.skin(id);
    if (S.data.skins.owned.indexOf(id) >= 0) return { ok: false, msg: 'Bạn đã có skin này' };
    if (S.data.coins < sk.price) return { ok: false, msg: 'Không đủ xu' };
    S.data.coins -= sk.price; S.data.skins.owned.push(id); S.data.skins.equipped = id; S.save();
    return { ok: true, msg: 'Đã mua skin ' + sk.name };
  };
  Shop.equip = function (id) {
    if (S.data.skins.owned.indexOf(id) < 0) return false;
    S.data.skins.equipped = id; S.save(); return true;
  };

  window.Shop = Shop;
})();
