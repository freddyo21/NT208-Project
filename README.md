# NT208 - Attack Visualization System

Hệ thống trực quan hóa tấn công mạng theo thời gian thực, gồm giao diện dashboard hiển thị bản đồ mối đe dọa toàn cầu, cơ chế đăng nhập bằng JWT, phân quyền người dùng và API backend để tiếp nhận/xử lý sự kiện tấn công.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Chạy dự án](#chạy-dự-án)
- [Scripts thường dùng](#scripts-thường-dùng)
- [API chính](#api-chính)
- [Ghi chú phát triển](#ghi-chú-phát-triển)

## Tổng quan

Dự án được tổ chức theo mô hình monorepo với 3 workspace:

- `backend`: API server dùng Express, PostgreSQL, JWT và Socket.IO.
- `frontend`: ứng dụng React/Vite hiển thị dashboard, bản đồ Leaflet và giao diện đăng nhập.
- `shared`: package TypeScript dùng chung cho schema, kiểu dữ liệu, enum và utility.

Luồng hoạt động cơ bản:

1. Người dùng đăng nhập qua frontend.
2. Backend xác thực tài khoản, tạo access token và refresh token.
3. Frontend gọi API bằng access token trong header `Authorization`.
4. Dashboard hiển thị bản đồ, thống kê và log sự kiện tấn công.
5. Backend có sẵn Socket.IO để phục vụ luồng dữ liệu realtime.

## Tính năng chính

- Đăng nhập, đăng xuất và refresh token.
- Lưu refresh token bằng HTTP-only cookie.
- Phân quyền route admin bằng role `admin`.
- Middleware xác thực JWT cho các API cần bảo vệ.
- Dashboard mô phỏng bản đồ tấn công mạng theo thời gian thực bằng Leaflet.
- Bộ lọc dashboard theo IP, khoảng thời gian và loại tấn công.
- Shared schema bằng Zod để đồng bộ kiểu dữ liệu giữa frontend và backend.
- Rate limiting, CORS, Helmet, compression và centralized error handler.

## Công nghệ sử dụng

### Backend

- Node.js, TypeScript
- Express 5
- PostgreSQL (`pg`)
- Socket.IO
- JWT ES256
- bcrypt
- Zod
- Helmet, CORS, cookie-parser, express-rate-limit

### Frontend

- React 19
- Vite
- TypeScript
- React Router
- Axios
- Tailwind CSS, DaisyUI
- Leaflet
- Font Awesome
- Zustand

### Shared

- TypeScript
- Zod
- Enum, interface và inferred type dùng chung

## Cấu trúc thư mục

```text
NT208-Project/
├── backend/              # Express API, middleware, controller, service, repository
│   └── src/
│       ├── auth/
│       ├── configurations/
│       ├── controllers/
│       ├── middlewares/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── websocket/
├── frontend/             # React/Vite application
│   └── src/
│       ├── contexts/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── providers/
│       ├── routes/
│       ├── services/
│       └── utilities/
├── shared/               # Schema, type, enum và utility dùng chung
├── package.json          # npm workspaces và script tổng
└── README.md
```

## Yêu cầu hệ thống

- Node.js `>= 22.12.0`
- npm
- PostgreSQL

## Cài đặt

Cài dependency cho toàn bộ workspace:

```bash
npm install
```

Build package dùng chung:

```bash
npm run build:shared
```

## Cấu hình môi trường

### Backend

Tạo file `backend/.env`:

```env
NODE_ENV=development
PORT=3000

FRONTEND_CORS_ALLOWED_ORIGINS=http://localhost:5173

# Có thể dùng DATABASE_URL hoặc nhóm biến DB_* bên dưới
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=attack_visualization

JWT_ISSUER=attack-visualization-system
```

Backend sẽ tự tạo cặp khóa ES256 tại `backend/certs/private.pem` và `backend/certs/public.pem` trong lần chạy đầu tiên nếu chưa tồn tại.

### Frontend

Tạo file `frontend/.env`:

```env
VITE_SERVER_API_URL=http://localhost:3000/api/v1
```

## Chạy dự án

Chạy môi trường phát triển cho cả backend, frontend và shared:

```bash
npm run dev
```

Mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API base URL: `http://localhost:3000/api/v1`

Chạy riêng từng phần:

```bash
npm run dev:shared
npm run dev:backend
npm run dev:frontend
```

Build toàn bộ dự án:

```bash
npm run build
```

Chạy sau khi build:

```bash
npm start
```

## Scripts thường dùng

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy backend, frontend và shared watch mode |
| `npm run build` | Build shared, backend và frontend |
| `npm run lint` | Chạy ESLint cho các workspace |
| `npm run test` | Chạy test backend |
| `npm run dev:backend` | Chạy riêng backend bằng nodemon/tsx |
| `npm run dev:frontend` | Chạy riêng frontend bằng Vite |
| `npm run build:shared` | Build package shared |

## API chính

Base path: `/api/v1`

| Method | Endpoint | Bảo vệ | Mô tả |
| --- | --- | --- | --- |
| `GET` | `/ping` | Không | Kiểm tra backend còn hoạt động |
| `POST` | `/auth/login` | Không | Đăng nhập |
| `POST` | `/auth/refresh` | Cookie refresh token | Cấp access token mới |
| `POST` | `/auth/logout` | Cookie refresh token | Đăng xuất |
| `POST` | `/attacks` | Access token | Xử lý sự kiện tấn công thử nghiệm |
| `GET` | `/attacks/history` | Access token | Endpoint lịch sử tấn công hiện ở mức stub |
| `GET` | `/attacks/stats` | Access token | Endpoint thống kê tấn công hiện ở mức stub |
| `POST` | `/admin/user/create` | Admin token | Tạo người dùng mới |

Ví dụ đăng nhập:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password","rememberMe":true}'
```

Ví dụ gọi API cần xác thực:

```bash
curl -X POST http://localhost:3000/api/v1/attacks \
  -H "Authorization: Bearer <access_token>"
```

## Cơ sở dữ liệu

Backend hiện truy vấn các bảng chính:

- `users`
- `roles`

Các cột đang được sử dụng trong code:

- `users.id`
- `users.name`
- `users.email`
- `users.password_hash`
- `users.role_id`
- `users.status`
- `users.created_at`
- `users.updated_at`
- `users.last_login`
- `roles.id`
- `roles.name`

Lưu ý: repository hiện chưa có migration/schema SQL đi kèm trong mã nguồn, vì vậy cần chuẩn bị database PostgreSQL tương thích trước khi chạy chức năng đăng nhập/tạo người dùng.

## Ghi chú phát triển

- Package `shared` cần được build trước để backend/frontend import được `@attack-visualization-system/shared`.
- Access token được gửi qua header `Authorization: Bearer <token>`.
- Refresh token được lưu trong cookie `refreshToken`.
- CORS chỉ cho phép các origin được khai báo trong `FRONTEND_CORS_ALLOWED_ORIGINS`.
- Dashboard frontend hiện đang dùng dữ liệu mô phỏng cho bản đồ và event log.
- Refresh token hiện được lưu bằng `Map` trong bộ nhớ backend; khi restart server, refresh token cũ sẽ mất hiệu lực.

