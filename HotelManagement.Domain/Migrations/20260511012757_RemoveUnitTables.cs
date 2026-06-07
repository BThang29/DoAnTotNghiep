using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnitTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Roles_Units_UnitId",
                table: "Roles");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Units_UnitId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "UnitAncestors");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropIndex(
                name: "IX_Users_UnitId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Roles_UnitId",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "Roles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnitId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitId",
                table: "Roles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Units_Units_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Units",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UnitAncestors",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitAncestorId = table.Column<int>(type: "int", nullable: false),
                    UnitId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitAncestors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitAncestors_Units_UnitAncestorId",
                        column: x => x.UnitAncestorId,
                        principalTable: "Units",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UnitAncestors_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_UnitId",
                table: "Users",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_UnitId",
                table: "Roles",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitAncestors_UnitAncestorId",
                table: "UnitAncestors",
                column: "UnitAncestorId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitAncestors_UnitId",
                table: "UnitAncestors",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_ParentId",
                table: "Units",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Roles_Units_UnitId",
                table: "Roles",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Units_UnitId",
                table: "Users",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");
        }
    }
}
