using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddBookingGridView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_BookingGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_BookingGrid;
                  EXEC('CREATE VIEW dbo.vw_BookingGrid AS
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
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_BookingGrid");
        }
    }
}
