using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DbMigrator.Migrations
{
    /// <inheritdoc />
    public partial class MessageAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Messages");

            migrationBuilder.CreateTable(
                name: "MessageAction",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    MessageId = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    ActionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MessageId1 = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageAction", x => new { x.UserId, x.MessageId, x.Action });
                    table.ForeignKey(
                        name: "FK_MessageAction_Messages_MessageId1",
                        column: x => x.MessageId1,
                        principalTable: "Messages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MessageAction_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MessageAction_MessageId1",
                table: "MessageAction",
                column: "MessageId1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MessageAction");

            migrationBuilder.AddColumn<string>(
                name: "ClientId",
                table: "Messages",
                type: "text",
                nullable: true);
        }
    }
}
