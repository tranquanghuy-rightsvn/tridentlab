# GAS.md — Guideline trang quản trị Trident Dental Lab (tridentdentallab.com.au)

> Nguồn quyết định CHỐT của dự án này. Đọc TOÀN BỘ file này trước khi sửa bất kỳ file nào
> trong `gas/`. Không tự suy đoán / bịa thêm field, quy tắc, tên biến ngoài những gì ghi ở đây.
> Sửa code xong phải cập nhật ngược lại file này trong CÙNG 1 lượt sửa.
>
> Playbook chung: skill `free-cms-static-site-pipeline`.
> ⚠️ Một số quyết định dưới đây đánh dấu **[TẠM — xác nhận lại]** vì chủ dự án mới nêu yêu cầu
> ở mức khái quát ("quản lý người dùng + 3 form gửi về admin + gửi mail `NOTIFY_EMAIL`").
> Chủ dự án xác nhận/sửa các mục đó rồi bỏ nhãn.

## 0. Phạm vi (ĐÚNG 4 mục, không làm rộng hơn)

Đây **KHÔNG phải CMS nội dung**. Không có blog, không publish gì lên repo site, không build lại
site tĩnh từ trang quản trị. Chỉ là **hộp thư tiếp nhận yêu cầu từ khách + quản lý tài khoản
quản trị**:

1. **Open Account** — đơn mở tài khoản nha sĩ (form `/open-account/`).
2. **Send a Case** — đơn gửi ca (wizard `/prescription-form/`).
3. **Get a Quote** — yêu cầu báo giá / liên hệ (form `/contact-us/`).
4. **Người dùng** — tài khoản đăng nhập trang quản trị.

Cả 3 form (1–3) đều là **khách gửi → admin nhận**: lưu vào Google Sheet + gửi email báo tới
`NOTIFY_EMAIL`. Admin xem danh sách, xem chi tiết, đổi trạng thái, xoá. Admin KHÔNG phản hồi
khách qua trang này (chỉ xem + xử lý nội bộ).

⛔ Không đụng tới giao diện/nội dung site tĩnh (`html/**`) trong phạm vi CMS này — trừ khi
được yêu cầu riêng để nối 3 form vào `<GAS_EXEC_URL>` và tạo trang `/admin/` + `/admin-gas/`.

---

## I. Đăng nhập

1. Luồng: nhập email → gửi OTP qua email → nhập mã → vào trang quản trị. Không mật khẩu, không
   phụ thuộc session Google (người dùng thật hiếm khi cùng Workspace domain với chủ script).
2. Chỉ email ĐÃ ĐĂNG KÝ (có trong sheet `Users`) mới được gửi OTP.
3. Account chủ GAS (người deploy) LUÔN hợp lệ + LUÔN là `root` ngầm định — không lưu trong
   sheet `Users`, không hiện / không quản lý được trong tab Người dùng.
   ⚠️ Bẫy bắt buộc né: `requestOtp()` phải kiểm tra `email === ownerEmail_()` SONG SONG với
   tra sheet `Users`, nếu không chính chủ script bị chặn ngay từ bước xin mã.
4. **Phân quyền 2 cấp `root > editor`** (`ROLE_RANK = { editor: 1, root: 3 }`). Không có
   `admin`, không có `viewer`. **[TẠM — xác nhận lại]** — nếu sau này cần một cấp trung gian
   có hành vi PHÂN BIỆT rõ (vd editor không được xem PII khách), mới thêm.

   | Chức năng | editor | root |
   |---|---|---|
   | Open Account / Send a Case / Get a Quote (xem / đổi trạng thái / xoá) | ✅ | ✅ |
   | Người dùng (thêm / đổi quyền / xoá) | ❌ | ✅ |

   Qua trang quản trị chỉ gán được quyền `editor` (`CMS_MANAGEABLE_ROLES = ['editor']`). Dòng
   `root` chỉ sửa tay trong Sheet — không bao giờ qua UI. Không tự thao tác lên chính mình.
5. OTP sống **10 phút**, cooldown **60 giây**/email, tối đa **5 lần** nhập sai rồi phải xin mã
   mới. Token phiên sống **30 ngày**, lưu `localStorage`.
6. Server tự `requireRole_` ở MỌI hàm gọi từ client — ẩn nút trên UI không phải là bảo mật.

## II. 3 form công khai (Open Account / Send a Case / Get a Quote)

### II.1. Nhận dữ liệu — `doPost(e)`

- Site tĩnh (domain khác) gọi `fetch('<GAS_EXEC_URL>', { method:'POST', body: JSON.stringify(payload),
  headers: { 'Content-Type': 'text/plain;charset=utf-8' } })` — dùng `text/plain` để né CORS
  preflight (GAS không xử lý OPTIONS).
  `<GAS_EXEC_URL>` (deploy 2026-09-01) khai 1 chỗ duy nhất ở **`html/js/forms.js`** (biến
  `ENDPOINT`) + `html/admin/index.html` + `html/admin-gas/index.html`. Đổi deploy → sửa 3 chỗ.
  Đã nối: `js/forms.js` tự bắt mọi `<form data-tdl-form="...">` (Open Account, Get a Quote);
  wizard `js/case-wizard.js` gọi `window.tdlPostSubmission('send-case', payload)`.
- `payload` = `{ type, _hp, ...toàn bộ field của form }`. `type` ∈ `'open-account'` | `'send-case'`
  | `'quote'`. Giá trị `type` lạ → `{ ok:false }`, không lưu.
- **Honeypot**: field ẩn tên `_hp`. Có giá trị (khác rỗng) → âm thầm trả `{ ok:true }`, KHÔNG
  lưu, KHÔNG gửi mail (không "dạy" bot biết đã bị chặn).
- **Rate-limit**: 30 giây/lần theo khoá `type + '|' + (email || phone)` qua `CacheService`.
  Quá nhanh → `{ ok:false, error:'Bạn gửi quá nhanh, thử lại sau ít phút.' }`.
- Ghi vào đúng sheet của `type` (mục IX). `LockService.getScriptLock()` bọc thao tác ghi
  (tránh 2 request ghi đè số dòng nhau).
- **KHÔNG bao giờ ghi các đơn này lên repo GitHub** — chứa PII khách hàng (tên nha sĩ, tên
  bệnh nhân, SĐT, email). Chỉ nằm trong Google Sheet.

### II.2. Field lưu

Schema cố định 7 cột cho cả 3 sheet, KHÔNG tách cột theo từng field của form (form có thể đổi):
`id`, `created_at`, `name`, `email`, `phone`, `status`, `data`.

- `id` — `Utilities.getUuid()`.
- `created_at` — ISO string giờ khai trong `appsscript.json` (`Australia/Brisbane`).
- `name`, `email`, `phone` — rút ra từ payload để hiện nhanh trong danh sách + làm khoá
  rate-limit / khoá tìm kiếm. Quy tắc rút (server, không tin client bỏ trống):
  - Open Account: `name` = `dentist_name`; `email` = `email` || `accounts_email`; `phone` =
    `phone` || `accounts_phone`.
  - Send a Case: `name` = `dentist_name` (kèm `" — BN: " + patient_name` nếu có); `email` =
    `email`; `phone` = `phone`.
  - Quote: `name` = `name`; `email` = `email`; `phone` = `phone`.
- `status` — enum CHỐT (lưu nguyên văn tiếng Việt có dấu, UTF-8): `"Mới"` | `"Đang xử lý"` |
  `"Đã xử lý"` | `"Đã huỷ"`. Mặc định `"Mới"`. `STATUSES` khai giống hệt ở `gas/Code.js` VÀ
  `gas/js.html` — sửa 1 bên phải sửa bên kia (thư mục `gas/` được gitignore, không track
  git nên không tự đồng bộ được — xem mục XIII).
- `data` — **chuỗi JSON toàn bộ field client gửi lên** (đã bỏ `type`, `_hp`). Trang quản trị
  render `data` thành bảng key → value ở phần chi tiết. Nhờ vậy form thêm/bớt field không cần
  đổi schema Sheet hay code CMS.

### II.3. Field wizard "Send a Case" có file đính kèm

Wizard `/prescription-form/` cho chọn file scan (STL/PLY/OBJ) + ảnh. **[TẠM — xác nhận lại]**:
bản đầu KHÔNG upload file lên server (site đang là tĩnh, chưa có backend nhận file lớn). Client
chỉ gửi **danh sách TÊN file** (`scan_files`, `photo_files` = mảng tên) trong `data`, kèm dòng
nhắc khách "gửi file qua email `cases.thetridentlab@gmail.com`" như hiện tại. Khi cần nhận file
thật → chốt nơi lưu (Drive?) rồi làm sau.

### II.4. Gửi email báo

- Sau khi lưu Sheet thành công → gửi 1 email qua `MailApp.sendEmail` tới **`NOTIFY_EMAIL`**
  (Script Property, mục XI). KHÔNG có địa chỉ mặc định trong code. Chưa khai `NOTIFY_EMAIL` =
  không gửi mail, **đơn vẫn được lưu vào Sheet bình thường** (`requireCfg_('NOTIFY_EMAIL')`
  nằm trong `try` của `notifyNewSubmission_`, lỗi chỉ `Logger.log`).
- Tiêu đề: `"[Trident Dental Lab] " + <nhãn loại> + " — " + <name>`. Nhãn loại: `Mở tài khoản`
  / `Gửi ca` / `Yêu cầu báo giá`.
- Nội dung: danh sách `key: value` của toàn bộ `data`, + dòng `Thời gian` + `Mã đơn (id)`.
  Text thuần, không HTML (đủ dùng, tránh lọt spam).
- ⚠️ Dùng CHUNG quota Gmail 100 mail/ngày với OTP đăng nhập. Ngày cao điểm chạm mốc → OTP
  không gửi được. Lúc đó cân nhắc tách tài khoản Gmail riêng cho OTP, hoặc chuyển kênh báo
  form sang Telegram (xem `hosting-and-quotas.md`).

## III. Trang quản trị — danh sách & chi tiết đơn

- 3 tab `Open Account` | `Send a Case` | `Get a Quote`, cùng khuôn:
  - Bảng: `Ngày` · `Tên` · `Email / SĐT` · `Trạng thái`. Sắp xếp mới nhất lên trên.
  - Bấm 1 dòng → modal chi tiết: bảng `data` (key → value) + `<select>` đổi trạng thái +
    nút Xoá.
  - Bộ lọc theo `status` (chip "Tất cả / Mới / Đang xử lý / Đã xử lý / Đã huỷ").
- Đổi trạng thái: 1 round-trip `setStatus(token, type, id, status)` — server kiểm `status`
  hợp lệ, `requireRole_(token, 'editor')`. Xong → cập nhật danh sách ngay, không F5.
- Xoá: modal **Xác nhận** (Huỷ / Xoá) TRƯỚC, rồi mới gọi `deleteSubmission(token, type, id)`.
  Không hoàn tác (Sheet không có thùng rác trong luồng này). Xong → modal **Thông báo** 1 nút
  Đóng.
- Danh sách tải qua `boot()` (mục VIII) — không gọi nối tiếp nhiều lượt lúc mở trang.

## IV. Người dùng (chỉ `root`)

- Tab chỉ hiện với `root` (server vẫn tự chặn `requireRole_(token, 'root')`).
- Thêm mới: nhập email + quyền (chỉ chọn được `editor`). Người đó tự đăng nhập bằng OTP gửi
  tới email đó — không cấp mật khẩu.
- Đổi quyền: chỉ giữa các quyền trong `CMS_MANAGEABLE_ROLES` (hiện chỉ `editor` → không có gì
  để đổi; để sẵn khung cho tương lai). Dòng đang là `root` → từ chối, báo "sửa trực tiếp trong
  bảng dữ liệu" (KHÔNG nhắc "Sheet" — xem mục VII).
- Không cho tự đổi quyền / xoá chính tài khoản đang đăng nhập.
- Không hiện / không quản lý được account chủ GAS.

## V. UX chung (áp dụng cho MỌI thao tác trong trang quản trị)

- 2 loại pop-up RIÊNG BIỆT, giữa màn hình, KHÔNG `alert()`/`confirm()` native, KHÔNG toast:
  1. **Xác nhận** (Huỷ / Xoá-hoặc-Đồng ý) — hỏi TRƯỚC khi xử lý.
  2. **Thông báo kết quả** (1 nút Đóng) — hiện SAU khi xong, không tự ẩn.
- Mọi nút async: `disabled` + spinner trong lúc chờ, tự phục hồi kể cả khi lỗi (`withLoading`
  + `finally`).
- Sau Lưu/Xoá/Đổi trạng thái thành công: danh sách của chính tab đó tự cập nhật ngay, F5 ngay
  sau đó cũng không hiện lại dữ liệu cũ.
- Chuyển tab CHỈ là hiệu ứng giao diện — không tải lại trang, không gọi lại toàn bộ dữ liệu.
  Mỗi tab giữ dữ liệu lần tải trước trong `localStorage` (sống qua F5), render ngay rồi
  revalidate ngầm với cờ `silent`.
- Đăng nhập lần đầu: 1 round-trip `boot(token)` duy nhất trả `{ me, appHtml, openAccount,
  sendCase, quotes, users }`. Lần sau: hiện ngay từ cache `localStorage` (stale-while-revalidate).
- Mọi key `localStorage` (TRỪ token đăng nhập) mang hậu tố `CLIENT_BUILD`. `CLIENT_BUILD` **tự
  sinh**: server băm MD5 nội dung `app.html` + `js.html` + `css.html` (`clientBuild_()` trong
  `Code.js`), bơm xuống qua `index.html` (`window.CLIENT_BUILD`). Sửa 1 trong 3 file client =
  băm khác = cache cũ tự bị dọn (`purgeStaleCaches_()` lúc tải script). KHÔNG dùng hằng số gõ
  tay (bắt người nhớ bump là thiết kế sai).
- `boot` cache phải tự đồng bộ NGAY sau mọi mutation (`setStatus`/`deleteSubmission`/user…),
  không chỉ chờ revalidate nền.

## VI. Endpoint công khai — chống spam & CORS

- `doGet` chỉ trả **khung + form đăng nhập** (không có gì về nghiệp vụ). Markup phần đã đăng
  nhập nằm trong `app.html`, chỉ trả qua `getAppHtml(token)` có `requireRole_(token, 'editor')`.
- `doPost` xử lý 3 form công khai (mục II). `doGet`/`doPost` đều
  `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` để nhúng iframe được vào
  `/admin/` sau này.
- Honeypot `_hp` + rate-limit 30s (mục II.1) là mức chống spam tối thiểu bắt buộc.

## VII. Giấu hạ tầng phía sau khỏi mắt khách

⛔ **CẤM nhắc tới hạ tầng ("Google Sheet", "Apps Script", "Drive", "spreadsheet"...) trong BẤT
KỲ thứ gì gửi xuống trình duyệt** — chữ giao diện, gợi ý, **thông báo lỗi** (`throw` từ
`Code.js` cũng hiện lên UI), KỂ CẢ comment trong `app.html`/`js.html`/`index.html`/`css.html`
(F12 đọc được hết). `Code.js` chạy phía máy chủ nên comment an toàn — trừ chuỗi được `throw`.

Chỗ cần nói "cái này không sửa được ở đây" thì viết đúng vậy, hoặc "liên hệ bên kỹ thuật".
Không có nút/link nào mở thẳng kho dữ liệu.

Kiểm trước mỗi lần deploy (phải KHÔNG ra kết quả):
```
grep -niE 'sheet|spreadsheet|drive|apps script' gas/app.html gas/js.html gas/index.html gas/css.html
```

Đây là che giấu ở mức giao diện, KHÔNG phải bảo mật. Bảo mật thật = `requireRole_` server +
đăng nhập OTP.

## VIII. `boot(token)` — dữ liệu khởi động

1 hàm server trả trong 1 round-trip:
```
{ me: { email, role },            // token sai/hết hạn -> role: null, KHÔNG throw
  appHtml,                        // markup phần đã đăng nhập
  openAccount: [ {id,created_at,name,email,phone,status,data}, ... ],
  sendCase:    [ ... ],
  quotes:      [ ... ],
  users:       [ {email, role}, ... ]   // chỉ trả khi me.role === 'root', ngược lại []
}
```
`data` trả về client là **object đã `JSON.parse`** (server parse sẵn, client không parse lại).

## IX. Kiến trúc lưu trữ

**Google Sheet "Trident Dental Lab — Admin Data"** (code tự tạo lần chạy đầu, `SPREADSHEET_ID`
tự lưu lại — KHÔNG khai tay). Tên sheet / cột CỐ ĐỊNH:

| Sheet | Cột |
|---|---|
| `Users` | `email`, `role` |
| `OpenAccount` | `id`, `created_at`, `name`, `email`, `phone`, `status`, `data` |
| `SendCase` | `id`, `created_at`, `name`, `email`, `phone`, `status`, `data` |
| `Quotes` | `id`, `created_at`, `name`, `email`, `phone`, `status`, `data` |

- `data` là chuỗi JSON (mục II.2). `status` enum ở mục II.2.
- Dữ liệu 3 sheet đơn CHỈ nằm trong Google Sheet — không bao giờ ghi ra repo / công khai.
- Không có GitHub Contents API trong dự án này (không publish gì).

**Trang quản trị — ĐÃ dựng:**
| Đường dẫn | File | Vai trò |
|---|---|---|
| `/admin/` | `html/admin/index.html` | Bản NHÚNG: iframe + cắt 25px thanh cảnh báo Google bằng CSS — thanh địa chỉ luôn là domain khách. Treo >12s → hiện nút mở `/admin-gas/`. |
| `/admin-gas/` | `html/admin-gas/index.html` | Đường lui: `location.replace` + `<meta refresh>` thẳng ra `<GAS_EXEC_URL>`. |
- Cả 2 trang: `<meta robots noindex,...>` + `<meta referrer no-referrer>`. `html/_headers` khai
  `X-Robots-Tag` cho `/admin/*` + `/admin-gas/*` (Cloudflare/Netlify; Vercel → `vercel.json`).
- KHÔNG khai `Disallow` cho 2 đường này trong `robots.txt`, KHÔNG link công khai trỏ tới.
- ⚠️ Đã verify `/admin/` nhúng chạy (hiện màn đăng nhập thật). CHƯA test token `localStorage`
  trong iframe bên thứ ba có sống sót qua F5 không (Safari hay chặn) — test trước khi bàn giao;
  nếu phải nhập OTP lại thì bỏ bản nhúng, dùng thẳng `/admin-gas/`.

## X. Checklist bug phải né (đúc kết từ playbook)

- **Đăng nhập được nhưng không vào được trang quản trị** → `requestOtp` quên ngoại lệ chủ
  script (mục I.3), hoặc email chưa `trim().toLowerCase()`.
- **Sửa code client, F5 vẫn thấy giao diện CŨ** → cache `localStorage` giữ `appHtml` cũ. Fix
  đủ 2 lớp: `CLIENT_BUILD` tự băm + `purgeStaleCaches_()`; revalidate ngầm so `appHtml` mới ≠
  cũ thì vẽ lại (giữ tab đang xem, KHÔNG vẽ đè khi đang mở modal chi tiết). ⛔ Không "chữa"
  bằng cách bảo khách tự xoá localStorage.
- **Hàm chạy ngầm nuốt lỗi (`.catch(()=>{})`)** → luôn `console.warn`.
- **Sheets tự convert `"YYYY-MM-DD"` thành Date** → luôn `String()` / `Utilities.formatDate`
  khi đọc ra; ở đây lưu `created_at` dạng ISO string đầy đủ nên ít gặp, vẫn cẩn thận khi đọc.
- **`requestOtp` chặn cả chủ script** → phải `email === ownerEmail_()` song song tra `Users`.
- **Gửi mail lỗi làm hỏng việc lưu đơn** → `notifyNewSubmission_` bọc `try`, lỗi chỉ log.
- **Không có `LockService` khi ghi đơn** → 2 submit cùng lúc ghi đè dòng. Bọc `getScriptLock`.

## XI. Script Properties (Project Settings > Script Properties) — TÊN CỐ ĐỊNH

- `NOTIFY_EMAIL` — **bắt buộc nếu muốn nhận mail báo đơn**. KHÔNG có giá trị mặc định trong
  code. Để trống = không gửi mail (đơn vẫn lưu bình thường). Chủ dự án tự điền sau.
- `SPREADSHEET_ID` — KHÔNG cần điền, code tự tạo lần chạy đầu và tự lưu lại. Nếu ĐÃ có giá trị
  mà mở thất bại → throw rõ ràng, KHÔNG tự tạo file mới đè lên.
- (KHÔNG cần `GITHUB_*` — dự án này không publish gì lên repo.)

## XII. Việc chủ dự án cần làm để chạy được (không phải việc của agent)

1. Tạo project Apps Script mới, dán 6 file trong `gas/` (`Code.js`, `appsscript.json`,
   `index.html`, `app.html`, `css.html`, `js.html`).
2. Deploy > New deployment > **Web app** · Execute as **Me** · Who has access **Anyone**.
   → được `<GAS_EXEC_URL>` dạng `.../exec`. **Gửi URL này cho agent** để nối 3 form + tạo
   `/admin/` + `/admin-gas/`.
3. Project Settings > Script Properties: thêm `NOTIFY_EMAIL` = email nhận báo đơn.
4. Vào tab Người dùng (đăng nhập bằng chính account deploy — là `root` ngầm định) để thêm các
   email `editor`.

## XIII. `gas/` được gitignore — quy tắc đồng bộ code

Thư mục `gas/` **không track git** (thêm vào `.gitignore` ngay từ đầu — playbook
`free-cms-static-site-pipeline` gotcha #10: đây là code backend — logic phân quyền, cấu trúc
kho dữ liệu, cơ chế xử lý — nhiều chủ dự án không muốn lộ trong repo chia sẻ được).

Hệ quả bắt buộc tuân thủ:
- Deploy bằng cách **dán/`clasp push` thủ công** vào Apps Script editor, KHÔNG qua git.
- Sau MỖI lần agent sửa file trong `gas/`: agent phải **liệt kê rõ đúng tên từng file đã đổi**
  cho chủ dự án (vì `git status`/`git diff` không thấy `gas/`), rồi nhắc: cập nhật file đó
  trong Apps Script editor → **Deploy → Manage deployments → Edit → New version** (KHÔNG tạo
  "New deployment" — sẽ sinh URL `/exec` mới).
- `GAS.md` (file này) VẪN track git bình thường — nó là guideline, không phải code backend.

⚠️ **Ghi nhận lệch chuẩn (2026-09-01):** ở 2 commit đầu (`9ac9887`, `c40ff4d`) toàn bộ `gas/`
đã bị commit + push lên `origin/master` trước khi kịp gitignore. Commit sau đã `git rm -r
--cached gas/` + thêm `.gitignore`, nên từ đây `gas/` không còn được track. NHƯNG 2 commit cũ
vẫn nằm trong lịch sử trên remote — nếu repo này ở chế độ chia sẻ được / public thì code
backend vẫn xem được trong lịch sử. Muốn xoá hẳn phải rewrite history + force-push (làm hỏng
mọi bản clone khác) — chỉ làm khi chủ dự án yêu cầu rõ.
