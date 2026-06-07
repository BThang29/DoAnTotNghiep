using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddBookingExpireToBooking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "booking_exprire",
                table: "Bookings",
                type: "datetime",
                nullable: true,
                defaultValueSql: "DATEADD(MINUTE, 10, GETDATE())");

            migrationBuilder.Sql(
                @"UPDATE b
                  SET b.booking_exprire = DATEADD(MINUTE, 10, ISNULL(b.date_booking, GETDATE()))
                  FROM dbo.Bookings b
                  WHERE b.booking_exprire IS NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "booking_exprire",
                table: "Bookings");
        }
    }
}
