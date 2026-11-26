# Pixel Stickman Runner

Game endless runner 2D pixel art (HTML5 Canvas), chạy trên PC và điện thoại.

## Chạy game
- **Bản 1 file:** mở `dist/pixel-stickman-runner.html` bằng trình duyệt (đã nhúng sẵn ảnh + config).
- **Bản source:** mở `index.html` (nhiều file). Sửa xong nhớ build lại bản 1 file.

## Cấu trúc thư mục
```
config/config.js   <- SỬA GIÁ BÁN, TỈ LỆ RƠI, TỐC ĐỘ, NHẠC, XOAY NGANG... ở đây
src/               <- code game (util, save, audio, assets, world, entities, player, quests, shop, ui, game)
style/style.css    <- giao diện
assets/            <- ảnh (ninja/, obstacles/, items/) - thay ảnh cùng tên là game tự nhận
tools/build.py     <- gộp tất cả thành 1 file HTML
dist/              <- kết quả build
```

## Build ra 1 file HTML
```
python tools/build.py
```
(chỉ cần Python 3, không cần cài thêm gì)

## Điều khiển
| Hành động | PC | Điện thoại |
|---|---|---|
| Nhảy | W / Space / ↑ | nút mũi tên lên (dưới trái) |
| Trượt | S / ↓ (giữ) | nút mũi tên xuống (dưới trái) |
| Ném phi tiêu | F | nút tròn phi tiêu (phải) |
| Khổng Lồ | G | nút tròn đỏ |
| Khiên + Nam châm | H | nút tròn tím |
| Tạm dừng | Esc / P | nút II góc trên phải |

## Những chỗ hay chỉnh trong `config/config.js`
- `shop.items[].price` / `give`: giá và số lượng mỗi gói trong cửa hàng
- `shop.skins[]`: giá skin, `hue` = màu băng đô + quần
- `gift.chance`, `gift.intervalSec`, `gift.weights`: tỉ lệ hộp quà và ra skill nào
- `spawn.weights`: tỉ lệ từng loại chướng ngại
- `speed.base / accel / max`: tốc độ ban đầu, tăng dần, trần (`max: null` = không giới hạn)
- `music.url`: link nhạc nền trực tiếp (.mp3/.ogg). Để trống = không mở nhạc
- `forceLandscape`: ép xoay ngang trên điện thoại

## Lưu ý
- Android Chrome: bấm CHƠI sẽ tự vào toàn màn hình và khoá ngang. iPhone không cho khoá,
  nên game tự xoay giao diện 90° khi máy đang để dọc (`cssRotateFallback`).
- Dữ liệu (xu, kho skill, skin, kỉ lục, nhiệm vụ) lưu trong localStorage của trình duyệt.
- `music.url` phải là file nhạc trực tiếp, không dùng link YouTube. Nhạc chỉ phát sau khi bấm CHƠI.
