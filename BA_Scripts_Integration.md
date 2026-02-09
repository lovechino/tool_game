# Tài liệu Phân tích Nghiệp vụ (BA) - Hệ thống Tự động hóa Tài nguyên Game

## 1. Tổng quan (Overview)
Tài liệu này mô tả chức năng và quy trình hoạt động của hai script quan trọng trong dự án: `sync-assets.cjs` và `test-scale.cjs`. Các script này được thiết kế để tự động hóa việc quản lý tài nguyên (assets), tạo cấu hình game và đảm bảo tính thẩm mỹ của giao diện thông qua việc tự động căn chỉnh kích thước hình ảnh.

---

## 2. Phân tích chi tiết script `sync-assets.cjs`

### 2.1. Mục tiêu
- Tự động quét thư mục `public/assets/reskin` để nhận diện các file hình ảnh mới.
- Tạo file `game_manifest.json` để Phaser có thể load assets tự động.
- Tính toán tỉ lệ (scale) và vị trí (offset) để các mảnh ghép (parts) tự động khớp vào khung (outlines) trong Scene 2.

### 2.2. Các tính năng chính
- **Tự động nhận diện (Auto-detection):**
  - Nhận diện các item của Scene 1 dựa trên tiền tố `s1_item_`.
  - Nhận diện các thành phần giao diện như banner, board, bubble, result background.
  - Phân loại các mảnh ghép cho Scene 2 thành `group1` (Goalkeeper) và `group2` (Letter).
- **Tính toán Tỉ lệ Tự động (Auto-fit Scaling):**
  - So sánh kích thước của mảnh ghép và khung chứa.
  - Tính toán tỉ lệ thu nhỏ/phóng to nhỏ nhất để mảnh ghép nằm trọn trong khung mà không bị méo.
  - Tính toán tọa độ `offsetX` và `offsetY` để đặt mảnh ghép vào chính giữa khung.
- **Cập nhật Cấu hình (Config Update):**
  - Cập nhật trực tiếp vào file `level_s2_config.json`.
  - Lưu giữ các ghi chú (note) và tọa độ gợi ý (hint) cũ nếu có.

### 2.3. Quy trình thực hiện (Workflow)
1. Kiểm tra sự tồn tại của thư mục `reskin`.
2. Duyệt danh sách file và khởi tạo cấu trúc `manifest`.
3. Phân loại file vào các Scene tương ứng (Scene 1, Scene 2, Common).
4. Thực hiện tính toán `scale` và `offset` cho từng mảnh ghép của Scene 2 dựa trên file outline tương ứng.
5. Ghi dữ liệu vào `game_manifest.json` và `level_s2_config.json`.

---

## 3. Phân tích chi tiết script `test-scale.cjs`

### 3.1. Mục tiêu
- Cung cấp một môi trường thử nghiệm nhanh (sandbox) cho các công thức tính toán tỉ lệ.
- Giúp lập trình viên kiểm tra kết quả `scale` của một cặp hình ảnh (khung và mảnh ghép) cụ thể mà không cần chạy toàn bộ hệ thống đồng bộ.

### 3.2. Chức năng
- Nhận diện kích thước của hai file ảnh đầu vào.
- Tính toán tỉ lệ dựa trên chiều rộng và chiều cao.
- Log chi tiết các thông số trung gian (width/height ratios) để phục vụ việc gỡ lỗi (debugging).

---

## 4. Cấu trúc dữ liệu đầu ra chính

### 4.1. game_manifest.json
Chứa đường dẫn của tất cả các asset đã được phân loại theo từng Scene, giúp game load tài nguyên một cách tập trung và chính xác.

### 4.2. level_s2_config.json
Chứa các thông số quan trọng cho Scene 2:
- `offsetX`, `offsetY`: Tọa độ căn giữa mảnh ghép vào khung.
- `scaleAdjust`: Tỉ lệ điều chỉnh để mảnh ghép vừa vặn.

---

## 5. Lợi ích của hệ thống
1. **Tiết kiệm thời gian:** Không cần nhập tay tọa độ và tỉ lệ cho từng mảnh ghép khi thay đổi giao diện (reskin).
2. **Độ chính xác cao:** Tránh sai sót do con người khi tính toán vị trí căn giữa.
3. **Linh hoạt:** Hỗ trợ nhiều bộ asset khác nhau chỉ bằng cách thay đổi file trong thư mục `reskin`.
4. **Dễ bảo trì:** Tách biệt logic quản lý asset và logic xử lý game.

---
*Tài liệu được biên soạn để hỗ trợ đội ngũ phát triển và vận hành game.*
