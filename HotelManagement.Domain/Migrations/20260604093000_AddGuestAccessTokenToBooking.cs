using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddGuestAccessTokenToBooking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "guest_email",
                table: "Bookings",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guest_full_name",
                table: "Bookings",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guest_access_token",
                table: "Bookings",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.Sql(
                @"UPDATE dbo.Bookings
                  SET guest_access_token = REPLACE(CONVERT(varchar(36), NEWID()), '-', '') + REPLACE(CONVERT(varchar(36), NEWID()), '-', '')
                  WHERE guest_access_token IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_guest_access_token",
                table: "Bookings",
                column: "guest_access_token",
                unique: true,
                filter: "[guest_access_token] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_guest_access_token",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "guest_email",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "guest_full_name",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "guest_access_token",
                table: "Bookings");
        }
    }
}
