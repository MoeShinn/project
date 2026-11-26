/* Âm thanh: hiệu ứng 8-bit tạo bằng WebAudio + nhạc nền (url trong config) */
(function () {
  var C = window.GAME_CONFIG;
  var A = { ctx: null, master: null, music: null, chip: null };

  A.init = function () { // gọi trong lần bấm đầu tiên của người chơi
    if (!A.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      A.ctx = new AC();
      A.master = A.ctx.createGain();
      A.master.gain.value = C.sfx.volume;
      A.master.connect(A.ctx.destination);
    }
    if (A.ctx.state === 'suspended') A.ctx.resume();
  };
  A.sfxOn = function () { return window.Save.data.settings.sfx; };

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!A.ctx || !A.sfxOn()) return;
    var t = A.ctx.currentTime + (delay || 0);
    var o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, delay, hp) {
    if (!A.ctx || !A.sfxOn()) return;
    var t = A.ctx.currentTime + (delay || 0);
    var n = Math.floor(A.ctx.sampleRate * dur), buf = A.ctx.createBuffer(1, n, A.ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = A.ctx.createBufferSource(), g = A.ctx.createGain(), f = A.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 800;
    s.buffer = buf; g.gain.value = vol || 0.3;
    s.connect(f); f.connect(g); g.connect(A.master); s.start(t);
  }

  var FX = {
    click:  function () { tone(660, 0.06, 'square', 0.18); },
    jump:   function () { tone(320, 0.16, 'square', 0.22, 760); },
    land:   function () { noise(0.05, 0.12, 0, 400); },
    slide:  function () { noise(0.22, 0.16, 0, 1200); },
    throw_: function () { tone(900, 0.12, 'triangle', 0.22, 300); },
    star:   function () { tone(1200, 0.07, 'square', 0.14); tone(1600, 0.08, 'square', 0.14, null, 0.05); },
    coin:   function () { tone(988, 0.07, 'square', 0.2); tone(1319, 0.16, 'square', 0.2, null, 0.07); },
    gift:   function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'square', 0.2, null, i * 0.07); }); },
    skill:  function () { [392, 523, 659].forEach(function (f, i) { tone(f, 0.1, 'triangle', 0.25, null, i * 0.05); }); },
    giant:  function () { tone(110, 0.5, 'sawtooth', 0.3, 60); noise(0.4, 0.2, 0, 200); },
    shield: function () { tone(500, 0.3, 'sine', 0.3, 1000); },
    pop:    function () { tone(900, 0.18, 'sawtooth', 0.25, 120); noise(0.2, 0.2, 0, 500); },
    smash:  function () { noise(0.16, 0.3, 0, 300); tone(220, 0.12, 'square', 0.2, 70); },
    die:    function () { tone(440, 0.6, 'sawtooth', 0.3, 50); noise(0.35, 0.25, 0, 300); },
    buy:    function () { tone(784, 0.07, 'square', 0.2); tone(1047, 0.07, 'square', 0.2, null, 0.07); tone(1568, 0.14, 'square', 0.2, null, 0.14); },
    deny:   function () { tone(160, 0.2, 'square', 0.25, 110); },
    combo:  function () { tone(880, 0.06, 'square', 0.18); tone(1175, 0.1, 'square', 0.18, null, 0.06); }
  };
  A.play = function (name) { if (FX[name]) FX[name](); };

  /* ---- Nhạc nền ---- */
  A.startMusic = function () {
    A.stopMusic();
    if (!window.Save.data.settings.music) return;
    var url = (C.music.url || '').trim();
    if (url) {
      try {
        A.music = new window.Audio(url);
        A.music.loop = C.music.loop !== false;
        A.music.volume = C.music.volume;
        var p = A.music.play(); if (p && p.catch) p.catch(function () {});
      } catch (e) { /* bỏ qua */ }
    } else if (C.music.chiptuneWhenNoUrl && A.ctx) {
      startChip();
    }
  };
  A.stopMusic = function () {
    if (A.music) { try { A.music.pause(); } catch (e) {} A.music = null; }
    if (A.chip) { clearInterval(A.chip.timer); A.chip = null; }
  };
  A.setMusicVolumeDuck = function (duck) {
    if (A.music) A.music.volume = C.music.volume * (duck ? 0.35 : 1);
  };

  function startChip() {
    var bass = [110, 110, 165, 110, 147, 147, 196, 147], lead = [440, 523, 659, 523, 587, 698, 880, 698];
    var step = 0, tempo = 0.19;
    var g = A.ctx.createGain(); g.gain.value = C.music.volume * 0.5; g.connect(A.ctx.destination);
    function note(freq, dur, type, vol, t) {
      var o = A.ctx.createOscillator(), e = A.ctx.createGain();
      o.type = type; o.frequency.value = freq; e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(e); e.connect(g); o.start(t); o.stop(t + dur + 0.02);
    }
    var next = A.ctx.currentTime + 0.1;
    A.chip = { timer: setInterval(function () {
      while (next < A.ctx.currentTime + 0.4) {
        note(bass[step % 8], tempo * 0.9, 'triangle', 0.5, next);
        if (step % 2 === 0) note(lead[(step >> 1) % 8], tempo * 0.8, 'square', 0.18, next);
        step++; next += tempo;
      }
    }, 120) };
  }

  window.Sfx = A;
})();
