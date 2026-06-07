using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddBookingStatus : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "booking_status",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                @"UPDATE b
                  SET b.booking_status = CASE
                      WHEN EXISTS (SELECT 1 FROM dbo.Invoices i WHERE i.booking_id = b.id) THEN 1
                      ELSE 0
                  END
                  FROM dbo.Bookings b;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "booking_status",
                table: "Bookings");
        }
    }
}
