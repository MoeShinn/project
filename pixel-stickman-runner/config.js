/* Pixel Stickman Runner - CONFIG riêng.
   Đặt cùng thư mục với pixel-stickman-runner.html. Xóa file này thì game dùng config mặc định nhúng trong HTML.
   Dùng .js (không phải .json) để chạy được cả khi mở file local (file://) lẫn GitHub Pages.
   Có thể xóa bớt khóa: khóa thiếu / sai kiểu / số âm sẽ tự lấy giá trị mặc định. */
window.PSR_CONFIG = {
  player: { x: 44, gravity: 1500, jumpVel: 440, w: 8, h: 19, slideW: 13, slideH: 8 },
  hitShrink: 0.15,                       // hitbox nhỏ hơn sprite (15%)
  speed: { base: 110, max: 2.9, rampPerSec: 0.02, demoMult: 1.6 }, // max = x2.9
  levels: [0, 250, 700, 1400],           // điểm để lên cấp 1..4
  scorePerPx: 0.1,
  breakBonus: 50,                        // điểm khi phá chướng ngại
  spawn: { gapMin: 0.85, gapMax: 1.7, doubleChance: 0.45, doubleGap: 0.8 }, // gap tính theo giây * tốc độ
  power: { checkEvery: 5, chance: 0.8, minDist: 200, darts: 3, startDarts: 100, slowTime: 6, slowFactor: 0.55, superTime: 5 },
  dart: { speed: 420, cooldown: 0.25 },
  env: { dayLength: 120, seasonLength: 240, demoScale: 40 }, // giây / 1 ngày, giây / 4 mùa; demoScale = tốc độ trôi ở menu
  gameOverDelay: 1.4,
  pool: 400                              // số hạt tối đa (object pool)
};
