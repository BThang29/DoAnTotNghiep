using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddReviewTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_id = table.Column<int>(type: "int", nullable: false),
                    customer_id = table.Column<int>(type: "int", nullable: true),
                    rating = table.Column<int>(type: "int", nullable: false),
                    feedback = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_booking_id",
                table: "Reviews",
                column: "booking_id",
                unique: true);

            migrationBuilder.Sql(
                @"INSERT INTO dbo.Reviews (booking_id, customer_id, rating, feedback, created_at, updated_at)
                  SELECT
                      bh.booking_id,
                      b.customer_id,
                      5,
                      bh.feedback,
                      SYSUTCDATETIME(),
                      NULL
                  FROM dbo.BookingHistories bh
                  LEFT JOIN dbo.Bookings b ON bh.booking_id = b.id
                  WHERE bh.booking_id IS NOT NULL
                    AND LTRIM(RTRIM(ISNULL(bh.feedback, N''))) <> N''
                    AND NOT EXISTS (
                        SELECT 1
                        FROM dbo.Reviews r
                        WHERE r.booking_id = bh.booking_id
                    );");

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
        }

        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropTable(
                name: "Reviews");
        }
    }
}
