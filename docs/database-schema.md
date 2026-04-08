# THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ CHIẾN LƯỢC ĐÁNH CHỈ MỤC  
## Hệ thống Trực quan hóa Tấn công – NT208

---

# 1. Giới thiệu

Tài liệu này trình bày thiết kế cơ sở dữ liệu và chiến lược đánh chỉ mục cho **Hệ thống Trực quan hóa Tấn công**.

Mục tiêu thiết kế:

- Hỗ trợ tốc độ ghi nhận sự kiện cao
- Hiển thị vị trí nguồn tấn công trên bản đồ thế giới theo thời gian thực
- Xây dựng dòng thời gian (timeline) các sự kiện tấn công
- Đảm bảo hiệu năng truy vấn khi dữ liệu tăng trưởng lớn
- Dễ dàng mở rộng trong tương lai

Hệ quản trị cơ sở dữ liệu được đề xuất là **PostgreSQL**, do hỗ trợ tốt cho các kiểu dữ liệu như `UUID`, `INET`, `TIMESTAMPTZ` và phù hợp với các hệ thống xử lý sự kiện thời gian thực.

---

# 2. Thiết kế cấu trúc cơ sở dữ liệu

## 2.1 Danh sách các thực thể

Hệ thống bao gồm các bảng chính sau:

- bảng vai trò (`roles`)
- bảng người dùng (`users`)
- bảng tài sản mục tiêu (`assets`)
- bảng loại tấn công (`attack_types`)
- bảng sự kiện tấn công (`attack_events`)
- bảng nhật ký sự kiện (`attack_logs`)

---

## 2.2 Thiết kế chi tiết các bảng

### 2.2.1 Bảng vai trò (`roles`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| id | INT | Khóa chính |
| name | VARCHAR(50) | Tên vai trò |

---

### 2.2.2 Bảng người dùng (`users`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| id | UUID | Khóa chính |
| name | VARCHAR(50) | Tên người dùng |
| email | VARCHAR(100) | Email đăng nhập |
| password_hash | VARCHAR(255) | Mật khẩu đã băm |
| role_id | INT | Khóa ngoại tham chiếu bảng `roles` |
| status | VARCHAR(20) | Trạng thái tài khoản |
| created_at | TIMESTAMPTZ | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | Thời điểm cập nhật |

---

### 2.2.3 Bảng tài sản mục tiêu (`assets`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| id | INT | Khóa chính |
| name | VARCHAR(100) | Tên tài sản / mục tiêu |
| ip | INET | Địa chỉ IP của tài sản |
| lat | DECIMAL(9,6) | Vĩ độ của tài sản |
| lng | DECIMAL(9,6) | Kinh độ của tài sản |
| description | TEXT | Mô tả |
| created_at | TIMESTAMPTZ | Thời điểm tạo |

---

### 2.2.4 Bảng loại tấn công (`attack_types`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| id | INT | Khóa chính |
| name | VARCHAR(100) | Tên loại tấn công |
| description | TEXT | Mô tả chi tiết |

---

### 2.2.5 Bảng sự kiện tấn công (`attack_events`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| id | UUID | Khóa chính |
| source_ip | INET | Địa chỉ IP nguồn tấn công |
| dest_ip | INET | Địa chỉ IP đích |
| dest_asset_id | INT | Khóa ngoại tham chiếu bảng `assets` |
| attack_type_id | INT | Khóa ngoại tham chiếu bảng `attack_types` |
| severity | attack_severity | Mức độ nghiêm trọng |
| lat | DECIMAL(9,6) | Vĩ độ nguồn tấn công |
| lng | DECIMAL(9,6) | Kinh độ nguồn tấn công |
| timestamp | TIMESTAMPTZ | Thời điểm xảy ra sự kiện |

---

### 2.2.6 Bảng nhật ký sự kiện (`attack_logs`)

| Cột | Kiểu dữ liệu | Ghi chú |
|------|-------------|--------|
| event_id | UUID | Khóa chính, đồng thời là khóa ngoại tham chiếu bảng `attack_events` |
| payload | TEXT | Dữ liệu chi tiết của sự kiện |
| protocol | VARCHAR(20) | Giao thức sử dụng |

---

## 2.3 Quan hệ giữa các bảng

- Bảng `users` liên kết với bảng `roles` thông qua khóa ngoại `role_id`.
- Bảng `attack_events` liên kết với bảng `assets` thông qua khóa ngoại `dest_asset_id`.
- Bảng `attack_events` liên kết với bảng `attack_types` thông qua khóa ngoại `attack_type_id`.
- Bảng `attack_logs` liên kết với bảng `attack_events` thông qua khóa ngoại `event_id`.

Biểu diễn quan hệ chính:

- `roles (1) - (N) users`
- `assets (1) - (N) attack_events`
- `attack_types (1) - (N) attack_events`
- `attack_events (1) - (1) attack_logs`

Lưu ý: theo ERD hiện tại, mỗi sự kiện tấn công có một bản ghi log chi tiết tương ứng trong bảng `attack_logs`.

---

## 2.4 Sơ đồ ERD

<p align="center">
  <img src="./diagram/ERD_.png" alt="Sơ đồ ERD của hệ thống" width="800">
</p>

---

## 2.5 Mức chuẩn hóa

Thiết kế cơ sở dữ liệu hiện tại đạt **Second Normal Form (2NF)**.

Lý do:

- Các bảng đều đảm bảo **First Normal Form (1NF)** vì dữ liệu được lưu ở dạng nguyên tử, không có nhóm thuộc tính lặp.
- Hầu hết các bảng sử dụng **khóa chính đơn** như `roles.id`, `users.id`, `assets.id`, `attack_types.id`, `attack_events.id`, nên các thuộc tính không khóa phụ thuộc đầy đủ vào khóa chính.

Tuy nhiên, schema hiện tại **chưa đạt Third Normal Form (3NF) hoàn toàn**. Trong bảng `attack_events`, một số thuộc tính có thể được xem là dư thừa hoặc có khả năng suy ra từ thực thể liên kết, ví dụ:

- `dest_ip` có thể liên quan gián tiếp đến `dest_asset_id` thông qua bảng `assets`
- `lat`, `lng` có thể được suy ra từ `source_ip` sau quá trình geolocation

Do đó, mức chuẩn hóa phù hợp để mô tả cho thiết kế hiện tại là **2NF**.

---

# 3. Chiến lược đánh chỉ mục

## 3.1 Mục tiêu đánh chỉ mục

Chiến lược đánh chỉ mục được xây dựng nhằm:

- Tăng tốc truy vấn dòng thời gian sự kiện
- Tăng tốc lọc theo IP nguồn, IP đích, loại tấn công và mức độ nghiêm trọng
- Tăng tốc truy vấn dashboard theo khoảng thời gian
- Hỗ trợ thống kê và truy xuất dữ liệu khi số lượng attack events tăng lớn

---

## 3.2 Chỉ mục trên khóa chính và khóa ngoại

Các chỉ mục mặc định hoặc nên có trên khóa chính và khóa ngoại bao gồm:

- `roles.id`
- `users.id`
- `users.role_id`
- `assets.id`
- `attack_types.id`
- `attack_events.id`
- `attack_events.dest_asset_id`
- `attack_events.attack_type_id`
- `attack_logs.event_id`

---

## 3.3 Chỉ mục đơn cột

Áp dụng cho các cột thường xuyên được dùng trong điều kiện truy vấn:

- `users.email`
- `assets.ip`
- `attack_events.timestamp`
- `attack_events.source_ip`
- `attack_events.dest_ip`
- `attack_events.attack_type_id`
- `attack_events.dest_asset_id`
- `attack_events.severity`

Ví dụ:

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);

CREATE INDEX idx_assets_ip ON assets(ip);

CREATE INDEX idx_attack_events_timestamp ON attack_events("timestamp");
CREATE INDEX idx_attack_events_source_ip ON attack_events(source_ip);
CREATE INDEX idx_attack_events_dest_ip ON attack_events(dest_ip);
CREATE INDEX idx_attack_events_attack_type_id ON attack_events(attack_type_id);
CREATE INDEX idx_attack_events_dest_asset_id ON attack_events(dest_asset_id);
CREATE INDEX idx_attack_events_severity ON attack_events(severity);
```

---

## 3.4 Chỉ mục kết hợp nhiều cột

Áp dụng cho các truy vấn có nhiều điều kiện đồng thời, đặc biệt là dashboard lọc theo thời gian và phân loại sự kiện.

Các chỉ mục kết hợp phù hợp:

- `("timestamp", attack_type_id)`
- `("timestamp", severity)`
- `("timestamp", source_ip)`

Ví dụ:

```sql
CREATE INDEX idx_attack_events_time_type
ON attack_events("timestamp", attack_type_id);

CREATE INDEX idx_attack_events_time_severity
ON attack_events("timestamp", severity);

CREATE INDEX idx_attack_events_time_source
ON attack_events("timestamp", source_ip);
```

---

## 3.5 Chỉ mục nâng cao trong PostgreSQL

Khi dữ liệu tăng lớn, PostgreSQL cho phép sử dụng các loại chỉ mục nâng cao để tối ưu hiệu năng.

### a. BRIN Index cho dữ liệu chuỗi thời gian

Với bảng `attack_events` có dữ liệu tăng theo thời gian, chỉ mục **BRIN** phù hợp cho cột `timestamp` khi số lượng bản ghi rất lớn.

```sql
CREATE INDEX idx_attack_events_timestamp_brin
ON attack_events
USING BRIN("timestamp");
```

### b. Partial Index cho mức độ nghiêm trọng cao

Nếu dashboard hoặc hệ thống cảnh báo thường xuyên truy vấn các sự kiện mức độ cao, có thể tạo chỉ mục một phần.

Ví dụ:

```sql
CREATE INDEX idx_attack_events_high_severity
ON attack_events("timestamp")
WHERE severity IN ('high', 'critical');
```

Lưu ý: giá trị `'high'`, `'critical'` cần khớp với enum `attack_severity` được định nghĩa trong cơ sở dữ liệu.

---

# 4. Tối ưu hiệu năng và mở rộng

## 4.1 Tối ưu truy vấn

- Tối ưu các truy vấn dashboard dựa trên `timestamp`, `attack_type_id`, `severity`
- Hạn chế truy vấn toàn bảng trên `attack_events`
- Kết hợp phân trang hoặc giới hạn dữ liệu khi hiển thị timeline dài
- Ưu tiên truy vấn các khoảng thời gian gần nhất khi hiển thị realtime

---

## 4.2 Phân vùng dữ liệu

Khi bảng `attack_events` tăng nhanh theo thời gian, có thể áp dụng **partitioning theo tháng** hoặc theo quý để:

- giảm kích thước mỗi phân vùng
- tăng tốc truy vấn theo mốc thời gian
- thuận tiện cho việc lưu trữ lịch sử dài hạn

---

## 4.3 Kết hợp Redis cho realtime

Bên cạnh PostgreSQL, hệ thống có thể kết hợp **Redis Cache** để:

- lưu tạm thông tin geolocation của IP
- giảm số lần gọi Geolocation API
- hỗ trợ backend xử lý nhanh hơn khi nhiều sự kiện đến liên tục

---

## 4.4 Hỗ trợ mở rộng

Thiết kế hiện tại cho phép mở rộng theo các hướng:

- mở rộng số lượng backend service
- tối ưu chiến lược ghi dữ liệu theo lô nếu event rate tăng cao
- mở rộng cơ chế message broker nếu cần xử lý lưu lượng lớn hơn
- tách riêng dữ liệu realtime và dữ liệu phân tích lịch sử nếu hệ thống phát triển ở quy mô lớn

---

# 5. Kết luận

Thiết kế cơ sở dữ liệu và chiến lược đánh chỉ mục của hệ thống đã được xây dựng bám sát yêu cầu trực quan hóa tấn công theo thời gian thực.

Thiết kế này:

- đảm bảo tính toàn vẹn dữ liệu
- hỗ trợ truy vấn timeline và bản đồ hiệu quả
- phù hợp với dữ liệu sự kiện tăng liên tục theo thời gian
- tạo nền tảng thuận lợi cho việc mở rộng hệ thống trong tương lai

Mặc dù schema hiện tại mới đạt mức **2NF**, thiết kế vẫn phù hợp cho mục tiêu triển khai dashboard realtime và xử lý attack events ở mức đồ án.