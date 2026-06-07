using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddInvoiceGridView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_InvoiceGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_InvoiceGrid;
                  EXEC('CREATE VIEW dbo.vw_InvoiceGrid AS
                  SELECT
                      i.id AS Id,
                      i.booking_id AS BookingId,
                      ISNULL(c.fullname, N'''') AS CustomerName,
                      ISNULL(r.room_name, N'''') AS RoomName,
                      ISNULL(u.FullName, N'''') AS EmployeeName,
                      i.issue_date AS IssueDate,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) AS decimal(18,2)) AS RoomCharge,
                      CAST(ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS ServiceCharge,
                      CAST(ISNULL(roomCalc.RoomCharge, 0) + ISNULL(serviceCalc.ServiceCharge, 0) AS decimal(18,2)) AS TotalAmount
                  FROM Invoices i
                  LEFT JOIN Bookings b ON i.booking_id = b.id
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN Users u ON i.employee_id = u.Id
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
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_InvoiceGrid");
        }
    }
}
