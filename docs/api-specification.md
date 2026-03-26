# 📖 API Specification & Data Format
**Dự án:** Attack Visualization System

**Version:** 1.0.0

**Base URL:** `http://localhost:3000/api/v1`

---

## 1. 🟢 Real-time WebSocket (Socket.io)
Luồng dữ liệu chính để đẩy log tấn công lên Bản đồ (Dashboard) theo thời gian thực (High Event Rate).

* **Namespace/Path:** `/` (Mặc định)
* **Event Name:** `new_attack`
* **Payload Format (JSON):**

```JSON
{
  "id": "uuid-v4-string",
  "source_ip": "113.190.23.1",
  "dest_ip": "10.0.0.5",
  "attack_type": "SQL Injection",
  "severity": "High",
  "location": {
    "lat": 21.028511,
    "lng": 105.804817
  },
  "timestamp": "2026-03-21T14:15:22Z"
}
```
* **Validation**: Dữ liệu đẩy lên Dashboard phải có đầy đủ tọa độ (lat, lng) đã qua xử lý Geo-IP.

---

## 2. 🔵 REST API Endpoints

### 2.1. Nhận Log Tấn Công (Từ Mock Generator / Agent)
* **Endpoint:** `POST /attacks`
* **Mô tả:** Nhận dữ liệu tấn công, lưu vào Database và trigger event `new_attack` qua Socket.io.
* **Request Body:** Tương tự như Payload của Socket ở trên (không cần trường `id`, DB sẽ tự sinh).
* **Response (201 Created):**
```JSON
{
  "success": true,
  "message": "Attack log ingested successfully"
}
```
* **Validation Rules**: 
  * `source_ip`: Phải là IPv4 hợp lệ.
  * `timestamp`: Phải đúng chuẩn ISO 8601.
  * `location`: Không được rỗng (Null).
* **Response (400 Bad Request):** Trả về nếu dữ liệu sai định dạng (Data type mismatch).
```JSON
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST", // Có thể sử dụng HTTP Status Code thay cho chữ để dễ nhận biết
    "message": "Data type mismatch"
  }
}
```

### 2.2. Lấy Lịch Sử Tấn Công (Cho tính năng xem lại trên Dashboard)
* **Endpoint:** `GET /attacks/history?limit=&severity=`
* **Query Parameters:**
  * `page` (`number`): Offset của trang (Mặc định: 0)
  * `limit` (`number`): Số lượng record trả về mỗi trang (Mặc định: 10)
  * `type` (`string?`): Loại tấn công (Mặc định: null)
  * `severity` (`string?`): Lọc theo mức độ (`Critical`, `High`, `Medium`, `Low`) (Mặc định: null)
* **Response (200 OK):** `GET /attacks/history?page=0&limit=50&severity=Critical`
```JSON
{
  "success": true,
  "data": [
    {
      "id": "...",
      "source_ip": "...",
      "attack_type": "DDoS",
      "timestamp": "...",
      "severity": "Critical"
    },
    {
      "id": "...",
      "source_ip": "...",
      "attack_type": "Broken Access Control",
      "timestamp": "...",
      "severity": "Critical"
    },
    ...
  ], // Chỉ trả về 50 bản ghi đầu tiên vì offset trang là 0
  "pagination": {
    "total": 1500,
    "page": 0,
    "limit": 50
  }
}
```

### 2.3. Lấy Thống Kê (Dùng cho mọi loại biểu đồ)
* **Endpoint:** `GET /stats?type=&range=`
* **Query Parameters:**
  * `type` (string): Loại thống kê cần lấy. Các giá trị hợp lệ:
    * `summary`: Lấy số tổng quan (Total, Top 1).
    * `timeline`: Lấy dữ liệu theo giờ để vẽ Chart.js.
    * `geomap`: Trả về danh sách các quốc gia/tọa độ kèm số lượng tấn công (count) để vẽ Heatmap hoặc tô màu bản đồ.
  * `range` (number): Thời gian quét (tính theo giây) (VD: `3600`, `86400`, `608000`...).
* **Ví dụ Request:** `GET /stats?type=summary&range=86400`
* **Response (200 OK):**
```JSON
{
  "success": true,
  "data": {
    "total_attacks_today": 5204,
    "top_attack_type": "Brute-force", // Loại tấn công nhiều nhất trong khoảng `range`
    "top_source_ip": "192.168.1.100" // Địa chỉ tạo ra nhiều tấn công nhất
  }
}
```

---

## 3. 🔴 Chuẩn Error Response
Mọi lỗi từ Server đều trả về cấu trúc thống nhất này để Frontend dễ bắt lỗi. Mọi phản hồi lỗi phải đi kèm mã lỗi định danh:
* **Response (400 / 500):**
```JSON
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Trường source_ip không đúng định dạng."
  }
}
```

---
## 4. 🟣 Data Type Formatting

Quy ước kiểu dữ liệu sử dụng trong toàn bộ API nhằm đảm bảo tính nhất quán giữa Backend và Frontend, đồng thời tối ưu hiệu năng hiển thị.

<table style="width: 100%;">
  <thead>
    <tr style="background-color: #2165fe;">
      <th style="border: 1px solid #dddddd; padding: 8px;">Field</th>
      <th style="border: 1px solid #dddddd; padding: 8px;">Type</th>
      <th style="border: 1px solid #dddddd; padding: 8px;">Format</th>
      <th style="border: 1px solid #dddddd; padding: 8px;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">id</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">UUID v4</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Mã định danh duy nhất</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">source_ip</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">IPv4 / IPv6</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">IP nguồn</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">dest_ip</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">IPv4 / IPv6</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">IP đích</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">attack_type</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Enum</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Loại tấn công</td>
    </tr>
    <tr">
      <td style="border: 1px solid #dddddd; padding: 8px;">severity</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td colspan="2" style="border: 1px solid #dddddd; padding: 8px; text-align: center;">Enum ["Low", "Medium", "High", "Critical"]</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">lat</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Number</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Float (6 decimal places)</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Vĩ độ</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">lng</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Number</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Float (6 decimal places)</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Kinh độ</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">timestamp</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">string</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">ISO 8601 (UTC)</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Thời gian</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">success</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">boolean</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">true / false</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Trạng thái API</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">limit</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Number</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Int</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Số lượng record</td>
    </tr>
    <tr>
      <td style="border: 1px solid #dddddd; padding: 8px;">total</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Number</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Int</td>
      <td style="border: 1px solid #dddddd; padding: 8px;">Tổng số record</td>
    </tr>
  </tbody>
</table>

> ⚡ **Performance Note:**  
> Các trường tọa độ (`lat`, `lng`) phải luôn là **number** để Frontend (Leaflet/Mapbox) render trực tiếp, tránh phải parse từ string → giúp xử lý tốt khi hệ thống có High Event Rate.