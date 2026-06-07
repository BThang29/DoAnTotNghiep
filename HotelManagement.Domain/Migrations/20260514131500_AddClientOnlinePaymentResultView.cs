using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddClientOnlinePaymentResultView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_ClientOnlinePaymentResult', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_ClientOnlinePaymentResult;
                  EXEC('CREATE VIEW dbo.vw_ClientOnlinePaymentResult AS
                  SELECT
                      p.id AS PaymentId,
                      i.id AS InvoiceId,
                      ISNULL(pg.Method, N''Cash'') AS Method,
                      ISNULL(pg.QrContent, N'''') AS QrContent,
                      ISNULL(pg.Note, N'''') AS Note,
                      CAST(ISNULL(iv.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      i.issue_date AS IssueDate
                  FROM Invoices i
                  INNER JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN vw_PaymentGrid pg ON pg.Id = p.id
                  LEFT JOIN vw_InvoiceDetail iv ON iv.Id = i.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ClientOnlinePaymentResult");
        }
    }
}
