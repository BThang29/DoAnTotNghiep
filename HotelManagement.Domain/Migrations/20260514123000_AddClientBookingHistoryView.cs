using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddClientBookingHistoryView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_ClientBookingHistory', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_ClientBookingHistory;
                  EXEC('CREATE VIEW dbo.vw_ClientBookingHistory AS
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
                      ISNULL(bh.feedback, N'''') AS Feedback,
                      CASE
                          WHEN b.date_end IS NOT NULL AND CONVERT(date, b.date_end) < CONVERT(date, GETDATE()) THEN N''Completed''
                          WHEN b.date_start IS NOT NULL AND CONVERT(date, b.date_start) > CONVERT(date, GETDATE()) THEN N''Upcoming''
                          ELSE N''Ongoing''
                      END AS Status
                  FROM Bookings b
                  LEFT JOIN Customers c ON b.customer_id = c.id
                  LEFT JOIN Rooms r ON b.room_id = r.id
                  LEFT JOIN BookingHistories bh ON bh.booking_id = b.id
                  LEFT JOIN Invoices i ON i.booking_id = b.id
                  LEFT JOIN vw_InvoiceDetail invoiceDetail ON invoiceDetail.Id = i.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ClientBookingHistory");
        }
    }
}
