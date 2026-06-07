using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddBookingInvoiceDetailAndStayingGuestViews : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_BookingDetail', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_BookingDetail;
                  EXEC('CREATE VIEW dbo.vw_BookingDetail AS
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
                @"IF OBJECT_ID('dbo.vw_InvoiceDetail', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_InvoiceDetail;
                  EXEC('CREATE VIEW dbo.vw_InvoiceDetail AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(c.phone, N'''') AS CustomerPhone,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(u.FullName, N'''') AS EmployeeName,
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
                  LEFT JOIN Users u ON i.employee_id = u.Id
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
                @"IF OBJECT_ID('dbo.vw_StayingGuest', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_StayingGuest;
                  EXEC('CREATE VIEW dbo.vw_StayingGuest AS
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
                @"IF OBJECT_ID('dbo.vw_PaymentGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_PaymentGrid;
                  EXEC('CREATE VIEW dbo.vw_PaymentGrid AS
                  SELECT
                      p.id AS Id,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Method''), ''Cash'')
                          ELSE ''Cash''
                      END AS Method,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountName''), N'''')
                          ELSE N''''
                      END AS AccountName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountNumber''), N'''')
                          ELSE N''''
                      END AS AccountNumber,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.BankName''), N'''')
                          ELSE N''''
                      END AS BankName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.QrContent''), N'''')
                          ELSE N''''
                      END AS QrContent,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Note''), N'''')
                          ELSE ISNULL(p.payment_details, N'''')
                      END AS Note,
                      i.id AS InvoiceId
                  FROM Payments p
                  LEFT JOIN Invoices i ON p.id = i.payment_id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_InvoiceDetail");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_BookingDetail");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_StayingGuest");

            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_PaymentGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_PaymentGrid;
                  EXEC('CREATE VIEW dbo.vw_PaymentGrid AS
                  SELECT
                      p.id AS Id,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Method''), ''Cash'')
                          ELSE ''Cash''
                      END AS Method,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountName''), N'''')
                          ELSE N''''
                      END AS AccountName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountNumber''), N'''')
                          ELSE N''''
                      END AS AccountNumber,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.BankName''), N'''')
                          ELSE N''''
                      END AS BankName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Note''), N'''')
                          ELSE ISNULL(p.payment_details, N'''')
                      END AS Note,
                      i.id AS InvoiceId
                  FROM Payments p
                  LEFT JOIN Invoices i ON p.id = i.payment_id')");
        }
    }
}
