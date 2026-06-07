namespace DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard
{
	public class RevenueSummaryDto
	{
		public decimal TotalRevenue { get; set; }
		public decimal RevenueToday { get; set; }
		public decimal RevenueThisMonth { get; set; }
		public int InvoiceCount { get; set; }
	}
}
