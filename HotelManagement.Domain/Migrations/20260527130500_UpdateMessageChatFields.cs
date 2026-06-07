using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class UpdateMessageChatFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "assignedAdminUserId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "conversationKey",
                table: "Messages",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "customerId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guestToken",
                table: "Messages",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "seenDate",
                table: "Messages",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "senderRole",
                table: "Messages",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Customer");

            migrationBuilder.AddColumn<int>(
                name: "senderUserId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_assignedAdminUserId",
                table: "Messages",
                column: "assignedAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_conversationKey",
                table: "Messages",
                column: "conversationKey");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_customerId",
                table: "Messages",
                column: "customerId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_guestToken",
                table: "Messages",
                column: "guestToken");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_assignedAdminUserId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_conversationKey",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_customerId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_guestToken",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "assignedAdminUserId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "conversationKey",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "customerId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "guestToken",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "seenDate",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "senderRole",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "senderUserId",
                table: "Messages");
        }
    }
}
