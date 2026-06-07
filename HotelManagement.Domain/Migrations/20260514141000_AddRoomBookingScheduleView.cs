using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddRoomBookingScheduleView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_RoomBookingSchedule', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_RoomBookingSchedule;
                  EXEC('CREATE VIEW dbo.vw_RoomBookingSchedule AS
                  SELECT
                      b.id AS BookingId,
                      b.room_id AS RoomId,
                      b.date_start AS DateStart,
                      b.date_end AS DateEnd
                  FROM Bookings b
                  WHERE b.room_id IS NOT NULL')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomBookingSchedule");
        }
    }
}
