using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class UpdatePaymentTableStructure : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add qr_content and note columns if they don't exist
            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'qr_content')
                  BEGIN
                      ALTER TABLE [Payments] ADD [qr_content] nvarchar(max) NULL;
                  END");

            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'note')
                  BEGIN
                      ALTER TABLE [Payments] ADD [note] nvarchar(max) NULL;
                  END");

            // Update vw_PaymentGrid to use all columns including new ones
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_ClientOnlinePaymentResult', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_ClientOnlinePaymentResult;");

            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_PaymentGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_PaymentGrid;
                  EXEC('CREATE VIEW dbo.vw_PaymentGrid AS
                  SELECT
                      p.id AS Id,
                      ISNULL(p.method, N''Cash'') AS Method,
                      ISNULL(p.name_account, N'''') AS AccountName,
                      ISNULL(p.account_number, N'''') AS AccountNumber,
                      ISNULL(p.bank_name, N'''') AS BankName,
                      ISNULL(p.qr_content, N'''') AS QrContent,
                      ISNULL(p.note, N'''') AS Note,
                      i.id AS InvoiceId
                  FROM Payments p
                  LEFT JOIN Invoices i ON p.id = i.payment_id')");

            // Recreate vw_ClientOnlinePaymentResult
            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientOnlinePaymentResult AS
                  SELECT
                      p.id AS PaymentId,
                      i.id AS InvoiceId,
                      ISNULL(p.method, N''Cash'') AS Method,
                      ISNULL(p.qr_content, N'''') AS QrContent,
                      ISNULL(p.note, N'''') AS Note,
                      CAST(ISNULL(iv.TotalAmount, 0) AS decimal(18,2)) AS TotalAmount,
                      i.issue_date AS IssueDate
                  FROM Invoices i
                  INNER JOIN Payments p ON i.payment_id = p.id
                  LEFT JOIN vw_InvoiceDetail iv ON iv.Id = i.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop views
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_ClientOnlinePaymentResult");
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_PaymentGrid");

            // Drop new columns
            migrationBuilder.Sql(
                @"IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'qr_content')
                  BEGIN
                      ALTER TABLE Payments DROP COLUMN [qr_content];
                  END");

            migrationBuilder.Sql(
                @"IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'note')
                  BEGIN
                      ALTER TABLE Payments DROP COLUMN [note];
                  END");

            // Recreate old views
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_PaymentGrid', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_PaymentGrid;
                  EXEC('CREATE VIEW dbo.vw_PaymentGrid AS
                  SELECT
                      p.id AS Id,
                      ISNULL(p.method, N''Cash'') AS Method,
                      ISNULL(p.name_account, N'''') AS AccountName,
                      ISNULL(p.account_number, N'''') AS AccountNumber,
                      ISNULL(p.bank_name, N'''') AS BankName,
                      N'''' AS QrContent,
                      N'''' AS Note,
                      i.id AS InvoiceId
                  FROM Payments p
                  LEFT JOIN Invoices i ON p.id = i.payment_id')");

            migrationBuilder.Sql(
                @"EXEC('CREATE VIEW dbo.vw_ClientOnlinePaymentResult AS
                  SELECT
                      p.id AS PaymentId,
                      i.id AS InvoiceId,
                      ISNULL(p.method, N''Cash'') AS Method,
                      N'''' AS QrContent,
                      N'''' AS Note,
                      CAST(0 AS decimal(18,2)) AS TotalAmount,
                      i.issue_date AS IssueDate
                  FROM Invoices i
                  INNER JOIN Payments p ON i.payment_id = p.id')");
        }
    }
}
