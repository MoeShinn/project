/* ============================================================
   PIXEL STICKMAN RUNNER - CONFIG
   Sửa số ở đây là đủ, không cần đụng vào code trong thư mục src/.
   Sau khi sửa: chạy lại  python tools/build.py  để gộp thành 1 file HTML.
   ============================================================ */
window.GAME_CONFIG = {

  title: 'PIXEL STICKMAN RUNNER',

  /* ---------- Xoay ngang trên điện thoại ---------- */
  forceLandscape: {
    enabled: true,            // true = ép chơi ngang trên điện thoại/máy tính bảng
    tryFullscreen: true,      // thử bật toàn màn hình khi bấm CHƠI (cần để khoá xoay)
    tryOrientationLock: true, // thử khoá hướng ngang (Android Chrome; iPhone không hỗ trợ)
    cssRotateFallback: true   // không khoá được thì tự xoay giao diện 90° khi máy đang để dọc
  },

  /* ---------- Âm thanh ---------- */
  sfx: { enabled: true, volume: 0.5 },
  music: {
    url: '',                  // link nhạc nền TRỰC TIẾP (.mp3/.ogg). Để '' = không mở nhạc
    volume: 0.4,
    loop: true,
    chiptuneWhenNoUrl: false  // true = không có url thì tự phát nhạc 8-bit đơn giản
  },

  /* ---------- Màn hình & nhân vật ---------- */
  world: { width: 480, height: 270, groundY: 222 },
  player: {
    x: 170,                // vị trí ngang của ninja trên màn hình (px, màn 480 rộng)
    jumpVelocity: 520,     // lực nhảy (px/s). Cao nhảy ≈ v² / (2*gravity)
    gravity: 1700,
    fastFallGravity: 3800, // bấm trượt khi đang trên không = rơi nhanh
    slideMinSec: 0.30,     // thời gian trượt tối thiểu mỗi lần bấm
    hitW: 16, hitH: 52,    // hitbox khi chạy
    slideHitW: 34, slideHitH: 20,
    runFps: 12
  },

  /* ---------- Tốc độ & điểm ---------- */
  speed: {
    base: 190,             // tốc độ ban đầu (px/s)
    accel: 3.2,            // tăng thêm mỗi giây
    max: 700               // trần tốc độ. null = không giới hạn (theo GDD)
  },
  scoring: {
    pixelsPerMeter: 12,
    perMeter: 1,           // điểm mỗi mét
    star: 10,              // điểm mỗi ngôi sao
    breakBase: 20,         // điểm phá 1 chướng ngại (nhân với combo)
    comboWindowSec: 3,     // phá tiếp trong ngần này giây thì tăng combo
    comboMax: 5,
    coinsPer100Score: 1    // thưởng xu cuối ván: mỗi 100 điểm được bao nhiêu xu
  },

  /* ---------- Sinh chướng ngại ---------- */
  spawn: {
    gapSecStart: 1.55,     // khoảng cách giữa 2 chướng ngại (tính bằng giây chạy) lúc đầu
    gapSecMin: 0.95,       // ... và thấp nhất khi đã rất nhanh
    gapRandom: 0.45,       // cộng thêm ngẫu nhiên 0..giá trị này
    weights: {             // tỉ lệ xuất hiện (số càng to càng hay gặp)
      crate_a: 16, crate_b: 16, spikes: 18, rock: 14,
      bird_low: 12, bird_mid: 10, drone: 12
    },
    doubleSpikesFromSpeed: 230, // từ tốc độ này gai mới có thể xuất hiện 2 cụm liền
    starArcChance: 0.7,    // cơ hội có vòng sao bay trên chướng ngại dưới đất
    starLineChance: 0.25,  // cơ hội có hàng sao trên đường chạy
    coinLineChance: 0.16   // cơ hội có hàng xu
  },
  coin: { perPickup: 1, lineLength: 4 },

  /* ---------- Hộp quà (đã GIẢM tỉ lệ so với GDD: mỗi 5s - 60%) ---------- */
  gift: {
    intervalSec: 14,       // cứ mỗi ngần này giây thì thử "quay" 1 lần
    chance: 0.35,          // xác suất có hộp quà mỗi lần quay
    weights: { shuriken: 55, giant: 20, shield: 25 }, // hộp quà ra skill nào
    amount: { shuriken: 3, giant: 1, shield: 1 }      // nhặt được bao nhiêu lượt
  },

  /* ---------- Kĩ năng ---------- */
  skills: {
    shuriken: { key: 'F', speed: 560, cooldownSec: 0.25, breaks: ['crate', 'bird', 'drone'] },
    giant:    { key: 'G', durationSec: 6, speedMul: 1.2, ghosts: 3 },
    shield:   { key: 'H', durationSec: 10, magnetRadius: 150 }
  },
  start: { coins: 0, shuriken: 3, giant: 0, shield: 0 }, // quà tặng lần chơi đầu tiên
  maxStack: { shuriken: 99, giant: 9, shield: 9 },        // kho tối đa mỗi loại

  /* ---------- Cửa hàng ---------- */
  shop: {
    items: [
      { id: 'shuriken', name: 'Phi tiêu x5',  give: 5, price: 20 },
      { id: 'giant',    name: 'Khổng Lồ x1',  give: 1, price: 60 },
      { id: 'shield',   name: 'Khiên+Nam châm x1', give: 1, price: 50 }
    ],
    // hue = góc màu (0-360) đổi băng đô + quần. null = màu gốc
    skins: [
      { id: 'classic', name: 'Cổ điển',   hue: null, price: 0 },
      { id: 'azure',   name: 'Xanh biển', hue: 215,  price: 150 },
      { id: 'forest',  name: 'Xanh lá',   hue: 120,  price: 150 },
      { id: 'gold',    name: 'Vàng kim',  hue: 48,   price: 250 },
      { id: 'violet',  name: 'Tím mộng',  hue: 280,  price: 300 }
    ]
  },

  /* ---------- Nhiệm vụ hằng ngày ---------- */
  quests: {
    perDay: 3,
    // type: meters | stars | coins | breaks | shurikens | score | giant | shield
    pool: [
      { id: 'm500',  type: 'meters',    goal: 500,  reward: 15, text: 'Chạy tổng cộng 500 m' },
      { id: 'm1500', type: 'meters',    goal: 1500, reward: 35, text: 'Chạy tổng cộng 1500 m' },
      { id: 's30',   type: 'stars',     goal: 30,   reward: 15, text: 'Nhặt 30 ngôi sao' },
      { id: 's80',   type: 'stars',     goal: 80,   reward: 30, text: 'Nhặt 80 ngôi sao' },
      { id: 'c10',   type: 'coins',     goal: 10,   reward: 20, text: 'Nhặt 10 xu' },
      { id: 'b10',   type: 'breaks',    goal: 10,   reward: 20, text: 'Phá 10 chướng ngại' },
      { id: 'sh8',   type: 'shurikens', goal: 8,    reward: 20, text: 'Ném 8 phi tiêu' },
      { id: 'sc500', type: 'score',     goal: 500,  reward: 25, text: 'Đạt 500 điểm trong 1 ván' },
      { id: 'g1',    type: 'giant',     goal: 1,    reward: 25, text: 'Dùng Khổng Lồ 1 lần' },
      { id: 'sd1',   type: 'shield',    goal: 1,    reward: 25, text: 'Dùng Khiên+Nam châm 1 lần' }
    ]
  },

  /* ---------- Ngày/đêm & 4 mùa ---------- */
  time: {
    dayLengthSec: 80,        // 1 ngày-đêm trong game kéo dài bao nhiêu giây
    seasonEveryMeters: 600,  // đổi mùa sau mỗi bao nhiêu mét
    demoDayLengthSec: 10,    // ở màn hình chính ngày-đêm & mùa trôi NHANH
    demoSeasonSec: 6
  },
  seasons: {
    order: ['spring', 'summer', 'autumn', 'winter'],
    palettes: {
      spring: { name: 'Xuân', skyTop: '#7ec8ff', skyBottom: '#d9f1ff', mount: '#9ec9a8', hill: '#6fbf6a', tree: '#f2a0c0', grass: '#7be05f', grassDark: '#4fae48', dirt: '#8a5c3b', dirtDark: '#6e4529', particle: 'petal' },
      summer: { name: 'Hạ',  skyTop: '#3aa0ff', skyBottom: '#bfe8ff', mount: '#7fb08f', hill: '#4fae55', tree: '#2f8f3a', grass: '#58d04a', grassDark: '#369a3a', dirt: '#946334', dirtDark: '#744a22', particle: 'none'  },
      autumn: { name: 'Thu', skyTop: '#f2a65a', skyBottom: '#ffe3b8', mount: '#b58a6a', hill: '#c98a3f', tree: '#d4622a', grass: '#d1a23a', grassDark: '#a8761f', dirt: '#7b4a2a', dirtDark: '#5f361d', particle: 'leaf'  },
      winter: { name: 'Đông', skyTop: '#9fb8d6', skyBottom: '#eef4fb', mount: '#b9c7da', hill: '#dfe8f2', tree: '#e6edf5', grass: '#f4f8fc', grassDark: '#c6d4e4', dirt: '#6b5a4d', dirtDark: '#54453a', particle: 'snow' }
    },
    night: { skyTop: '#070b24', skyBottom: '#1b2a5c', overlay: '#080c28', overlayAlpha: 0.38 },
    particleRate: 22          // số hạt mưa lá/tuyết xuất hiện mỗi giây
  }
};
