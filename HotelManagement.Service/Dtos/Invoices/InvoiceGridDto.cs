namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceGridDto
	{
		public int Id { get; set; }
		public int? BookingId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public string RoomName { get; set; } = string.Empty;
		public string EmployeeName { get; set; } = string.Empty;
		public DateTime? IssueDate { get; set; }
		public decimal RoomCharge { get; set; }
		public decimal ServiceCharge { get; set; }
		public decimal TotalAmount { get; set; }
	}
}
