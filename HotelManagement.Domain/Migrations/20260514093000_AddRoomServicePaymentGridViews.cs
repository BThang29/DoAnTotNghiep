using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddRoomServicePaymentGridViews : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_RoomGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_RoomGrid;
                  EXEC('CREATE VIEW dbo.vw_RoomGrid AS
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

            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_ServiceGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_ServiceGrid;
                  EXEC('CREATE VIEW dbo.vw_ServiceGrid AS
                  SELECT
                      sd.id AS Id,
                      sd.name_service AS NameService,
                      sd.price AS Price,
                      ISNULL(sd.service_code, N'''') AS ServiceCode,
                      sd.remaining_inventory AS RemainingInventory,
                      ISNULL(sd.unit_name, N'''') AS UnitName,
                      sd.servicetype_id AS ServiceTypeId,
                      ISNULL(st.details, N'''') AS ServiceTypeName
                  FROM ServiceDetails sd
                  LEFT JOIN ServiceTypes st ON sd.servicetype_id = st.id')");

            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_PaymentGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_PaymentGrid;
                  EXEC('CREATE VIEW dbo.vw_PaymentGrid AS
                  SELECT
                      p.id AS Id,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Method''), ''Cash'')
                          ELSE ''Cash''
                      END AS Method,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountName''), N'''')
                          ELSE N''''
                      END AS AccountName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.AccountNumber''), N'''')
                          ELSE N''''
                      END AS AccountNumber,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.BankName''), N'''')
                          ELSE N''''
                      END AS BankName,
                      CASE
                          WHEN ISJSON(p.payment_details) = 1 THEN ISNULL(JSON_VALUE(p.payment_details, ''$.Note''), N'''')
                          ELSE ISNULL(p.payment_details, N'''')
                      END AS Note,
                      i.id AS InvoiceId
                  FROM Payments p
                  LEFT JOIN Invoices i ON p.id = i.payment_id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_PaymentGrid");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ServiceGrid");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_RoomGrid");
        }
    }
}
