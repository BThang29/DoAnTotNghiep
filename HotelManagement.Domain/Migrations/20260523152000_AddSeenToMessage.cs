using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddSeenToMessage : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cot 'seen' co the da duoc tao trong AddMessageTable -> chi them khi chua co.
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Messages', 'seen') IS NULL
                      ALTER TABLE dbo.Messages ADD seen bit NOT NULL CONSTRAINT DF_Messages_seen DEFAULT(0);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Messages', 'seen') IS NOT NULL
                  BEGIN
                      IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Messages_seen')
                          ALTER TABLE dbo.Messages DROP CONSTRAINT DF_Messages_seen;
                      ALTER TABLE dbo.Messages DROP COLUMN seen;
                  END;");
        }
    }
}
