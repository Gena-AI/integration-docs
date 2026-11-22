# 🖼️ Đặc tả Kỹ thuật: Nhúng xINBOX Iframe & Giao thức `postMessage` Hai chiều

> **Dành cho:** Đội ngũ phát triển Web Application, Portal nội bộ & Nền tảng Đối tác tích hợp bên thứ ba.  
> **Phiên bản:** `v1.3.0`  
> **Ngày cập nhật gần nhất:** `2026-11-22`  
> **Mục tiêu:** Chuẩn hóa toàn bộ kiến trúc nhúng ứng dụng **xINBOX** qua `<iframe>`, cơ chế bảo mật whitelist origin & subdomain tự động, vòng đời xác thực SSO không gián đoạn, hàng đợi chống race condition và hợp đồng `window.postMessage` hai chiều.

---

## 📜 Lịch sử Phiên bản & Changelog (Revision History)

| Phiên bản | Ngày | Phân loại | Tóm tắt nội dung thay đổi |
| :--- | :--- | :--- | :--- |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | • **Sửa ảnh & Chụp màn hình hai chiều:** Cờ `externalEditImage`, xINBOX phát `OMNICHANNEL_EDIT_SCREENSHOT` (legacy `viewListImage` với `AllowEdit: true`), Host phản hồi `OMNICHANNEL_SCREENSHOT_EDITED` (legacy `editImage`) kèm guard kiểm tra `conversationId`. ([Xem 4.6](#46-tùy-chọn-externaleditimage--luồng-chỉnh-sửa-ảnh--chụp-màn-hình-hai-chiều), [3.2](#32-chiều-xinbox-iframe--host-app))<br>• **Đồng bộ Hội thoại Active:** Event `OMNICHANNEL_CONVERSATION_CHANGED` báo khi đổi phòng chat hoặc về rỗng (`conversationId`, `accountId`, `contact`). ([Xem 3.2](#32-chiều-xinbox-iframe--host-app)) |
| **v1.2.0** | `2026-11-12` | <span class="badge-update">UPDATED</span> | • **Whitelist Origin & Wildcards:** Thêm `gnh.edu.vn`, `bke.app` và duyệt tự động mọi subdomain `*.gnh.edu.vn`, `*.bke.app` qua HTTPS chống giả mạo URL. ([Xem 1.2](#12-điều-kiện-tiên-quyết-về-origin--whitelist-bảo-mật)) |
| **v1.1.0** | `2026-11-11` | <span class="badge-new">NEW</span> | • **Co-branding & Auth tức thì:** `brandName` động (tự ẩn `|` nếu rỗng), mở Auth modal ngay khi không có token bỏ delay 3s. ([Xem 2.2](#22-ba-trạng-thái-khởi-tạo-khi-mở--chuyển-workspace), [3.1](#31-chiều-host-app--xinbox-iframe))<br>• **3 Embed Flags ban đầu:** `externalViewImage`, `externalContact`, `showToggleSize` trong `OMNICHANNEL_INIT_AUTH`. ([Xem 3.1](#31-chiều-host-app--xinbox-iframe), [4.5](#45-tùy-chọn-externalviewimage--externalcontact-updated-2026-11-11))<br>• **Event Tương tác Mới:** Bổ sung `OMNICHANNEL_VIEW_CONTACT` và chuẩn hóa `OMNICHANNEL_VIEW_IMAGE` (song song legacy `viewListImage`). ([Xem 3.2](#32-chiều-xinbox-iframe--host-app)) |

--- | :--- | :--- | :--- | :--- |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.2 & 4.6 Sửa ảnh](#46-tùy-chọn-externaleditimage--luồng-chỉnh-sửa-ảnh--chụp-màn-hình-hai-chiều) | Bổ sung luồng chỉnh sửa ảnh & chụp màn hình hai chiều: xINBOX phát `OMNICHANNEL_EDIT_SCREENSHOT` (kèm legacy `viewListImage` với `AllowEdit: true`), Host phản hồi `OMNICHANNEL_SCREENSHOT_EDITED` (legacy `editImage`). Thêm cờ `externalEditImage`. |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.2 Iframe ➔ Host](#32-chiều-xinbox-iframe--host-app) | Bổ sung event `OMNICHANNEL_CONVERSATION_CHANGED` tự động thông báo khi người dùng chọn/đổi hội thoại hoặc trở về danh sách trống (`conversationId`, `accountId`, `contact`). |
| **v1.2.0** | `2026-11-12` | <span class="badge-update">UPDATED</span> | [1.2 Whitelist Origin](#12-điều-kiện-tiên-quyết-về-origin--whitelist-bảo-mật) | Bổ sung domain chính và cơ chế tự động duyệt mọi cấp subdomain `*.gnh.edu.vn` và `*.bke.app` qua HTTPS. |
| **v1.1.0** | `2026-11-11` | <span class="badge-new">NEW</span> | [3.1 & 4.5 Embed Flags](#31-chiều-host-app--xinbox-iframe) | Bổ sung 3 cờ điều khiển giao diện ban đầu: `externalViewImage`, `externalContact`, `showToggleSize` (mặc định `false`). |
| **v1.1.0** | `2026-11-11` | <span class="badge-new">NEW</span> | [3.2 Iframe ➔ Host](#32-chiều-xinbox-iframe--host-app) | Bổ sung event `OMNICHANNEL_VIEW_CONTACT` và chuẩn hóa `OMNICHANNEL_VIEW_IMAGE` (song song legacy `viewListImage`). |
| **v1.1.0** | `2026-11-11` | <span class="badge-update">UPDATED</span> | [2.2 & 3.1 Brand Name](#22-ba-trạng-thái-khởi-tạo-khi-mở--chuyển-workspace) | Hỗ trợ `brandName` động trong Auth Modal, tự động ẩn vạch `|` nếu rỗng; mở modal tức thì không delay 3s khi không có token. |

--- | :--- | :---: | :--- | :--- |
| **v1.3.0** | `2026-11-22` | <span class="badge-update">UPDATED</span> | [1.2 Whitelist Origin](#12-điều-kiện-tiên-quyết-về-origin--whitelist-bảo-mật) | Bổ sung domain gốc và hỗ trợ duyệt tự động mọi subdomain `*.gnh.edu.vn` và `*.bke.app` qua HTTPS. |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.1 & 4.5 Embed Flags](#31-chiều-host-app--xinbox-iframe) | Bổ sung 4 cờ điều khiển giao diện trong `OMNICHANNEL_INIT_AUTH`: `externalViewImage`, `externalEditImage`, `externalContact`, `showToggleSize` (mặc định `false`). |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.2 & 4.6 Sửa ảnh](#46-tùy-chọn-externaleditimage--luồng-chỉnh-sửa-ảnh--chụp-màn-hình-hai-chiều) | Bổ sung luồng chỉnh sửa ảnh & chụp màn hình hai chiều: xINBOX phát `OMNICHANNEL_EDIT_SCREENSHOT` (legacy `viewListImage` với `AllowEdit: true`), Host phản hồi `OMNICHANNEL_SCREENSHOT_EDITED` (legacy `editImage`). |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.2 Event View Contact](#32-chiều-xinbox-iframe--host-app) | Bổ sung event `OMNICHANNEL_VIEW_CONTACT` bắn `contactId` ra Host khi click "Xem thông tin liên hệ". |
| **v1.3.0** | `2026-11-22` | <span class="badge-new">NEW</span> | [3.2 Event View Image](#32-chiều-xinbox-iframe--host-app) | Chuẩn hóa event `OMNICHANNEL_VIEW_IMAGE` (phát song song với legacy `viewListImage` để tương thích ngược). |
| **v1.3.0** | `2026-11-22` | <span class="badge-update">UPDATED</span> | [3.1 & 3.3 Co-branding Name](#33-giải-thích-chi-tiết-ý-nghĩa-từng-tham-số-quan-trọng) | Hỗ trợ truyền động `brandName` qua `OMNICHANNEL_INIT_AUTH`. Nếu không truyền hoặc rỗng thì ẩn hoàn toàn vạch `\|` và tên đối tác trên màn hình đăng nhập. |
| **v1.3.0** | `2026-11-22` | <span class="badge-update">UPDATED</span> | [2.2 Handshake Auth](#22-ba-trạng-thái-khởi-tạo-khi-mở--chuyển-workspace) | Tối ưu mở Auth Modal tức thì khi Host gửi `OMNICHANNEL_INIT_AUTH` không có token (bỏ độ trễ chờ 3s). |
| **v1.3.0** | `2026-11-22` | <span class="badge-update">UPDATED</span> | [4.5 Tách bạch Ngữ nghĩa UI](#45-tùy-chọn-externalviewimage--externalcontact) | Panel chi tiết bên phải đổi tên thành **"Thông tin hội thoại"** để tách bạch ngữ nghĩa với **"Xem thông tin liên hệ"** (mở hồ sơ CRM Host). |
| **v1.0.0** | `2026-10-25` | <span class="badge-neutral">INITIAL</span> | Toàn bộ tài liệu | Xuất bản đặc tả nhúng Iframe và giao thức `postMessage` phiên bản chuẩn ban đầu. |

---

## 1. Tổng quan Kiến trúc Nhúng `<iframe>`

### 1.1 Cấu hình Nhúng & Quyền Trình duyệt
Ứng dụng tích hợp nhúng trực tiếp giao diện xINBOX qua thẻ `<iframe>` trỏ tới URL triển khai của xINBOX Web (ví dụ: `https://xinbox-lite.hub.vn/` hoặc domain theo môi trường):

```html
<iframe
  id="xinbox-iframe"
  src="https://xinbox-lite.hub.vn/"
  allow="autoplay; display-capture; microphone; camera; clipboard-read; clipboard-write"
  style="width: 100%; height: 100%; border: 0;"
></iframe>
```

* **Quyền Media & Clipboard (`allow`):** Thuộc tính `allow` cấp quyền phát âm thanh thông báo tin nhắn mới, ghi âm, gọi thoại, chụp ảnh/màn hình và thao tác copy/paste clipboard.
* **Quy chuẩn `sandbox` (nếu dùng):** Nếu Host App cấu hình sandbox, bắt buộc mở tối thiểu:  
  `sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups"`  
  để không gây chặn script, form đăng nhập và popup OAuth.
* **Khuyến nghị Giữ sống trong DOM (Persistent Mount):**  
  Nên **ẩn/hiện bằng CSS** (`display: none` hoặc trượt vị trí `transform`) khi đóng/mở thanh bên chứa xINBOX thay vì hủy (`unmount`) thẻ `<iframe>`. Cơ chế này mang lại 2 lợi ích lớn:
  1. Giữ nguyên kết nối WebSocket realtime để nhận thông báo số tin chưa đọc (`OMNICHANNEL_UNREAD_COUNT_CHANGED`) ngay cả khi đóng khung chat.
  2. Lần mở lại tiếp theo hiển thị ngay lập tức (0ms) mà không phải nạp lại toàn bộ trang web.

---

### 1.2 Điều kiện Tiên quyết về Origin & Whitelist Bảo mật `[Updated: 2026-11-12]`

xINBOX Iframe áp dụng cơ chế xác thực nguồn gửi (`event.origin`) nghiêm ngặt ở cả 2 chiều:
1. **Chiều nhận lệnh từ Host App:** Mọi `postMessage` từ `event.origin` không nằm trong whitelist đều bị xINBOX Iframe bỏ qua.
2. **Chiều gửi dữ liệu nhạy cảm lên Host App:** Các sự kiện chứa token xác thực (`OMNICHANNEL_AUTH_CONNECTED`, `OMNICHANNEL_AUTH_COMPLETE`) **tuyệt đối không gửi tới wildcard `"*"`**. Nếu origin của Host không qua được kiểm tra whitelist, Iframe sẽ từ chối gửi để ngăn rò rỉ token qua Clickjacking / Iframe hijacking.

#### Danh sách Origin Cố định & Wildcard Subdomain Được Duyệt:
* **Môi trường phát triển cục bộ:** `http://localhost:8080`, `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:8080`, `http://127.0.0.1:3000`
* **Môi trường myXteam / WorkDone:** `https://app-v2.myxteam.com`, `https://workdone.myxteam.com`
* **Môi trường Đối tác GNH `[Updated: 2026-11-22]`:** `https://gnh.edu.vn` và **mọi cấp subdomain** `https://*.gnh.edu.vn` (VD: `https://app.gnh.edu.vn`, `https://lms.dev.gnh.edu.vn`, `https://sub.gnh.edu.vn:8443`...).
* **Môi trường Đối tác BKE `[Updated: 2026-11-22]`:** `https://bke.app` và **mọi cấp subdomain** `https://*.bke.app` (VD: `https://app.bke.app`, `https://dev.api.bke.app`, `https://sub.bke.app:8443`...).

> 🛡️ **Cơ chế Chống Giả mạo Domain (Anti-Spoofing):**  
> Hệ thống kiểm tra bằng URL parser chuẩn: bắt buộc giao thức `https:`, không chứa userinfo/credentials, và hostname phải khớp chính xác domain gốc hoặc có tiền tố dấu chấm `.` (ví dụ: `.gnh.edu.vn`). Các domain giả mạo hậu tố như `https://evilgnh.edu.vn` hoặc `https://gnh.edu.vn.attacker.com` đều bị **CHẶN 100%**.

---

## 2. Vòng đời Xác thực & Đồng bộ Trạng thái (Host ⟷ xINBOX Iframe)

### 2.1 Nguồn Dữ liệu Xác thực
Hệ thống tích hợp lấy bản ghi **User Mapping** của người dùng hiện tại từ Backend Nội bộ (truy vấn theo `(workspaceId, userId)` hoặc chỉ theo `userId` nếu không phân chia Workspace):

```json
{
  "hostUserId": 1024,
  "xinboxAgentId": 88,
  "token": "usr_tok_abc123xyz...",
  "pubsubToken": "pub_tok_789...",
  "isEnabled": true,
  "workspaceId": 12
}
```

* **Lưu ý về `workspaceId`:** Trường `workspaceId` này là ngữ cảnh riêng của Host App, xINBOX chỉ lưu tạm để gửi trả lại khi bấm Hủy liên kết (`OMNICHANNEL_DELETE_MAPPING`). Nghiệp vụ phân quyền trong xINBOX vận hành hoàn toàn theo `accountId` (Account ID của xINBOX).

---

### 2.2 Ba Trạng thái Khởi tạo Khi Mở / Chuyển Workspace

#### Trạng thái A — Đã có Mapping kèm `token` hợp lệ (SSO Tự động):
1. Khi Iframe đã load hoặc phát tín hiệu `OMNICHANNEL_READY`, Host gửi `OMNICHANNEL_INIT_AUTH` chứa `token` tới đúng `targetOrigin` của xINBOX.
2. xINBOX tự động xác thực token, kết nối WebSocket realtime, tải danh sách hội thoại rồi phát lại `OMNICHANNEL_AUTH_COMPLETE`.

#### Trạng thái B — Đã có Mapping nhưng CHƯA có `token`:
1. Host gửi `OMNICHANNEL_INIT_AUTH` không có `token` (hoặc gửi kèm `brandName` của đối tác).
2. **`[Updated: 2026-11-22]`** xINBOX Iframe nhận diện không có token sẽ tắt ngay màn hình chờ và mở form đăng nhập Co-branding ngay tức thì (không phải đợi timeout 3s).
3. Người dùng đăng nhập thành công → Iframe phát `OMNICHANNEL_AUTH_CONNECTED` kèm thông tin tài khoản → Host gọi API nội bộ `updateUserMapping` để lưu lại token cho các lần sau.

#### Trạng thái C — Chưa có Mapping trên Backend Nội bộ:
1. Host gửi `OMNICHANNEL_LOGOUT` hoặc `OMNICHANNEL_INIT_AUTH` trống token.
2. Khi người dùng nhập tài khoản xINBOX và đăng nhập thành công, Iframe phát `OMNICHANNEL_AUTH_CONNECTED` → Host gọi `createUserMapping` tạo liên kết người dùng mới.

---

### 2.3 Sơ đồ Handshake Xác thực Hai chiều (Sequence Diagram)

```
[Host App]                                            [xINBOX Iframe]
    │                                                        │
    ├───────── 1. Mount <iframe src="https://..."> ─────────►│
    │                                                        │ (Nạp ứng dụng)
    │◄──────── 2. OMNICHANNEL_READY { status: "ready" } ─────┤
    │                                                        │
    ├─► [Kiểm tra User Mapping trên Backend Nội bộ]          │
    │                                                        │
    │── (Trường hợp A: Đã có token) ─────────────────────────│
    ├───────── 3A. OMNICHANNEL_INIT_AUTH { token, flags } ──►│
    │                                                        │ (Xác thực token)
    │                                                        │ (Kết nối WebSocket)
    │◄──────── 4A. OMNICHANNEL_AUTH_COMPLETE ────────────────┤ (Sẵn sàng chat)
    │                                                        │
    │── (Trường hợp B / C: Chưa có token) ───────────────────│
    ├───────── 3B. OMNICHANNEL_INIT_AUTH { brandName, ... } ─►│ (Không token)
    │                                                        │ ➔ Tắt loading ngay,
    │                                                        │ ➔ Mở Co-branding Login
    │                                                        │ (User nhập user/pass)
    │◄──────── 4B. OMNICHANNEL_AUTH_CONNECTED { token, ... } ┤
    ├─► [Lưu User Mapping vào Backend Nội bộ]                │
    │                                                        │
    │◄──────── 5. OMNICHANNEL_UNREAD_COUNT_CHANGED ──────────┤ (Cập nhật badge đỏ)
    │                                                        │
```

---

### 2.4 Xử lý Khi Chuyển Workspace hoặc Hết hạn Phiên
* **User đổi Workspace trên Host App:** Đặt lại cờ `hasInjectedAuth = false`, gọi lại API lấy mapping của workspace mới (bỏ qua cache) rồi thực hiện lại quy trình khởi tạo.
* **Token hết hạn (`401 Unauthorized` từ xINBOX Server):** xINBOX Iframe tự động dọn phiên, ngắt WebSocket và phát lại `OMNICHANNEL_READY`.
* **User bấm Đăng xuất trong Iframe:** Iframe gửi `OMNICHANNEL_LOGOUT` về Host → Host xóa cache phiên cục bộ (nhưng giữ ghi nhớ `hasExistingMappingOnServer = true`).
* **User bấm Hủy liên kết trong Iframe:** Iframe gửi `OMNICHANNEL_DELETE_MAPPING` → Host gọi API nội bộ xóa mapping trên database, dọn sạch state và gửi `OMNICHANNEL_LOGOUT` vào Iframe.

---

## 3. Đặc tả Giao thức `window.postMessage` Hai chiều

Định dạng gói tin JSON chuẩn giữa hai ứng dụng:

```json
{
  "type": "<EVENT_TYPE>",
  "payload": { }
}
```

> ⚠️ **Lưu ý:** Luôn gửi Object thuần (sử dụng `JSON.parse(JSON.stringify(payload))` nếu dùng Vue/React reactive state) để tránh lỗi `DataCloneError`.

---

### 3.1 Chiều Host App ➔ xINBOX Iframe

| Event `type` | Cấu trúc `payload` | Mục đích & Hành vi phía xINBOX Iframe |
| :--- | :--- | :--- |
| `OMNICHANNEL_INIT_AUTH` `[Updated: 2026-11-22]` | `{ token?, pubsubToken?, userId?, workspaceId?, deletedUserId?, brandName?, externalViewImage?, externalEditImage?, externalContact?, showToggleSize? }` | Bơm Access Token tự động đăng nhập hoặc cấu hình Co-branding `brandName` & 4 cờ UI (kể cả khi chưa có `token`). Nếu có `token`: Iframe xác thực và trả `OMNICHANNEL_AUTH_COMPLETE`. Nếu không có `token`: Iframe tắt loading ngay và mở form đăng nhập. |
| `OMNICHANNEL_LOGOUT` | `{}` | Ép đăng xuất phiên hiện tại, ngắt WebSocket realtime và hiển thị form đăng nhập. |
| `OMNICHANNEL_SWITCH_WORKSPACE` | `{ accountId }` *(hoặc số nguyên)* | Chuyển tài khoản/workspace xINBOX active sang `accountId` *(tự chờ tối đa 6s nếu đang trong quá trình auth)*. |
| `OMNICHANNEL_OPEN_CONVERSATION` | `{ conversationId, accountId? }` | Mở trực tiếp phòng chat `conversationId`. Nếu có truyền kèm `accountId`, Iframe tự chuyển workspace trước rồi mới mở hội thoại. |
| `OMNICHANNEL_OPEN_NEW_CONVERSATION` | `{ contact?, accountId? }` | Mở Modal soạn hội thoại mới kèm thông tin khách hàng `contact` điền sẵn. |
| `OMNICHANNEL_CONTACT_DELETED` | `{ contactId, accountId? }` | Đồng bộ khi CRM Host xóa contact: Iframe tự động lọc bỏ hội thoại khỏi danh sách, đóng panel chi tiết nếu đang mở và làm mới dữ liệu. |
| `OMNICHANNEL_SIZE_CHANGED` | `{ size: string, isFull: boolean }` | Đồng bộ trạng thái kích thước khung nhúng (kích thước thường vs `FULL`) để nút phóng to/thu nhỏ trên Header Iframe đảo icon tương ứng. |
| `OMNICHANNEL_LANG_CHANGE` | `{ lang: "vi" \| "en" }` *(hoặc `locale`)* | Đồng bộ ngôn ngữ hiển thị trong Iframe theo cài đặt của Host App. |

---

### 3.2 Chiều xINBOX Iframe ➔ Host App

| Event `type` | Cấu trúc `payload` | Mục đích & Hành vi phía Host App |
| :--- | :--- | :--- |
| `OMNICHANNEL_READY` | `{ status: "ready" }` | Iframe đã sẵn sàng nhận lệnh. Host gửi `OMNICHANNEL_SIZE_CHANGED` và bơm `OMNICHANNEL_INIT_AUTH` hoặc xả hàng đợi `pendingAction`. |
| `OMNICHANNEL_AUTH_COMPLETE` | `{ status: "complete" }` | Xác thực và tải xong danh sách hội thoại ban đầu. Đây là **thời điểm chuẩn nhất** để Host App thực thi mở hội thoại đang chờ. |
| `OMNICHANNEL_AUTH_CONNECTED` | `{ id, token, pubsubToken, accountId, accounts, user? }` | Người dùng đăng nhập thủ công thành công trong Iframe. Host nhận token để lưu User Mapping lên Backend nội bộ. *(Chỉ gửi tới whitelist origin)*. |
| `OMNICHANNEL_LOGOUT` | `{}` | Người dùng bấm Đăng xuất trong Iframe → Host xóa cache phiên cục bộ. |
| `OMNICHANNEL_DELETE_MAPPING` | `{ workspaceId?, deletedUserId? }` | Người dùng bấm Hủy liên kết tài khoản trong Header Iframe → Host gọi API Backend xóa User Mapping. |
| `OMNICHANNEL_UNREAD_COUNT_CHANGED` | `{ unreadCount: number, hasUnread: boolean, latestMessage? }` | Thông báo tổng số tin nhắn chưa đọc thay đổi → Host hiển thị badge đỏ trên icon thanh điều hướng bên ngoài. |
| `OMNICHANNEL_TOGGLE_SIZE` | `{ isFull: boolean }` | Người dùng bấm nút Phóng to / Thu nhỏ trên Header Iframe → Host mở rộng / thu hẹp chiều rộng khung nhúng sidebar. *(Iframe phát song song legacy event `fullsizePopup`)*. |
| `OMNICHANNEL_GET_SIZE` | `{}` | Iframe yêu cầu Host cung cấp kích thước khung nhúng hiện tại lúc mới khởi tạo. |
| `OMNICHANNEL_VIEW_CONTACT` <span class="badge-new">NEW · 2026-11-11</span> | `{ contactId, accountId?, conversationId?, contact? }` | Khi bật `externalContact: true`: Người dùng bấm mục **"Xem thông tin liên hệ"** trong menu 3 chấm → Host nhận `contactId` để mở hồ sơ CRM riêng bên Host App. |
| `OMNICHANNEL_VIEW_IMAGE` <span class="badge-new">NEW · 2026-11-11</span> | `{ index: number, images: Array<{ title, url, thumbUrl? }> }` | Khi bật `externalViewImage: true`: Người dùng click vào ảnh trong chat/email/file → Host nhận danh sách ảnh để mở Lightbox xem ảnh toàn màn hình. *(Iframe phát song song legacy event `viewListImage`)*. |
| `OMNICHANNEL_EDIT_SCREENSHOT` <span class="badge-new">NEW · 2026-11-22</span> | `{ requestId, conversationId, title, dataUrl, allowSendToChat: true }` | Khi bật `externalEditImage: true`: Người dùng chụp màn hình hoặc bấm sửa ảnh đính kèm → xINBOX ủy quyền mở công cụ vẽ/chỉnh sửa ảnh trên Host. *(Legacy WorkDone nhận `viewListImage` với `AllowEdit: true`, `CallBackEdit: "editImage"`, `AutoOpenEdit: true`)*. |

---

### 3.3 Giải thích Chi tiết Ý nghĩa từng Tham số Quan trọng

| Tham số | Chiều truyền | Ý nghĩa & Hướng dẫn sử dụng |
| :--- | :---: | :--- |
| `token` | Host ⇄ Iframe | **User Access Token** của Agent xINBOX (không phải Account API Key dạng `xib_...`). Bắt buộc dùng cho API và xác thực kết nối realtime. |
| `pubsubToken` | Host ⇄ Iframe | Token đăng ký kênh WebSocket/ActionCable realtime; lưu trữ kèm trong User Mapping nội bộ. |
| `userId` / `id` | Host ⇄ Iframe | Định danh ID Agent bên xINBOX (`xinboxAgentId`). |
| `workspaceId` & `deletedUserId` | Host ➔ Iframe | Ngữ cảnh của Host App; Iframe chỉ lưu tạm để gửi trả lại khi Hủy liên kết (`OMNICHANNEL_DELETE_MAPPING`). Không bắt buộc với hệ thống đơn tổ chức. |
| `accountId` | Host ⇄ Iframe | ID Account/Workspace bên **xINBOX** (hoàn toàn khác với `workspaceId` của Host App). |
| `conversationId` | Host ➔ Iframe | ID cuộc hội thoại cần điều hướng mở trực tiếp khi nạp Iframe. |
| `contact` | Host ⇄ Iframe | Dùng để điền sẵn thông tin khách hàng trong `OMNICHANNEL_OPEN_NEW_CONVERSATION` hoặc chuyển ngữ cảnh trong `OMNICHANNEL_VIEW_CONTACT`. |
| `brandName` `[Updated: 2026-11-11]` | Host ➔ Iframe | **Tên thương hiệu đối tác** (chuỗi ký tự, VD: `"WorkDone"`, `"GNH"`, `"BKE"`).<br>• Khi có giá trị: Auth Modal hiển thị Co-branding `xINBOX \| <brandName>` và câu chào/bảo mật có tên đối tác.<br>• Khi không truyền (hoặc rỗng): **Ẩn hoàn toàn vạch `\|` và tên brand**, chỉ hiện logo xINBOX căn giữa.<br>• Giữ nguyên trong Iframe kể cả khi logout/đổi tài khoản khác. |
| `externalViewImage` `[New: 2026-11-11]` | Host ➔ Iframe | **Boolean (mặc định `false`)**.<br>• `true`: Khi bấm ảnh trong tin nhắn chat/attachments/email, Iframe phát `OMNICHANNEL_VIEW_IMAGE` để Host mở Lightbox toàn màn hình.<br>• `false`: Iframe tự mở popup preview ảnh nội bộ. |
| `externalEditImage` `[New: 2026-11-22]` | Host ➔ Iframe | **Boolean (mặc định `false`)**.<br>• `true`: Khi chụp ảnh màn hình hoặc sửa ảnh đính kèm, xINBOX ủy quyền cho Host mở công cụ vẽ/chỉnh sửa ảnh qua event `OMNICHANNEL_EDIT_SCREENSHOT` (và legacy `viewListImage` với `AllowEdit: true`).<br>• `false`: Dùng trình vẽ/sửa ảnh nội bộ của xINBOX. |
| `requestId` | Iframe ⇄ Host | Chuỗi định danh duy nhất của lượt yêu cầu chỉnh sửa ảnh (VD: `ss_1731388800000_a1b2c3`), Host trả ngược lại để xINBOX đối chiếu chính xác. |
| `dataUrl` / `imageUrl` | Iframe ⇄ Host | Dữ liệu ảnh định dạng Base64 Data URL (`data:image/png;base64,...`) hoặc URL công khai gửi giữa Host và Iframe. |
| `autoSend` | Host ➔ Iframe | Boolean trong `OMNICHANNEL_SCREENSHOT_EDITED`. `true`: xINBOX tự động gửi ảnh vào phòng chat ngay; `false` (mặc định): chỉ nạp vào danh sách đính kèm của ô nhập tin nhắn để user xem lại trước khi gửi. |
| `externalContact` `[New: 2026-11-11]` | Host ➔ Iframe | **Boolean (mặc định `false`)**.<br>• `true`: Bật thêm tùy chọn **"Xem thông tin liên hệ"** trong menu 3 chấm (`...`) để phát `OMNICHANNEL_VIEW_CONTACT`. Hoàn toàn độc lập với panel **"Thông tin hội thoại"** nội bộ của xINBOX.<br>• `false`: Ẩn tùy chọn này. |
| `showToggleSize` `[New: 2026-11-22]` | Host ➔ Iframe | **Boolean (mặc định `false`)**.<br>• `true`: Hiển thị nút Phóng to / Thu nhỏ ở góc phải Header Iframe.<br>• `false`: Ẩn nút này khi Host nhúng theo kích thước cố định hoặc toàn trang. |
| `size` / `isFull` | Host ⇄ Iframe | Đồng bộ trạng thái mở rộng (`FULL`) hoặc kích thước thường giữa khung chứa ngoài và icon trên Iframe. |
| `images`, `index` `[New: 2026-11-22]` | Iframe ➔ Host | Danh sách ảnh chuẩn hóa `{ title, url, thumbUrl? }` và chỉ số `index` (0-based) truyền trong sự kiện `OMNICHANNEL_VIEW_IMAGE`. |

---

## 4. Hàng đợi Hành động, Chống Race Condition & Tùy biến UI

### 4.1 Cơ chế Hàng đợi Hành động (Pending Action Queue)
Do `<iframe>` tải bất đồng bộ qua mạng, Host App không thể gửi ngay lệnh mở hội thoại khi Iframe chưa sẵn sàng:

1. **Lưu trữ Action ở Singleton cấp Global:** Đăng ký listener cấp ứng dụng giữ hành động gần nhất:  
   `pendingOpenAction = { type: 'OPEN_CONVERSATION', payload: { conversationId: 123 } }`.
2. **Điều kiện Dispatch lệnh ngay (`dispatchActionToIframe`):** Chỉ phát khi đồng thời: thẻ `<iframe>` đã mount vào DOM, `iframeLoaded === true` và `hasInjectedAuth === true`.
3. **Thời điểm Flush lệnh chuẩn:** Lắng nghe sự kiện `OMNICHANNEL_AUTH_COMPLETE` từ Iframe để xả lệnh. Cài đặt fallback timer 500ms sau khi gửi `OMNICHANNEL_INIT_AUTH` (retry tối đa 20 lần × 200ms) để không bị treo vĩnh viễn nếu mạng lag.

---

### 4.2 Chống Race Condition Khi Chuyển Workspace & Mở Hội thoại
> ⛔ **Quy tắc Bắt buộc:**  
> **Tuyệt đối không gửi 2 event `OMNICHANNEL_SWITCH_WORKSPACE` và `OMNICHANNEL_OPEN_CONVERSATION` tách rời nhau.**  
> Nếu tách rời, Iframe sẽ nhận lệnh mở hội thoại khi chưa kịp chuyển workspace xong trên server dẫn tới lỗi không tìm thấy cuộc trò chuyện.  
> 
> 👉 **Cách làm đúng:** Luôn truyền `accountId` nằm trực tiếp bên trong payload của `OMNICHANNEL_OPEN_CONVERSATION`:
> ```json
> {
>   "type": "OMNICHANNEL_OPEN_CONVERSATION",
>   "payload": {
>     "conversationId": 456,
>     "accountId": 18
>   }
> }
> ```
> Iframe sẽ tự động kiểm tra: nếu `accountId !== activeAccountId`, Iframe tự `await` chuyển workspace hoàn tất rồi mới mở phòng chat `conversationId`.

---

### 4.3 Bảo mật `postMessage` Hai phía
* **Khi nhận tin nhắn (`window.addEventListener('message')`):**  
  Luôn trích xuất `const expectedOrigin = new URL(xinboxUrl).origin` và kiểm tra:  
  `if (event.origin !== expectedOrigin) return;` trước khi đọc dữ liệu.
* **Khi gửi tin nhắn (`iframe.contentWindow.postMessage`):**  
  Luôn chỉ định cụ thể `targetOrigin = new URL(xinboxUrl).origin`, **không bao giờ truyền `"*"`** đối với các gói tin chứa Access Token hay thông tin người dùng.

---

### 4.4 Cơ chế Toggle Size & Responsive 1/2/3 Cột

* **Điều kiện hiển thị nút Phóng to / Thu nhỏ:** Nút chỉ xuất hiện khi `showToggleSize: true` trong `OMNICHANNEL_INIT_AUTH`.
* **Tránh kích hoạt Toggle 2 lần:** Khi click nút, Iframe phát đồng thời `OMNICHANNEL_TOGGLE_SIZE` (`{ isFull }`) và legacy event `fullsizePopup` (`boolean`). Phía Host App **chỉ nên lắng nghe 1 event duy nhất là `OMNICHANNEL_TOGGLE_SIZE`**, đọc boolean `isFull` để thay đổi CSS chiều rộng và phản hồi lại `OMNICHANNEL_SIZE_CHANGED`.
* **Quy chuẩn Responsive tự động theo chiều rộng Iframe:**
  * `< 768px` (1 cột Mobile View): Ẩn danh sách khi vào phòng chat; có nút `<` (Back) quay lại danh sách.
  * `768px – 1279px` (2 cột Split View): Danh sách (380px) + Khung chat trung tâm (`flex: 1`). Panel thông tin mở dạng overlay trượt từ mép phải.
  * `>= 1280px` (3 cột Full View): Danh sách (380px) + Khung chat (`flex: 1`) + Panel Thông tin hội thoại (380px) mở song song cố định.

---

### 4.5 Tùy chọn `externalViewImage` & `externalContact` `[Updated: 2026-11-11]`

* **`externalViewImage` (mặc định `false`):**
  * `false`: Mở trình xem ảnh / fallback nội bộ trong Iframe.
  * `true`: Phát `OMNICHANNEL_VIEW_IMAGE` (kèm legacy `viewListImage`) để Host App mở Lightbox ảnh toàn màn hình với bộ điều khiển riêng.
* **`externalContact` (mặc định `false`):**
  * Tùy chọn độc lập hoàn toàn với panel nội bộ.
  * `true`: Menu 3 chấm (`...`) ở góc trên hội thoại hiển thị thêm mục **"Xem thông tin liên hệ"** trên mọi kích thước màn hình. Khi người dùng click, Iframe phát sự kiện `OMNICHANNEL_VIEW_CONTACT` mang theo `contactId`, `accountId`, `conversationId` để Host App chủ động mở trang hồ sơ CRM chuyên sâu bên phía Host.
  * `false`: Ẩn mục này; nút **"Thông tin hội thoại"** vẫn mở panel nội bộ của xINBOX bình thường.

---

## 5. Checklist Triển khai Từng bước

- [ ] **1. Đăng ký Whitelist Origin:** Đảm bảo domain Staging & Production (hoặc các subdomain `*.gnh.edu.vn`, `*.bke.app`) đã được đăng ký trong whitelist của xINBOX Iframe.
- [ ] **2. Dựng Thẻ Iframe Persistent:** Đặt thẻ `<iframe>` với đầy đủ quyền `allow="..."`, sử dụng CSS ẩn/hiện thay vì unmount DOM để duy trì kết nối WebSocket.
- [ ] **3. Kết nối API User Mapping:** Gọi API nội bộ lấy `token` → Bơm qua `OMNICHANNEL_INIT_AUTH` (hoặc gửi cấu hình không token nếu chưa liên kết để hiển thị form đăng nhập Co-branding ngay).
- [ ] **4. Bắt Các Event Phản hồi:** Lắng nghe `OMNICHANNEL_AUTH_CONNECTED` để lưu User Mapping mới; lắng nghe `OMNICHANNEL_UNREAD_COUNT_CHANGED` để cập nhật badge thông báo.
- [ ] **5. Cài đặt Hàng đợi Pending Action:** Lưu hành động cần mở và flush lệnh ngay khi nhận được tín hiệu `OMNICHANNEL_AUTH_COMPLETE`.
- [ ] **6. Bắt Event Toggle & Media (nếu có dùng):** Xử lý `OMNICHANNEL_TOGGLE_SIZE` thay đổi kích thước khung chứa; xử lý `OMNICHANNEL_VIEW_IMAGE` mở Lightbox ngoài và `OMNICHANNEL_VIEW_CONTACT` mở hồ sơ CRM.
- [ ] **7. Kiểm định Bảo mật Hai đầu:** Luôn kiểm tra `event.origin` khi nhận và truyền đúng `targetOrigin` khi gửi postMessage.
