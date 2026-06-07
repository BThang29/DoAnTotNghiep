using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddActiveToUsers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.Users', N'Active') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [Active] int NOT NULL
        CONSTRAINT [DF_Users_Active] DEFAULT(1);
END;

UPDATE [dbo].[Users]
SET [Active] = 1
WHERE [Active] IS NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.Users', N'Active') IS NOT NULL
BEGIN
    DECLARE @constraintName nvarchar(200);

    SELECT @constraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'Active';

    IF @constraintName IS NOT NULL
    BEGIN
        EXEC(N'ALTER TABLE [dbo].[Users] DROP CONSTRAINT [' + @constraintName + ']');
    END;

    ALTER TABLE [dbo].[Users] DROP COLUMN [Active];
END;
");
        }
    }
}
