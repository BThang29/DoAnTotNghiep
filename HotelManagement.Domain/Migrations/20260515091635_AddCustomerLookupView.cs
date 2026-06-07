using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    public partial class AddCustomerLookupView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF OBJECT_ID('dbo.vw_CustomerLookup', 'V') IS NOT NULL
                      DROP VIEW dbo.vw_CustomerLookup;
                  EXEC('CREATE VIEW dbo.vw_CustomerLookup AS
                  SELECT
                      c.id AS Id,
                      ISNULL(c.fullname, N'''') AS FullName,
                      ISNULL(c.identify, N'''') AS Identify,
                      ISNULL(c.phone, N'''') AS Phone,
                      ISNULL(c.mail, N'''') AS Mail,
                      c.dob AS Dob,
                      c.customer_type AS CustomerTypeId,
                      COALESCE(ct.details, ct.summary, N'''') AS CustomerTypeName
                  FROM Customers c
                  LEFT JOIN CustomerTypes ct ON c.customer_type = ct.id')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.vw_CustomerLookup");
        }
    }
}
