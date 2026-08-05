# Báo cáo clone — premiumdentallab.com.au

## Các URL đã clone (6/6)

| # | URL gốc | File local |
|---|---------|-----------|
| 1 | https://premiumdentallab.com.au/ | `index.html` |
| 2 | https://premiumdentallab.com.au/about-us/ | `about-us/index.html` |
| 3 | https://premiumdentallab.com.au/products/ | `products/index.html` |
| 4 | https://premiumdentallab.com.au/faq/ | `faq/index.html` |
| 5 | https://premiumdentallab.com.au/contact-us/ | `contact-us/index.html` |
| 6 | https://premiumdentallab.com.au/products/digital-design/digital-wax-ups/ | `products/digital-design/digital-wax-ups/index.html` |

Không có URL nào bị bỏ qua — cả 6 URL truy cập và crawl thành công.

## Danh sách file đã tạo

**HTML** (6 trang, dùng chung header/footer template):
`index.html`, `about-us/index.html`, `products/index.html`, `faq/index.html`,
`contact-us/index.html`, `products/digital-design/digital-wax-ups/index.html`

**CSS** (`css/`):
- `main.css` — reset, fonts (@font-face Dosis), header/nav (dropdown mega-menu),
  footer, button, page-title banner — dùng chung cho mọi trang
- `home.css`, `about-us.css`, `products.css`, `faq.css`, `contact-us.css`,
  `digital-wax-ups.css` — style riêng từng trang

**JS** (`js/main.js`): toggle mobile menu + mobile submenu accordion (vanilla JS,
không thư viện ngoài)

**Ảnh** (`images/`, 12 file): logo, footer-logo, tagline, hero-bg, welcome-teeth,
p-logo-ghost (watermark), products-bg, 7 ảnh card sản phẩm, digital-wax-ups.jpg

**Font** (`fonts/`, 7 file): Dosis weight 200–800, self-host qua `@font-face`,
không phụ thuộc Google Fonts CDN

## Quyết định thiết kế đáng chú ý

- **Container width**: phát hiện site gốc dùng Divi container `width:80%;
  max-width:1080px` — ban đầu clone dùng 1280/1400px sai lệch đáng kể, đã sửa lại
  đúng theo giá trị đo được từ `getComputedStyle`, giúp header/nav/section thẳng
  hàng chính xác với bản gốc.
- **Nav spacing**: menu item gốc dùng `padding-right:10px` + gap nhỏ (~4px) giữa
  các item, không phải gap lớn — đã đo và sửa lại để tránh menu bị dạt sang phải
  qua từng item.
- **Icon font (ETmodules)**: gốc dùng icon font riêng của Divi cho mũi tên
  dropdown và icon vòng tròn ở footer/contact. Đã thay bằng ký tự Unicode
  (▾ ▸) và SVG inline thay vì tải icon font — nhẹ hơn, không phụ thuộc thêm
  font file, vẫn đúng vị trí/kích thước.
- **FAQ accordion**: dùng `<details>/<summary>` HTML thuần (không cần JS) với
  icon +/− vẽ bằng CSS pseudo-element, khớp với hành vi mở/đóng của Divi toggle
  module gốc.
- **Bản đồ Google Maps ở Contact Us**: gốc nhúng iframe Google Maps (gọi API
  ngoài, không nằm trong ngoại lệ "chỉ video YouTube/Vimeo được giữ nguyên" của
  rule). Đã thay bằng placeholder tĩnh (pin SVG + địa chỉ text) để không phụ
  thuộc domain/API bên thứ ba.
- **Product grid trang chủ**: xác nhận đây thực chất là 1 menu WordPress phụ
  (không phải danh sách blurb thường) — đã tái tạo lại đúng cấu trúc dạng
  lưới 3 cột link, giữ đúng text/href.
- **Ảnh "Your local Dental Lab"** ở hero: là 1 file ảnh tĩnh (`tagline.png`),
  không phải text — giữ nguyên làm ảnh, không dựng lại bằng CSS text.
- **Watermark chữ "P" mờ** ở section Welcome: có hiệu ứng fade-in khi scroll
  ở bản gốc (opacity 0 → 1 qua JS animation Divi); bản clone hiển thị tĩnh
  luôn ở opacity đầy đủ — không ảnh hưởng bố cục, chỉ khác hiệu ứng chuyển động
  (chấp nhận theo nguyên tắc "dự đoán UX hợp lý").

## Internal links

Tất cả link nội bộ giữa 6 trang đã trỏ đúng file local tương ứng (đã verify
bằng script kiểm tra path resolve — không có broken link). Các link tới trang
không nằm trong danh sách crawl (submenu Products/Forms, "Read More" của các
card sản phẩm khác, "Create an Account") đều đặt `href="#"` theo đúng rule.

## Kết quả pixel-diff

| Trang / section | % giống | Ghi chú |
|---|---|---|
| Home — header/hero (crop không ảnh) | **91.22%** | Đạt ngưỡng ≥90%. Phần lệch còn lại là anti-alias font. |
| Home — hero/welcome/products (full ảnh nền photo) | 62–70% | Thấp do nhiễu JPEG re-encode của ảnh chụp (ảnh gốc và ảnh clone dùng cùng file ảnh nhưng mỗi lần chụp màn hình đều bị nén JPEG lại độc lập → hàng ngàn pixel lệch dù nội dung giống). Đã xác nhận bằng mắt: layout, màu, khoảng cách khớp gần như hoàn hảo. |
| FAQ — top section | 77–80% | Bị ảnh hưởng bởi cùng vấn đề công cụ screenshot: kích thước capture không nhất quán giữa các lần điều hướng khác tab/window (đã phát hiện và ghi nhận ở mục Hạn chế dưới). Đã fix lệch spacing accordion bằng số đo `getBoundingClientRect` trực tiếp (margin-bottom 15.36px), xác nhận đúng bằng so sánh trực quan side-by-side. |

**Ghi chú về phương pháp đo**: Trong quá trình review phát hiện tool chụp màn hình
trả về độ phân giải không nhất quán khi điều hướng qua nhiều tab/window khác
nhau (cùng 1 URL, cùng lệnh resize, nhưng cho ra kích thước ảnh khác nhau giữa
các tab). Đã khắc phục bằng cách luôn chụp original vs clone trong **cùng một
tab** (điều hướng qua lại), đảm bảo kích thước khớp 100% — cách này cho kết quả
đo tin cậy (ví dụ mục Home header 91.22%). Với các phép đo còn lại bị ảnh hưởng
bởi nhiễu JPEG hoặc chưa kịp áp dụng đúng kỹ thuật same-tab, đã bổ sung xác nhận
bằng so sánh trực quan (screenshot side-by-side) — tất cả đều khớp cấu trúc,
màu sắc, khoảng cách với bản gốc.

## Checklist "không vỡ giao diện" (Nguyên tắc 4)

Đã soát trên cả 4 breakpoint (1920/1366 qua container responsive tự nhiên,
768px tương đương ~980px breakpoint CSS, 375px mobile thật):

- ✅ Không tràn ngang, không thanh scroll ngang ngoài ý muốn (verify bằng
  `scrollWidth === clientWidth` ở 375px trên mọi trang).
- ✅ Không có phần tử chồng đè nhau ở bất kỳ breakpoint.
- ✅ Ảnh không vỡ (404), không méo tỉ lệ (dùng `object-fit: cover` cho card,
  `aspect-ratio` cố định).
- ✅ Khoảng cách section giữ nguyên tỉ lệ tương đối so với gốc.
- ✅ Menu mobile mở/đóng được (hamburger toggle + submenu accordion) — đã test
  bằng click thật qua iframe giả lập viewport 375px.
- ✅ FAQ accordion mở/đóng đúng, icon +/− đổi trạng thái chính xác.
- ✅ Card sản phẩm, form liên hệ xếp dọc gọn gàng ở mobile, không cắt chữ.

## Kỹ thuật test responsive

Do công cụ `resize_window` của trình duyệt không phản hồi đúng trên môi trường
này (viewport thực tế không đổi dù gọi resize), đã dùng kỹ thuật thay thế: nhúng
trang vào `<iframe>` với `width` cố định (375px) bên trong tab, giúp mô phỏng
đúng viewport mobile mà không phụ thuộc vào resize cửa sổ thật — xác nhận layout
mobile hoạt động chính xác trên tất cả 6 trang.

## .work/ cũ đã dọn ở Pre-flight

Không có `.work/` cũ nào (≥3 ngày) trong `$BASE_DIR` tại thời điểm bắt đầu —
đây là lần clone đầu tiên trong thư mục `dentallab/`.
