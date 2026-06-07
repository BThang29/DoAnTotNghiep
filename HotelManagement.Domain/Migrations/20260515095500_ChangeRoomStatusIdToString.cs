using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class ChangeRoomStatusIdToString : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomGrid");

            // RoomStatuses.id: int -> nvarchar(50). Tach moi cau lenh thanh 1 batch rieng
            // de cot vua them duoc nhin thay (SQL Server bien dich tung batch).
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.RoomStatuses', 'id_new') IS NOT NULL
                      ALTER TABLE dbo.RoomStatuses DROP COLUMN id_new;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses ADD id_new nvarchar(50) NOT NULL DEFAULT N'';");
            migrationBuilder.Sql("UPDATE dbo.RoomStatuses SET id_new = CAST(id AS nvarchar(50));");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses DROP CONSTRAINT PK_RoomStatuses;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses DROP COLUMN id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.RoomStatuses.id_new', 'id', 'COLUMN';");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses ADD CONSTRAINT PK_RoomStatuses PRIMARY KEY (id);");

            // Rooms.room_status: int -> nvarchar(50)
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Rooms', 'room_status_new') IS NOT NULL
                      ALTER TABLE dbo.Rooms DROP COLUMN room_status_new;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms ADD room_status_new nvarchar(50) NULL;");
            migrationBuilder.Sql(
                @"UPDATE dbo.Rooms
                  SET room_status_new = CASE WHEN room_status IS NULL THEN NULL ELSE CAST(room_status AS nvarchar(50)) END;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms DROP COLUMN room_status;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.Rooms.room_status_new', 'room_status', 'COLUMN';");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_RoomGrid AS
                  SELECT
                      r.id AS Id,
                      r.room_name AS RoomName,
                      r.price AS Price,
                      r.roomtype_id AS RoomTypeId,
                      ISNULL(rt.details, N'''') AS RoomTypeName,
                      ISNULL(r.room_status, N'''') AS RoomStatusId,
                      ISNULL(rs.details, N'''') AS RoomStatusName
                  FROM Rooms r
                  LEFT JOIN RoomTypes rt ON r.roomtype_id = rt.id
                  LEFT JOIN RoomStatuses rs ON r.room_status = rs.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomGrid");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Rooms', 'room_status_old') IS NOT NULL
                      ALTER TABLE dbo.Rooms DROP COLUMN room_status_old;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms ADD room_status_old int NULL;");
            migrationBuilder.Sql(
                @"UPDATE dbo.Rooms
                  SET room_status_old = CASE WHEN room_status IS NULL THEN NULL ELSE TRY_CAST(room_status AS int) END;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms DROP COLUMN room_status;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.Rooms.room_status_old', 'room_status', 'COLUMN';");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.RoomStatuses', 'id_old') IS NOT NULL
                      ALTER TABLE dbo.RoomStatuses DROP COLUMN id_old;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses ADD id_old int NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("UPDATE dbo.RoomStatuses SET id_old = TRY_CAST(id AS int);");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses DROP CONSTRAINT PK_RoomStatuses;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses DROP COLUMN id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.RoomStatuses.id_old', 'id', 'COLUMN';");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomStatuses ADD CONSTRAINT PK_RoomStatuses PRIMARY KEY (id);");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_RoomGrid AS
                  SELECT
                      r.id AS Id,
                      r.room_name AS RoomName,
                      r.price AS Price,
                      r.roomtype_id AS RoomTypeId,
                      ISNULL(rt.details, N'''') AS RoomTypeName,
                      r.room_status AS RoomStatusId,
                      ISNULL(rs.details, N'''') AS RoomStatusName
                  FROM Rooms r
                  LEFT JOIN RoomTypes rt ON r.roomtype_id = rt.id
                  LEFT JOIN RoomStatuses rs ON r.room_status = rs.id')");
        }
    }
}
