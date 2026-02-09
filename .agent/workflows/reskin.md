---
description: Hướng dẫn tạo game mới từ file assets (Reskin)
---

# Quy trình tạo game mới (Game Generator)

Hệ thống cho phép tạo một Build Game hoàn chỉnh từ một file Zip chứa các assets (hình ảnh, âm thanh) mà không cần can thiệp vào code.

## Cách 1: Sử dụng Giao diện Web (Khuyên dùng)

1.  Truy cập `http://localhost:3000`.
2.  Kéo thả file **.zip** chứa assets vào khu vực upload.
3.  Nhấn **Generate Game**.
4.  Đợi quá trình Build hoàn tất và tải file game về.

## Cách 2: Sử dụng API (Dành cho Developer)

Gửi request `POST` đến `http://localhost:3000/create-game` với body là `multipart/form-data` chứa file zip.

## Quy ước đặt tên file (Naming Convention)

Để hệ thống nhận diện đúng assets, bạn **BẮT BUỘC** phải đặt tên file trong file Zip theo quy tắc sau:

### 🎵 Âm thanh
| Tên file | Mô tả |
| :--- | :--- |
| `s1_audio_poem.mp3` | Giọng đọc thơ/câu đố (Màn 1) |
| `s1_audio_correct.mp3` | Giọng đọc đáp án đúng (Màn 1) |
| `s2_audio_intro.mp3` | Giọng hướng dẫn mở đầu (Màn 2) |

### 🖼️ Hình ảnh chung
| Tên file | Mô tả |
| :--- | :--- |
| `background_game.jpg` | Hình nền chính của game (hoặc .png) |
| `common_board.png` | Hình bảng gỗ chung (nếu có) |

### 🦀 Màn 1 (Scene 1)
| Tên file | Mô tả | Quy tắc |
| :--- | :--- | :--- |
| `s1_board.png` | Bảng Màn 1 | |
| `s1_banner.png` | Banner Màn 1 | |
| `s1_item_*.png` | Các vật thể trả lời | Tên tuỳ ý, bắt đầu bằng `s1_item_` |
| `s1_item_*_correct.png` | Vật thể **ĐÚNG** | Phải chứa chữ `correct` |
| `s1_poem.png` | Hình ảnh bài thơ | |
| `s1_example.png` | Hình mẫu vật (dưới bài thơ) | (Mới) |

### 🎨 Màn 2 (Scene 2)
| Tên file | Mô tả | Quy tắc |
| :--- | :--- | :--- |
| `s2_board.png` | Bảng Màn 2 | |
| `s2_banner.png` | Banner Màn 2 | |
| `s2_outline_*.png` | Các hình nét đứt | Ví dụ: `s2_outline_fish.png` |
| `s2_part_1_*.png` | Bộ phận hình trái (Group 1) | Ví dụ: `s2_part_1_head.png` |
| `s2_part_2_*.png` | Bộ phận hình phải (Group 2) | Ví dụ: `s2_part_2_arm.png` |
| `s2_text_footer.png`| Chữ chú thích dưới bảng | Tùy chọn |
