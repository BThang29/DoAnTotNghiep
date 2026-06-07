using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class ChangeRoomTypeIdToString : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomGrid");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.RoomTypes', 'id_new') IS NOT NULL
                      ALTER TABLE dbo.RoomTypes DROP COLUMN id_new;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes ADD id_new nvarchar(50) NOT NULL DEFAULT N'';");
            migrationBuilder.Sql("UPDATE dbo.RoomTypes SET id_new = CAST(id AS nvarchar(50));");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes DROP CONSTRAINT PK_RoomTypes;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes DROP COLUMN id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.RoomTypes.id_new', 'id', 'COLUMN';");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes ADD CONSTRAINT PK_RoomTypes PRIMARY KEY (id);");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Rooms', 'roomtype_id_new') IS NOT NULL
                      ALTER TABLE dbo.Rooms DROP COLUMN roomtype_id_new;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms ADD roomtype_id_new nvarchar(50) NULL;");
            migrationBuilder.Sql(
                @"UPDATE dbo.Rooms
                  SET roomtype_id_new = CASE WHEN roomtype_id IS NULL THEN NULL ELSE CAST(roomtype_id AS nvarchar(50)) END;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms DROP COLUMN roomtype_id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.Rooms.roomtype_id_new', 'roomtype_id', 'COLUMN';");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_RoomGrid AS
                  SELECT
                      r.id AS Id,
                      r.room_name AS RoomName,
                      r.price AS Price,
                      ISNULL(r.roomtype_id, N'''''''') AS RoomTypeId,
                      ISNULL(rt.details, N'''''''') AS RoomTypeName,
                      ISNULL(r.room_status, N'''''''') AS RoomStatusId,
                      ISNULL(rs.details, N'''''''') AS RoomStatusName
                  FROM Rooms r
                  LEFT JOIN RoomTypes rt ON r.roomtype_id = rt.id
                  LEFT JOIN RoomStatuses rs ON r.room_status = rs.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomGrid");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Rooms', 'roomtype_id_old') IS NOT NULL
                      ALTER TABLE dbo.Rooms DROP COLUMN roomtype_id_old;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms ADD roomtype_id_old int NULL;");
            migrationBuilder.Sql(
                @"UPDATE dbo.Rooms
                  SET roomtype_id_old = CASE WHEN roomtype_id IS NULL THEN NULL ELSE TRY_CAST(roomtype_id AS int) END;");
            migrationBuilder.Sql("ALTER TABLE dbo.Rooms DROP COLUMN roomtype_id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.Rooms.roomtype_id_old', 'roomtype_id', 'COLUMN';");

            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.RoomTypes', 'id_old') IS NOT NULL
                      ALTER TABLE dbo.RoomTypes DROP COLUMN id_old;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes ADD id_old int NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("UPDATE dbo.RoomTypes SET id_old = TRY_CAST(id AS int);");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes DROP CONSTRAINT PK_RoomTypes;");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes DROP COLUMN id;");
            migrationBuilder.Sql("EXEC sp_rename 'dbo.RoomTypes.id_old', 'id', 'COLUMN';");
            migrationBuilder.Sql("ALTER TABLE dbo.RoomTypes ADD CONSTRAINT PK_RoomTypes PRIMARY KEY (id);");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_RoomGrid AS
                  SELECT
                      r.id AS Id,
                      r.room_name AS RoomName,
                      r.price AS Price,
                      r.roomtype_id AS RoomTypeId,
                      ISNULL(rt.details, N'''''''') AS RoomTypeName,
                      ISNULL(r.room_status, N'''''''') AS RoomStatusId,
                      ISNULL(rs.details, N'''''''') AS RoomStatusName
                  FROM Rooms r
                  LEFT JOIN RoomTypes rt ON r.roomtype_id = rt.id
                  LEFT JOIN RoomStatuses rs ON r.room_status = rs.id')");
        }
    }
}
