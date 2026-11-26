/* Hàm tiện ích dùng chung */
(function () {
  var U = {};
  U.rand = function (a, b) { return a + Math.random() * (b - a); };
  U.randi = function (a, b) { return Math.floor(U.rand(a, b + 1)); };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.smooth = function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  U.hex2rgb = function (h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  };
  U.mix = function (c1, c2, t) { // trộn 2 màu #hex -> 'rgb()'
    var a = U.hex2rgb(c1), b = U.hex2rgb(c2);
    return 'rgb(' + Math.round(U.lerp(a[0], b[0], t)) + ',' + Math.round(U.lerp(a[1], b[1], t)) + ',' + Math.round(U.lerp(a[2], b[2], t)) + ')';
  };
  U.mixRgb = function (c1, c2, t) { // trộn 2 màu 'rgb(...)' hoặc #hex
    var p = function (c) { return c.charAt(0) === '#' ? U.hex2rgb(c) : c.match(/\d+/g).map(Number); };
    var a = p(c1), b = p(c2);
    return 'rgb(' + Math.round(U.lerp(a[0], b[0], t)) + ',' + Math.round(U.lerp(a[1], b[1], t)) + ',' + Math.round(U.lerp(a[2], b[2], t)) + ')';
  };
  U.pickWeighted = function (obj) {
    var sum = 0, k;
    for (k in obj) sum += obj[k];
    var r = Math.random() * sum;
    for (k in obj) { r -= obj[k]; if (r <= 0) return k; }
    return Object.keys(obj)[0];
  };
  U.todayKey = function () {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };
  U.hashStr = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.rng = function (seed) { // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.isTouch = function () {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  };
  U.rectsOverlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  window.U = U;
})();
