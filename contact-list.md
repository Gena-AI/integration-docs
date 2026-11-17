# 📱 Đặc tả Kỹ thuật Tích hợp: Danh sách & Quản lý Liên hệ (Contacts API)

> **Dành cho:** Đội ngũ phát triển Ứng dụng Di động (Mobile App iOS / Android) & Nền tảng Tích hợp bên thứ ba.  
> **Mục tiêu:** Chuẩn hóa toàn bộ luồng nạp dữ liệu, cấu trúc trường hiển thị, phân trang, tìm kiếm, lọc nâng cao, cập nhật trạng thái và các API liên quan đến module **Liên hệ (Contacts / CRM)** từ xINBOX Gateway.

---

## 1. Tổng quan Kiến trúc & Xác thực (Architecture & Auth)

### 1.1. Cổng kết nối & Header bắt buộc
Mọi truy vấn đến danh bạ liên hệ đều đi qua xINBOX Gateway và gắn chặt với định danh tài khoản (`accountId`):

* **Base URL:** `https://xinbox-app.hub.vn` (hoặc cấu hình `API_GATEWAY_URL` theo môi trường)
* **Headers bắt buộc:**
  ```http
  api_access_token: <XINBOX_USER_TOKEN>
  Content-Type: application/json
  Accept: application/json
  ```

### 1.2. Cơ chế Đa tài khoản (Multi-tenant Account ID)
Tất cả các endpoint của Contact đều yêu cầu tham số `{accountId}` trong URL:  
`/api/v1/accounts/{accountId}/contacts...`

> ⚠️ **Lưu ý App Mobile:** Khi người dùng chuyển đổi Workspace/Tài khoản xINBOX, App **bắt buộc** phải xóa sạch cache danh bạ cũ và nạp lại từ trang 1 của `{accountId}` mới.

---

## 2. Quy trình Khởi tạo Dữ liệu (Initialization Sequence)

Trước khi render danh sách liên hệ lên màn hình, App cần thực hiện tuần tự 4 bước khởi tạo:

```
[Bắt đầu mở màn hình Danh bạ]
       │
       ▼
 ┌────────────────────────────────────────────────────────┐
 │ BƯỚC 1: Lấy activeAccountId & Token xác thực           │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ BƯỚC 2: Tải danh mục Nhân viên (Agents)                │
 │ GET /api/v1/accounts/{accountId}/agents                │
 │ -> Lưu map: agentId => { name, email, avatar, initial }│
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ BƯỚC 3: Tải Định nghĩa Trường tùy chỉnh (Custom Fields)│
 │ GET /api/v1/accounts/{accountId}/custom_attribute_defs │
 │ -> Phục vụ hiển thị trường động & bộ lọc               │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ BƯỚC 4: Tải Cấu hình Bộ lọc Đã lưu (Saved Views / Tabs)│
 │ GET /api/v1/accounts/{accountId}/custom_filters        │
 │ -> Render các Tab: Tất cả / Của tôi / Chưa phân công   │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ BƯỚC 5: Tải Danh sách Contact Trang 1                  │
 │ GET /api/v1/accounts/{accountId}/contacts?page=1       │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Danh sách API Tải & Thao tác Contact

### 3.1. Tải danh sách phân trang mặc định
Dùng khi người dùng mở màn hình danh bạ, đổi trang hoặc kéo cuộn vô tận (Infinite Scroll).

* **Method:** `GET`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts`
* **Query Parameters:**
  | Tham số | Kiểu | Mặc định | Ý nghĩa |
  | :--- | :--- | :--- | :--- |
  | `page` | `number` | `1` | Số thứ tự trang (bắt đầu từ 1) |
  | `per_page` | `number` | `25` (hoặc `50`) | Số lượng bản ghi trên một trang |
  | `limit` | `number` | `25` | Đồng bộ với `per_page` |
  | `sort` | `string` | `-created_at` | Chuỗi sắp xếp: `name`, `-name`, `created_at`, `-created_at`, `last_activity_at`, `-last_activity_at`, `phone_number`, `-phone_number` (*dấu `-` là giảm dần / DESC*) |

* **Response Example:**
  ```json
  {
    "payload": [
      {
        "id": 10425,
        "name": "Nguyễn Văn An",
        "email": "an.nguyen@congty.com",
        "phone_number": "+84901234567",
        "thumbnail": "https://avatar-url.com/avatar.jpg",
        "created_at": 1709827200,
        "last_activity_at": 1710123456,
        "additional_attributes": {
          "city": "Hồ Chí Minh",
          "country": "Vietnam",
          "description": "Giám đốc kinh doanh",
          "social_profiles": {
            "facebook": "https://fb.com/an.nguyen",
            "zalo": "0901234567"
          }
        },
        "custom_attributes": {
          "lead_status": "qualified",
          "assigned_agent": 82,
          "company": "Công ty TNHH Giải Pháp Công Nghệ",
          "company_id": 402,
          "nhu_cau": "Tư vấn gói Enterprise"
        },
        "company": {
          "id": 402,
          "name": "Công ty TNHH Giải Pháp Công Nghệ"
        }
      }
    ],
    "meta": {
      "count": 1250,
      "current_page": 1
    }
  }
  ```

---

### 3.2. Tìm kiếm nhanh Liên hệ (Quick Search)
Dùng khi người dùng gõ từ khóa vào ô tìm kiếm trên thanh công cụ.

* **Method:** `GET`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts/search`
* **Query Parameters:**
  | Tham số | Kiểu | Bắt buộc | Ý nghĩa |
  | :--- | :--- | :---: | :--- |
  | `q` | `string` | Có | Từ khóa tìm kiếm (hỗ trợ tìm theo Tên, SĐT, Email) |
  | `page` | `number` | Không | Trang cần lấy (mặc định: `1`) |
  | `per_page` | `number` | Không | Kích thước trang |
  | `sort` | `string` | Không | Thứ tự sắp xếp |

> 💡 **Khuyến nghị cho Mobile:** Debounce ô tìm kiếm **300ms - 400ms** trước khi phát request để tránh quá tải server khi người dùng gõ phím liên tục.

---

### 3.3. Lọc nâng cao / Tải theo Bộ lọc Đã lưu (Advanced Filter & Saved Views)
Dùng khi người dùng chọn lọc nâng cao nhiều tiêu chí hoặc chọn vào một Tab tùy chỉnh.

* **Method:** `POST`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts/filter?page={page}&per_page={pageSize}&limit={pageSize}&sort={sort}`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "payload": [
      {
        "attribute_key": "lead_status",
        "filter_operator": "equal_to",
        "values": ["qualified"],
        "query_operator": "and"
      },
      {
        "attribute_key": "assigned_agent",
        "filter_operator": "equal_to",
        "values": [82],
        "query_operator": "and"
      }
    ],
    "sort": "-created_at"
  }
  ```
* **Bảng toán tử hỗ trợ (`filter_operator`):**
  * `equal_to`: Bằng chính xác
  * `not_equal_to`: Khác
  * `contains`: Chứa từ khóa
  * `does_not_contain`: Không chứa từ khóa
  * `is_present`: Đã có dữ liệu (không null)
  * `is_not_present`: Chưa có dữ liệu (null/rỗng)

---

### 3.4. Cập nhật thông tin Liên hệ (Inline Update / Kanban Drag)
Dùng khi chỉnh sửa trường thông tin, đổi nhân viên phụ trách hoặc kéo thẻ chuyển trạng thái Lead trên Kanban.

* **Method:** `PATCH`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts/{contactId}`
* **Request Body:**
  ```json
  {
    "name": "Nguyễn Văn An",
    "email": "an.nguyen@congty.com",
    "phone_number": "+84901234567",
    "custom_attributes": {
      "lead_status": "won",
      "assigned_agent": 82
    },
    "additional_attributes": {
      "city": "Hồ Chí Minh",
      "description": "Đã ký hợp đồng 1 năm"
    }
  }
  ```

---

### 3.5. Xóa Liên hệ (Delete Contact)
* **Method:** `DELETE`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts/{contactId}`
* **Xử lý xóa hàng loạt (Bulk Delete):** Gọi tuần tự hoặc song song các request xóa đơn lẻ qua danh sách `id` đã tick chọn.

---

### 3.6. Xem Lịch sử Hội thoại của Liên hệ
Dùng tại Tab "Hội thoại" trong màn hình chi tiết Contact:

* **Method:** `GET`
* **Endpoint:** `/api/v1/accounts/{accountId}/contacts/{contactId}/conversations`
* **Response:** Danh sách các cuộc trò chuyện trên các kênh (Zalo, Facebook, Email, Livechat...) của liên hệ đó.

---

### 3.7. Xem & Thêm Ghi chú Nội bộ (Notes)
Dùng tại Tab "Ghi chú" trong chi tiết Contact:

* **Lấy danh sách ghi chú:** `GET /api/v1/accounts/{accountId}/contacts/{contactId}/notes`
* **Thêm ghi chú mới:**  
  `POST /api/v1/accounts/{accountId}/contacts/{contactId}/notes`  
  Body: `{ "content": "Khách hàng yêu cầu gửi báo giá trước thứ 6" }`

---

## 4. Bảng Ánh xạ Thuộc tính Hiển thị (Field Mapping Matrix)

App cần map chính xác các trường JSON từ API sang các thành phần hiển thị trên giao diện:

| Tên trường UI | Nguồn dữ liệu từ API JSON | Kiểu | Quy tắc hiển thị & Fallback |
| :--- | :--- | :--- | :--- |
| **Tên liên hệ** | `item.name` $\rightarrow$ `item.identifier` | `string` | Nếu rỗng hiển thị: `"Khách hàng"`. Cắt `ellipsis` nếu tên quá dài. |
| **Ảnh đại diện** | `item.thumbnail` $\rightarrow$ `item.avatar_url` | `url` | Nếu không có ảnh: Render avatar tròn có chữ cái đầu (`initials`) trên nền màu hash (`avatarBg`). |
| **Chữ viết tắt** | Hàm tính từ `name` | `string` | Tối đa 2 chữ cái đầu (VD: *"Nguyễn Văn An"* $\rightarrow$ *"NA"*). |
| **Màu nền Avatar** | Hash từ chuỗi `name` | `hex` | Chọn 1 trong 8 mã màu chuẩn hệ thống (xanh, tím, cam, lục...). |
| **Số điện thoại** | `item.phone_number` | `string` | Hiển thị dạng chuẩn. Nhấp vào kích hoạt gọi điện (`tel:`) trên App. |
| **Địa chỉ Email** | `item.email` | `string` | Cắt `...` nếu dài. Nhấp vào kích hoạt gửi email (`mailto:`). |
| **Nhân viên phụ trách** | `item.custom_attributes.assigned_agent` | `number` | Dùng ID này tra cứu trong danh sách `workspaceMembers` lấy Tên + Avatar nhân viên. Nếu rỗng: *"Chưa phân công"*. |
| **Doanh nghiệp** | `item.company.name` $\rightarrow$ `item.custom_attributes.company` | `string` | Tên công ty mà liên hệ trực thuộc. Hiển thị badge icon tòa nhà. |
| **ID Doanh nghiệp** | `item.company_id` $\rightarrow$ `item.company.id` | `number` | Dùng để chuyển nhanh sang màn hình chi tiết Company khi người dùng click vào. |
| **Trạng thái Lead** | `item.custom_attributes.lead_status` | `string` | Xem bảng chuẩn hóa 5 trạng thái ở Mục 5. Render Badge màu tương ứng. |
| **Ngày tạo** | `item.created_at` | `unix/iso` | Định dạng hiển thị: `DD/MM/YYYY HH:mm`. |
| **Cập nhật cuối** | `item.last_activity_at` $\rightarrow$ `item.updated_at` | `unix/iso` | Tính thời gian tương đối: *"5 phút trước"*, *"hôm qua"*... |
| **Tỉnh / Thành phố** | `item.additional_attributes.city` | `string` | Hiển thị vị trí địa lý của khách hàng. |
| **Quốc gia** | `item.additional_attributes.country` | `string` | Quốc gia (mặc định: *"Vietnam"*). |
| **Mạng xã hội** | `item.additional_attributes.social_profiles` | `object` | Gồm icon Facebook (`.facebook`) và Zalo (`.zalo`). Nhấp vào mở app/link tương ứng. |
| **Trường tùy chỉnh** | `item.custom_attributes[key]` | `any` | Hiển thị động theo kiểu dữ liệu của định nghĩa trường (Ngày tháng, Tiền tệ, Checkbox, Text...). |

---

## 5. Lưu ý Đặc biệt: Xử lý `lead_status` và `assigned_agent` (Special Attributes Deep-Dive)

Đây là **2 thuộc tính quan trọng bậc nhất** trong CRM nhưng có cơ chế lưu trữ và xử lý đặc thù mà đội App bắt buộc phải nắm rõ để tránh lỗi giao diện, sai lệch trạng thái hoặc mất liên kết nhân viên.

### 5.1. Bản chất Lưu trữ: Nằm trong `custom_attributes` (Không phải Root Field)
* Trong kiến trúc xINBOX CRM, model `Contact` **không** có cột trực tiếp tên là `lead_status` hay `assigned_agent` ở cấp root (như `name`, `email`, `phone_number`).
* Cả hai thuộc tính này được lưu trữ bên trong object `custom_attributes`:
  * `contact.custom_attributes.lead_status`
  * `contact.custom_attributes.assigned_agent` *(ở các bản ghi cũ từ hệ thống trước, có thể fallback sang `contact.additional_attributes.assigned_agent`)*.
* **Quy tắc khi tạo mới (`POST /contacts`) hoặc cập nhật (`PATCH /contacts/{id}`):**
  Payload gửi lên **bắt buộc** phải bọc trong `custom_attributes`:
  ```json
  // CẬP NHẬT TRẠNG THÁI HOẶC GÁN NHÂN VIÊN
  {
    "custom_attributes": {
      "lead_status": "contacted",
      "assigned_agent": 82
    }
  }
  ```
  *(Tuyệt đối không gửi `{ "lead_status": "contacted" }` ở ngoài root payload vì API xINBOX sẽ bỏ qua).*

---

### 5.2. Chuyên sâu về `lead_status` (Trạng thái Lead)

#### A. Vấn đề Dữ liệu Kế thừa (Legacy Values)
Do dữ liệu trong xINBOX được đồng bộ từ nhiều nguồn (import file Excel, form nhúng, bot webhook, các phiên bản cũ trước đây), giá trị chuỗi lưu trong database có thể là tiếng Việt có dấu, không dấu, viết hoa hoặc tiếng Anh:

| Key chuẩn quốc tế | Tên hiển thị chuẩn | Màu sắc Badge | Các giá trị kế thừa trong DB (Legacy Values) |
| :---: | :--- | :--- | :--- |
| `new` | **Mới tiếp cận** | Xanh dương / Slate (`#64748b`) | `"Mới tiếp cận"`, `"moi_tiep_can"`, `"New"`, `"new"` |
| `contacted` | **Đang tư vấn** | Vàng cam / Sky (`#0284c7`) | `"Đang tư vấn"`, `"dang_tu_van"`, `"consulting"`, `"Contacted"`, `"contacted"`, `"in_progress"` |
| `qualified` | **Tiềm năng** | Hổ phách / Amber (`#d97706`) | `"Tiềm năng"`, `"tiem_nang"`, `"Qualified"`, `"qualified"` |
| `won` | **Thành công** | Xanh ngọc / Emerald (`#059669`) | `"Thành công"`, `"thanh_cong"`, `"Won"`, `"won"`, `"customer"`, `"converted"` |
| `lost` | **Thất bại** | Đỏ / Rose (`#dc2626`) | `"Thất bại"`, `"that_bai"`, `"Lost"`, `"lost"`, `"unqualified"` |
| `__unassigned__` / Rỗng | **Chưa có trạng thái** | Xám nhạt (`#94a3b8`) | `""`, `null`, `undefined`, `"__unassigned__"` |

#### B. Quy tắc BẮT BUỘC cho App (Read vs Write)
1. **Khi Đọc dữ liệu (GET list / search / filter):**
   * **BẮT BUỘC** chạy qua hàm chuẩn hóa `normalizeLeadStatus(val)` trước khi render UI hoặc đưa vào state:
   ```typescript
   export function normalizeLeadStatus(val?: string | null): string {
     if (!val || typeof val !== "string") return "";
     const trimmed = val.trim();
     if (!trimmed || trimmed === "__unassigned__") return "";

     const lower = trimmed.toLowerCase();
     if (["new", "moi_tiep_can", "mới tiếp cận"].includes(lower)) return "new";
     if (["contacted", "dang_tu_van", "đang tư vấn", "consulting", "in_progress"].includes(lower)) return "contacted";
     if (["qualified", "tiem_nang", "tiềm năng"].includes(lower)) return "qualified";
     if (["won", "thanh_cong", "thành công", "customer", "converted"].includes(lower)) return "won";
     if (["lost", "that_bai", "thất bại", "unqualified"].includes(lower)) return "lost";

     return trimmed; // fallback nguyên bản nếu là custom status
   }
   ```
   *(Cảnh báo: Nếu không normalize, khi DB trả về `"Đang tư vấn"`, logic so sánh trực tiếp `status === "contacted"` sẽ bị false và thẻ không lên đúng cột Kanban).*

2. **Khi Ghi dữ liệu (PATCH / POST / Kanban Drag):**
   * **LUÔN LUÔN** gửi key chuẩn tiếng Anh: `"new"`, `"contacted"`, `"qualified"`, `"won"`, `"lost"`.
   * **CẤM** gửi lại chuỗi tiếng Việt vào DB để hệ sinh thái dần đồng nhất dữ liệu.
   * Nếu người dùng kéo thẻ vào cột *"Chưa có trạng thái"*: Gửi `"lead_status": null` (hoặc `""`).

---

### 5.3. Chuyên sâu về `assigned_agent` (Nhân viên Phụ trách)

#### A. Bản chất Lưu trữ: Chỉ lưu ID, KHÔNG lưu Object User
* Giá trị của `assigned_agent` trong database chỉ là một con số nguyên ID hoặc chuỗi ID (ví dụ: `82` hoặc `"82"`).
* API Contact **KHÔNG** tự JOIN thông tin chi tiết của Agent (không có `agent.name`, `agent.email`, `agent.avatar_url` đi kèm trong object Contact).

#### B. Quy tắc Xử lý cho App: Cache Master Agents & Lookup
1. **Khởi tạo Cache Agents trước khi nạp Contact:**
   * Khi mở CRM, gọi `GET /api/v1/accounts/{accountId}/agents` và lưu vào RAM / State Management (Redux/Zustand/Pinia/Bloc) dưới dạng Map:
   ```typescript
   const agentsMap = new Map<number, Agent>();
   agentsList.forEach(agent => agentsMap.set(Number(agent.id), agent));
   ```
2. **Resolve Tên & Avatar khi render UI:**
   ```typescript
   function getAgentInfo(contact: Contact) {
     const agentId = contact.custom_attributes?.assigned_agent 
                  || contact.additional_attributes?.assigned_agent;
     if (!agentId) return { id: null, name: "Chưa phân công", avatarUrl: null };
     
     const agent = agentsMap.get(Number(agentId));
     return {
       id: Number(agentId),
       name: agent ? agent.name : `Nhân viên #${agentId}`,
       avatarUrl: agent?.avatar_url || null
     };
   }
   ```
3. **Thao tác Gán & Bỏ Gán Nhân viên (Assign / Unassign):**
   * **Gán cho một nhân viên:**
     ```json
     PATCH /api/v1/accounts/{accountId}/contacts/{contactId}
     {
       "custom_attributes": {
         "assigned_agent": 82
       }
     }
     ```
   * **Gỡ phân công (Unassign - chuyển về Chưa phân công):**
     ```json
     PATCH /api/v1/accounts/{accountId}/contacts/{contactId}
     {
       "custom_attributes": {
         "assigned_agent": null
       }
     }
     ```

#### C. Xử lý 2 Tab Hệ thống Cốt lõi: "Của tôi" & "Chưa phân công"
Khi người dùng bấm vào các Tab lọc mặc định trên giao diện, App cần gửi request `POST /api/v1/accounts/{accountId}/contacts/filter` với cấu trúc query chuẩn như sau:

* **Tab "Của tôi" (Contacts của chính User đang đăng nhập):**
  Lấy `currentUserId` từ session người dùng đăng nhập hiện tại:
  ```json
  {
    "payload": [
      {
        "attribute_key": "assigned_agent",
        "filter_operator": "equal_to",
        "values": [82],
        "query_operator": "and",
        "attribute_model": "custom_attributes"
      }
    ]
  }
  ```
* **Tab "Chưa phân công" (Contacts chưa có ai phụ trách):**
  Dùng toán tử `is_not_present` để lọc các contact chưa gán `assigned_agent`:
  ```json
  {
    "payload": [
      {
        "attribute_key": "assigned_agent",
        "filter_operator": "is_not_present",
        "values": [],
        "query_operator": "and",
        "attribute_model": "custom_attributes"
      }
    ]
  }
  ```

---

## 6. Logic Nghiệp vụ & Khuyến nghị Triển khai cho Mobile App

### 6.1. Xử lý Phân trang & Cuộn vô tận (Infinite Scroll)
* Khi khởi tạo: gọi `page = 1`.
* Khi người dùng cuộn đến 80% chiều cao danh sách: kiểm tra `hasMore = contacts.length < meta.count`.
* Nếu `hasMore === true`: tăng `page += 1`, kích hoạt spinner ở chân danh sách và gọi tiếp API nạp thêm dữ liệu (nối mảng `contacts = [...contacts, ...newItems]`).
* Khi người dùng kéo vuốt làm mới (Pull-to-refresh): gọi lại `page = 1` và thay thế toàn bộ danh sách cũ.

### 6.2. Hai chế độ hiển thị: List View & Kanban View
* **Chế độ Danh sách (List / Table View):** Tối ưu cho màn hình cảm ứng, hiển thị thẻ tóm tắt (Card) gồm Avatar + Tên + SĐT + Tag Trạng thái + Tên Doanh nghiệp.
* **Chế độ Phễu (Kanban Board):** Hiển thị 5 cột trạng thái Lead. Cho phép kéo thẻ thả sang cột khác $\rightarrow$ Lập tức cập nhật UI (Optimistic UI) và bắn API `PATCH` cập nhật `lead_status`. Nếu API thất bại thì hoàn tác lại vị trí thẻ cũ và hiển thị thông báo lỗi (Toast).

### 6.3. Thao tác Quẹt Nhanh (Swipe Gestures)
Trên từng item liên hệ ở chế độ danh sách, hỗ trợ thao tác quẹt:
* **Quẹt sang phải:** Gọi điện thoại (`tel:`) hoặc Nhắn tin Zalo/SMS.
* **Quẹt sang trái:** Mở menu thao tác: Gán nhân viên, Đổi trạng thái, hoặc Xóa liên hệ.
