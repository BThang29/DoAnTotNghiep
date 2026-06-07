using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class ChangeBookingCustomerIdToUserId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            DropBookingDependentViews(migrationBuilder);

            migrationBuilder.RenameColumn(
                name: "customer_id",
                table: "Bookings",
                newName: "user_id");

            migrationBuilder.Sql(
                @"UPDATE b
                  SET b.user_id = c.userid
                  FROM dbo.Bookings b
                  INNER JOIN dbo.Customers c ON b.user_id = c.id;");

            CreateBookingDependentViewsForUserId(migrationBuilder);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            DropBookingDependentViews(migrationBuilder);

            migrationBuilder.Sql(
                @"UPDATE b
                  SET b.user_id = c.id
                  FROM dbo.Bookings b
                  INNER JOIN dbo.Customers c ON b.user_id = c.userid;");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Bookings",
                newName: "customer_id");

            CreateBookingDependentViewsForCustomerId(migrationBuilder);
        }

        private static void DropBookingDependentViews(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ClientOnlinePaymentResult");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ClientBookingHistory");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_InvoiceGrid");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_InvoiceDetail");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_StayingGuest");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_BookingDetail");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_BookingGrid");
        }

        private static void CreateBookingDependentViewsForUserId(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_BookingGrid AS
                  SELECT
                      b.id AS Id,
                      c.id AS CustomerId,
                      ISNULL(c.fullname, ISNULL(u.FullName, N'''')) AS CustomerName,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      b.employee_id AS EmployeeId,
                      b.voucher_id AS VoucherId
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users u ON b.user_id = u.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_BookingDetail AS
                  SELECT
                      b.id AS Id,
                      c.id AS CustomerId,
                      ISNULL(c.fullname, ISNULL(u.FullName, N'''')) AS CustomerName,
                      ISNULL(c.phone, ISNULL(u.PhoneNumber, N'''')) AS CustomerPhone,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      r.price AS RoomPrice,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      b.employee_id AS EmployeeId,
                      b.voucher_id AS VoucherId,
                      ISNULL(v.voucher_code, N'''') AS VoucherCode
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users u ON b.user_id = u.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Vouchers v ON b.voucher_id = v.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_InvoiceDetail AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, ISNULL(customerUser.FullName, N'''')) AS CustomerName,
                      ISNULL(c.phone, ISNULL(customerUser.PhoneNumber, N'''')) AS CustomerPhone,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(employee.FullName, N'''') AS EmployeeName,
                      i.issue_date AS IssueDate,
                      ISNULL(p.payment_details, N'''') AS PaymentDetails,
                      CAST(CASE
                          WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                          WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                          ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                      END AS int) AS Nights,
                      CAST(ISNULL(r.price, 0) AS decimal(18,2)) AS RoomUnitPrice,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) AS decimal(18,2)) AS RoomCharge,
                      CAST(ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS ServiceCharge,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) + ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS TotalAmount
                  FROM Invoices i
                  LEFT JOIN Bookings b ON i.booking_id = b.id
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users customerUser ON b.user_id = customerUser.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Users employee ON i.employee_id = employee.Id
                  LEFT JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN Vouchers bookingVoucher ON b.voucher_id = bookingVoucher.id
                  OUTER APPLY
                  (
                      SELECT CAST(
                          (CASE
                              WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                              WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                              ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                           END)
                          * ISNULL(r.price, 0)
                          * (1 - (
                              CASE
                                  WHEN bookingVoucher.id IS NOT NULL
                                   AND (bookingVoucher.date_start IS NULL OR CONVERT(date, bookingVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (bookingVoucher.date_end IS NULL OR CONVERT(date, bookingVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(bookingVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      AS decimal(18,2)) AS RoomCharge
                  ) roomCalc
                  OUTER APPLY
                  (
                      SELECT CAST(ISNULL(SUM(
                          (CASE
                              WHEN invoiceDetail.quantity IS NULL OR invoiceDetail.quantity <= 0 THEN 1
                              ELSE invoiceDetail.quantity
                           END)
                          * ISNULL(serviceDetail.price, 0)
                          * (1 - (
                              CASE
                                  WHEN detailVoucher.id IS NOT NULL
                                   AND (detailVoucher.date_start IS NULL OR CONVERT(date, detailVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (detailVoucher.date_end IS NULL OR CONVERT(date, detailVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(detailVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      ), 0) AS decimal(18,2)) AS ServiceCharge
                      FROM InvoiceDetails invoiceDetail
                      LEFT JOIN ServiceDetails serviceDetail ON invoiceDetail.servicedetail_id = serviceDetail.id
                      LEFT JOIN Vouchers detailVoucher ON invoiceDetail.voucher_id = detailVoucher.id
                      WHERE invoiceDetail.invoice_id = i.id
                  ) serviceCalc')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_StayingGuest AS
                  SELECT
                      ISNULL(c.id, 0) AS CustomerId,
                      ISNULL(c.fullname, ISNULL(u.FullName, N'''')) AS CustomerName,
                      ISNULL(c.phone, ISNULL(u.PhoneNumber, N'''')) AS Phone,
                      b.id AS BookingId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users u ON b.user_id = u.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  WHERE b.user_id IS NOT NULL
                    AND b.room_id IS NOT NULL
                    AND b.date_start IS NOT NULL
                    AND b.date_end IS NOT NULL
                    AND CONVERT(date, b.date_start) <= CONVERT(date, GETDATE())
                    AND CONVERT(date, b.date_end) >= CONVERT(date, GETDATE())')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_InvoiceGrid AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, ISNULL(customerUser.FullName, N'''')) AS CustomerName,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(employee.FullName, N'''') AS EmployeeName,
                      i.issue_date AS IssueDate,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) AS decimal(18,2)) AS RoomCharge,
                      CAST(ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS ServiceCharge,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) + ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS TotalAmount
                  FROM Invoices i
                  LEFT JOIN Bookings b ON i.booking_id = b.id
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users customerUser ON b.user_id = customerUser.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Users employee ON i.employee_id = employee.Id
                  LEFT JOIN Vouchers bookingVoucher ON b.voucher_id = bookingVoucher.id
                  OUTER APPLY
                  (
                      SELECT CAST(
                          (CASE
                              WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                              WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                              ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                           END)
                          * ISNULL(r.price, 0)
                          * (1 - (
                              CASE
                                  WHEN bookingVoucher.id IS NOT NULL
                                   AND (bookingVoucher.date_start IS NULL OR CONVERT(date, bookingVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (bookingVoucher.date_end IS NULL OR CONVERT(date, bookingVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(bookingVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      AS decimal(18,2)) AS RoomCharge
                  ) roomCalc
                  OUTER APPLY
                  (
                      SELECT CAST(ISNULL(SUM(
                          (CASE
                              WHEN invoiceDetail.quantity IS NULL OR invoiceDetail.quantity <= 0 THEN 1
                              ELSE invoiceDetail.quantity
                           END)
                          * ISNULL(serviceDetail.price, 0)
                          * (1 - (
                              CASE
                                  WHEN detailVoucher.id IS NOT NULL
                                   AND (detailVoucher.date_start IS NULL OR CONVERT(date, detailVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (detailVoucher.date_end IS NULL OR CONVERT(date, detailVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(detailVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      ), 0) AS decimal(18,2)) AS ServiceCharge
                      FROM InvoiceDetails invoiceDetail
                      LEFT JOIN ServiceDetails serviceDetail ON invoiceDetail.servicedetail_id = serviceDetail.id
                      LEFT JOIN Vouchers detailVoucher ON invoiceDetail.voucher_id = detailVoucher.id
                      WHERE invoiceDetail.invoice_id = i.id
                  ) serviceCalc')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientBookingHistory AS
                  SELECT
                      bh.id AS BookingHistoryId,
                      b.id AS BookingId,
                      i.id AS InvoiceId,
                      b.user_id AS UserId,
                      c.id AS CustomerId,
                      ISNULL(c.fullname, ISNULL(u.FullName, N'''')) AS CustomerName,
                      ISNULL(c.phone, ISNULL(u.PhoneNumber, N'''')) AS CustomerPhone,
                      ISNULL(c.mail, ISNULL(u.Email, N'''')) AS CustomerMail,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      CAST(ISNULL(invoiceDetail.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      ISNULL(rv.feedback, N'''') AS Feedback,
                      CASE
                          WHEN b.date_end IS NOT NULL AND CONVERT(date, b.date_end) < CONVERT(date, GETDATE()) THEN N''Completed''
                          WHEN b.date_start IS NOT NULL AND CONVERT(date, b.date_start) > CONVERT(date, GETDATE()) THEN N''Upcoming''
                          ELSE N''Ongoing''
                      END AS Status
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.user_id = c.userid
                  LEFT JOIN Users u ON b.user_id = u.Id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN BookingHistories bh ON bh.booking_id = b.id
                  LEFT JOIN Reviews rv ON rv.booking_id = b.id
                  LEFT JOIN Invoices i ON i.booking_id = b.id
                  LEFT JOIN vw_InvoiceDetail invoiceDetail ON invoiceDetail.Id = i.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientOnlinePaymentResult AS
                  SELECT
                      p.id AS PaymentId,
                      i.id AS InvoiceId,
                      ISNULL(pg.Method, N''Cash'') AS Method,
                      ISNULL(pg.QrContent, N'''') AS QrContent,
                      ISNULL(pg.Note, N'''') AS Note,
                      CAST(ISNULL(iv.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      i.issue_date AS IssueDate
                  FROM Invoices i
                  INNER JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN vw_PaymentGrid pg ON pg.Id = p.id
                  LEFT JOIN vw_InvoiceDetail iv ON iv.Id = i.id')");
        }

        private static void CreateBookingDependentViewsForCustomerId(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_BookingGrid AS
                  SELECT
                      b.id AS Id,
                      b.customer_id AS CustomerId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      b.employee_id AS EmployeeId,
                      b.voucher_id AS VoucherId
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_BookingDetail AS
                  SELECT
                      b.id AS Id,
                      b.customer_id AS CustomerId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(c.phone, N'''') AS CustomerPhone,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      r.price AS RoomPrice,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      b.employee_id AS EmployeeId,
                      b.voucher_id AS VoucherId,
                      ISNULL(v.voucher_code, N'''') AS VoucherCode
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Vouchers v ON b.voucher_id = v.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_InvoiceDetail AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(c.phone, N'''') AS CustomerPhone,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(employee.FullName, N'''') AS EmployeeName,
                      i.issue_date AS IssueDate,
                      ISNULL(p.payment_details, N'''') AS PaymentDetails,
                      CAST(CASE
                          WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                          WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                          ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                      END AS int) AS Nights,
                      CAST(ISNULL(r.price, 0) AS decimal(18,2)) AS RoomUnitPrice,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) AS decimal(18,2)) AS RoomCharge,
                      CAST(ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS ServiceCharge,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) + ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS TotalAmount
                  FROM Invoices i
                  LEFT JOIN Bookings b ON i.booking_id = b.id
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Users employee ON i.employee_id = employee.Id
                  LEFT JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN Vouchers bookingVoucher ON b.voucher_id = bookingVoucher.id
                  OUTER APPLY
                  (
                      SELECT CAST(
                          (CASE
                              WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                              WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                              ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                           END)
                          * ISNULL(r.price, 0)
                          * (1 - (
                              CASE
                                  WHEN bookingVoucher.id IS NOT NULL
                                   AND (bookingVoucher.date_start IS NULL OR CONVERT(date, bookingVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (bookingVoucher.date_end IS NULL OR CONVERT(date, bookingVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(bookingVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      AS decimal(18,2)) AS RoomCharge
                  ) roomCalc
                  OUTER APPLY
                  (
                      SELECT CAST(ISNULL(SUM(
                          (CASE
                              WHEN invoiceDetail.quantity IS NULL OR invoiceDetail.quantity <= 0 THEN 1
                              ELSE invoiceDetail.quantity
                           END)
                          * ISNULL(serviceDetail.price, 0)
                          * (1 - (
                              CASE
                                  WHEN detailVoucher.id IS NOT NULL
                                   AND (detailVoucher.date_start IS NULL OR CONVERT(date, detailVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (detailVoucher.date_end IS NULL OR CONVERT(date, detailVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(detailVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      ), 0) AS decimal(18,2)) AS ServiceCharge
                      FROM InvoiceDetails invoiceDetail
                      LEFT JOIN ServiceDetails serviceDetail ON invoiceDetail.servicedetail_id = serviceDetail.id
                      LEFT JOIN Vouchers detailVoucher ON invoiceDetail.voucher_id = detailVoucher.id
                      WHERE invoiceDetail.invoice_id = i.id
                  ) serviceCalc')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_StayingGuest AS
                  SELECT
                      c.id AS CustomerId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(c.phone, N'''') AS Phone,
                      b.id AS BookingId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  WHERE b.customer_id IS NOT NULL
                    AND b.room_id IS NOT NULL
                    AND b.date_start IS NOT NULL
                    AND b.date_end IS NOT NULL
                    AND CONVERT(date, b.date_start) <= CONVERT(date, GETDATE())
                    AND CONVERT(date, b.date_end) >= CONVERT(date, GETDATE())')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_InvoiceGrid AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(employee.FullName, N'''') AS EmployeeName,
                      i.issue_date AS IssueDate,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) AS decimal(18,2)) AS RoomCharge,
                      CAST(ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS ServiceCharge,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) + ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS TotalAmount
                  FROM Invoices i
                  LEFT JOIN Bookings b ON i.booking_id = b.id
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Users employee ON i.employee_id = employee.Id
                  LEFT JOIN Vouchers bookingVoucher ON b.voucher_id = bookingVoucher.id
                  OUTER APPLY
                  (
                      SELECT CAST(
                          (CASE
                              WHEN b.date_start IS NULL OR b.date_end IS NULL THEN 1
                              WHEN DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end)) <= 0 THEN 1
                              ELSE DATEDIFF(DAY, CONVERT(date, b.date_start), CONVERT(date, b.date_end))
                           END)
                          * ISNULL(r.price, 0)
                          * (1 - (
                              CASE
                                  WHEN bookingVoucher.id IS NOT NULL
                                   AND (bookingVoucher.date_start IS NULL OR CONVERT(date, bookingVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (bookingVoucher.date_end IS NULL OR CONVERT(date, bookingVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(bookingVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      AS decimal(18,2)) AS RoomCharge
                  ) roomCalc
                  OUTER APPLY
                  (
                      SELECT CAST(ISNULL(SUM(
                          (CASE
                              WHEN invoiceDetail.quantity IS NULL OR invoiceDetail.quantity <= 0 THEN 1
                              ELSE invoiceDetail.quantity
                           END)
                          * ISNULL(serviceDetail.price, 0)
                          * (1 - (
                              CASE
                                  WHEN detailVoucher.id IS NOT NULL
                                   AND (detailVoucher.date_start IS NULL OR CONVERT(date, detailVoucher.date_start) <= CONVERT(date, GETDATE()))
                                   AND (detailVoucher.date_end IS NULL OR CONVERT(date, detailVoucher.date_end) >= CONVERT(date, GETDATE()))
                                  THEN ISNULL(detailVoucher.voucher_percent, 0)
                                  ELSE 0
                              END
                          ) / 100.0)
                      ), 0) AS decimal(18,2)) AS ServiceCharge
                      FROM InvoiceDetails invoiceDetail
                      LEFT JOIN ServiceDetails serviceDetail ON invoiceDetail.servicedetail_id = serviceDetail.id
                      LEFT JOIN Vouchers detailVoucher ON invoiceDetail.voucher_id = detailVoucher.id
                      WHERE invoiceDetail.invoice_id = i.id
                  ) serviceCalc')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientBookingHistory AS
                  SELECT
                      bh.id AS BookingHistoryId,
                      b.id AS BookingId,
                      i.id AS InvoiceId,
                      b.customer_id AS CustomerId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(c.phone, N'''') AS CustomerPhone,
                      ISNULL(c.mail, N'''') AS CustomerMail,
                      b.room_id AS RoomId,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      b.date_booking AS DateBooking,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd,
                      b.deposit AS Deposit,
                      CAST(ISNULL(invoiceDetail.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      ISNULL(rv.feedback, N'''') AS Feedback,
                      CASE
                          WHEN b.date_end IS NOT NULL AND CONVERT(date, b.date_end) < CONVERT(date, GETDATE()) THEN N''Completed''
                          WHEN b.date_start IS NOT NULL AND CONVERT(date, b.date_start) > CONVERT(date, GETDATE()) THEN N''Upcoming''
                          ELSE N''Ongoing''
                      END AS Status
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN BookingHistories bh ON bh.booking_id = b.id
                  LEFT JOIN Reviews rv ON rv.booking_id = b.id
                  LEFT JOIN Invoices i ON i.booking_id = b.id
                  LEFT JOIN vw_InvoiceDetail invoiceDetail ON invoiceDetail.Id = i.id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientOnlinePaymentResult AS
                  SELECT
                      p.id AS PaymentId,
                      i.id AS InvoiceId,
                      ISNULL(pg.Method, N''Cash'') AS Method,
                      ISNULL(pg.QrContent, N'''') AS QrContent,
                      ISNULL(pg.Note, N'''') AS Note,
                      CAST(ISNULL(iv.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      i.issue_date AS IssueDate
                  FROM Invoices i
                  INNER JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN vw_PaymentGrid pg ON pg.Id = p.id
                  LEFT JOIN vw_InvoiceDetail iv ON iv.Id = i.id')");
        }
    }
}
