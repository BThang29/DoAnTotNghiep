# HotelManagement

Hệ thống quản lý và đặt phòng khách sạn xây dựng bằng `.NET 8`, tách thành các project riêng cho `API`, `Service`, `Data`, `WebAppAdmin` và `WebAppClient`.

## Tổng quan hệ thống

Hệ thống gồm 2 phía chính:

- `WebAppClient`: cổng dành cho khách vãng lai và khách hàng đã đăng nhập.
- `WebAppAdmin`: cổng dành cho quản trị viên, lễ tân và nhân viên nội bộ.

Toàn bộ nghiệp vụ đều đi qua `API`. `API` nhận request từ 2 web app, gọi xuống tầng `Service` để xử lý nghiệp vụ, sau đó truy cập dữ liệu qua `Data` và `SQL Server`.

Các nhóm chức năng chính:

- Khách vãng lai có thể xem trang chủ, giới thiệu, tin tức, liên hệ, dịch vụ, danh sách phòng, chi tiết phòng và tìm phòng trống.
- Khách hàng có thể đăng ký, đăng nhập, quên mật khẩu, tạo đặt phòng trực tuyến, thanh toán booking, xem lịch sử đặt phòng, đổi mật khẩu và chat realtime với lễ tân.
- Nhân viên và quản trị viên có thể quản lý dashboard, booking, tiền cọc, hóa đơn, thanh toán, phòng, loại phòng, trạng thái phòng, dịch vụ, khách hàng, nhân viên, vai trò, đánh giá khách hàng và chat realtime với khách.

Luồng tổng quát:

```text
WebAppClient / WebAppAdmin
            |
            v
           API
            |
            v
         Service
            |
            v
   Utils.Service / Utils.Repository
            |
            v
           Data
            |
            v
        SQL Server
```

## Kiến trúc solution

Solution:

- `HotelManagement.sln`

Các project chính:

- `HotelManagement.WebAPI`
  - Chứa controller cho admin, client, auth, SignalR hub, Swagger, cấu hình JWT, CORS.
- `HotelManagement.Service`
  - Chứa service nghiệp vụ, DTO, mapping, logic xử lý use case.
- `HotelManagement.Domain`
  - Chứa entity, `DbContext`, migration, seed, `DbInitializer`.
- `HotelManagement.Utils.Repository`
  - Chứa repository và transaction helper.
- `HotelManagement.Utils.Service`
  - Chứa base service, paging, filter, helper dùng chung cho tầng service.
- `HotelManagement.Utils`
  - Chứa hằng số, helper và thành phần dùng chung.
- `HotelManagement.WebAdmin`
  - Giao diện quản trị nội bộ.
- `HotelManagement.WebClient`
  - Giao diện khách hàng.
- `HotelManagement.Model`
  - Chứa model hỗ trợ cho solution.

## Phân hệ chính

### WebAppClient

Các màn hình chính:

- Đăng nhập, đăng ký, quên mật khẩu
- Trang chủ, giới thiệu, tin tức, liên hệ, dịch vụ
- Danh sách phòng, chi tiết phòng, tìm phòng trống
- Tạo đặt phòng trực tuyến
- Checkout thanh toán
- Lịch sử đặt phòng
- Đổi mật khẩu
- Chat realtime với lễ tân

### WebAppAdmin

Các màn hình chính:

- Đăng nhập, đăng ký tài khoản nội bộ
- Dashboard
- Quản lý đặt phòng, kiểm tra phòng trống, cập nhật tiền cọc
- Quản lý hóa đơn
- Quản lý thanh toán, QR thanh toán
- Quản lý phòng, loại phòng, trạng thái phòng
- Quản lý dịch vụ, loại dịch vụ
- Quản lý khách hàng, loại khách hàng
- Quản lý nhân viên, kích hoạt tài khoản nhân viên
- Quản lý vai trò
- Xem đánh giá khách hàng
- Chat realtime với khách
- Đổi mật khẩu quản trị

## Công nghệ sử dụng

- `.NET 8`
- `ASP.NET Core Web API`
- `ASP.NET Core MVC`
- `Entity Framework Core`
- `SQL Server`
- `ASP.NET Core Identity`
- `JWT Authentication`
- `SignalR`
- `Swagger`

## Một số luồng nghiệp vụ đáng chú ý

### 1. Đặt phòng trực tuyến

```text
Khách hàng / Guest
-> WebAppClient
-> API Booking
-> SQL Server
-> tạo booking
-> chuyển sang bước thanh toán
```

### 2. Thanh toán booking

```text
WebAppClient
-> API Payment
-> đọc booking / phương thức thanh toán
-> tạo giao dịch
-> cập nhật trạng thái thanh toán
```

### 3. Chat realtime

```text
WebAppClient / WebAppAdmin
-> SignalR MessageHub
-> lưu message vào database
-> đẩy tin nhắn realtime sang phía còn lại
```

### 4. Quản lý nội bộ

```text
WebAppAdmin
-> API Admin Controllers
-> Service
-> Data / SQL Server
-> trả dữ liệu cho dashboard, booking, invoice, room, customer, employee...
```

## API chính

### Admin API

Thư mục:

- `HotelManagement.WebAPI/Controllers/Admin`

Controller tiêu biểu:

- `DashboardController`
- `BookingRoomController`
- `InvoiceController`
- `PaymentController`
- `RoomController`
- `CustomerController`
- `EmployeeController`
- `RoleController`
- `ReviewController`
- `MessageController`
- `UserSystemController`

### Client API

Thư mục:

- `HotelManagement.WebAPI/Controllers/Client`

Controller tiêu biểu:

- `RoomController`
- `BookingController`
- `BookingHistoryController`
- `PaymentController`
- `ReviewController`

## Dữ liệu và migration

Thư mục chính:

- `HotelManagement.Domain/Entities`
- `HotelManagement.Domain/Migrations`

Khởi tạo dữ liệu:

- `HotelManagement.Domain/DbInitializer.cs`

Seed được gọi từ:

- `HotelManagement.WebAPI/Startup.cs`

Repo hiện dùng cả:

- seed bằng C# trong `DbInitializer`
- seed SQL cho một số dữ liệu test riêng

## Chạy dự án

### Yêu cầu

- `Visual Studio 2022` hoặc `dotnet SDK 8`
- `SQL Server`

### Chạy API

```powershell
dotnet restore
dotnet run --project .\HotelManagement.WebAPI\HotelManagement.WebAPI.csproj --launch-profile http
```

API mặc định:

- `http://localhost:5010`

Swagger:

- `http://localhost:5010/swagger`

### Chạy WebAppAdmin

```powershell
dotnet run --project .\HotelManagement.WebAdmin\HotelManagement.WebAdmin.csproj --launch-profile http
```

### Chạy WebAppClient

```powershell
dotnet run --project .\HotelManagement.WebClient\HotelManagement.WebClient.csproj --launch-profile http
```

Các cổng dev thường dùng:

- API: `http://localhost:5010`
- WebAppAdmin: `http://localhost:5193`
- WebAppClient: `http://localhost:5185`

## Migration

Lệnh cập nhật database:

```powershell
dotnet ef database update --project .\HotelManagement.Domain\HotelManagement.Domain.csproj --startup-project .\HotelManagement.WebAPI\HotelManagement.WebAPI.csproj
```

## Tài liệu bổ sung

- Use case diagram: `diagram/usecase`
- Bảng đặc tả use case: `diagram/usecase-spec`
- Sequence diagram: `diagram/sequences`

## Gợi ý mở rộng tài liệu

- Bổ sung ERD và class diagram
- Tách rõ luồng guest và user đã đăng nhập cho phần chat
- Viết thêm hướng dẫn deploy môi trường production
