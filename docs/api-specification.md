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

### 2.2. Lấy Lịch Sử Tấn Công (Cho tính năng xem lại trên Dashboard)
* **Endpoint:** `GET /attacks/history`
* **Query Parameters:**
  * `limit` (int): Số lượng record trả về (Mặc định: 50)
  * `severity` (string): Lọc theo mức độ (`High`, `Medium`, `Low`)
* **Response (200 OK):**
```JSON
{
  "success": true,
  "data": [
    {
      "id": "...",
      "source_ip": "...",
      "attack_type": "DDoS",
      "timestamp": "..."
    }
  ],
  "pagination": {
    "total": 1500,
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
  * `range` (string): Thời gian quét (VD: `1h`, `24h`, `7d`).
* **Ví dụ Request:** `GET /stats?type=summary&range=24h`
* **Response (200 OK):**
```JSON
{
  "success": true,
  "data": {
    "total_attacks_today": 5204,
    "top_attack_type": "Brute-force",
    "top_source_ip": "192.168.1.100"
  }
}
```

---

## 3. 🔴 Chuẩn Error Response
Mọi lỗi từ Server đều trả về cấu trúc thống nhất này để Frontend dễ bắt lỗi.
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