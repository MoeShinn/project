/* Nhiệm vụ hằng ngày: chọn theo ngày, lưu tiến độ */
(function () {
  var C = window.GAME_CONFIG, U = window.U, S = window.Save;
  var Q = {};

  Q.def = function (id) {
    for (var i = 0; i < C.quests.pool.length; i++) if (C.quests.pool[i].id === id) return C.quests.pool[i];
    return null;
  };
  Q.ensure = function () {
    var today = U.todayKey(), q = S.data.quests;
    if (q.date === today && q.list && q.list.length) return;
    var rnd = U.rng(U.hashStr(today)), pool = C.quests.pool.slice(), list = [];
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    var used = {};
    for (i = 0; i < pool.length && list.length < C.quests.perDay; i++) { // mỗi loại nhiệm vụ chỉ chọn 1
      if (used[pool[i].type]) continue;
      used[pool[i].type] = true; list.push({ id: pool[i].id, progress: 0, claimed: false });
    }
    S.data.quests = { date: today, list: list }; S.save();
  };
  Q.list = function () {
    Q.ensure();
    return S.data.quests.list.map(function (it, idx) { var d = Q.def(it.id); return { idx: idx, def: d, progress: it.progress, claimed: it.claimed, done: it.progress >= d.goal }; });
  };
  Q.add = function (type, n) {
    Q.ensure();
    S.data.quests.list.forEach(function (it) {
      var d = Q.def(it.id);
      if (d && d.type === type && !it.claimed) it.progress = Math.min(d.goal, it.progress + n);
    });
  };
  Q.setMax = function (type, v) {
    Q.ensure();
    S.data.quests.list.forEach(function (it) {
      var d = Q.def(it.id);
      if (d && d.type === type && !it.claimed) it.progress = Math.min(d.goal, Math.max(it.progress, v));
    });
  };
  Q.claim = function (idx) {
    Q.ensure();
    var it = S.data.quests.list[idx], d = it && Q.def(it.id);
    if (!it || it.claimed || it.progress < d.goal) return 0;
    it.claimed = true; S.addCoins(d.reward); return d.reward;
  };
  Q.pending = function () { return Q.list().filter(function (q) { return q.done && !q.claimed; }).length; };

  window.Quests = Q;
})();
