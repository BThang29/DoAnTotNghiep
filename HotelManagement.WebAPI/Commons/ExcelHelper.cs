using OfficeOpenXml;

namespace DoAnWebQuanLyKhachSan.API.Commons
{
    public class ExcelHelper
    {
        public static ExcelPackage CreateDoc(string title, string subject, string keyword)
        {
            var p = new ExcelPackage();
            p.Workbook.Properties.Title = title;
            p.Workbook.Properties.Author = "Application Name";
            p.Workbook.Properties.Subject = subject;
            p.Workbook.Properties.Keywords = keyword;
            return p;
        }
    }
}
