namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceCalculationDto
	{
		public int BookingId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public string RoomName { get; set; } = string.Empty;
		public int Nights { get; set; }
		public decimal RoomUnitPrice { get; set; }
		public decimal RoomCharge { get; set; }
		public decimal ServiceCharge { get; set; }
		public decimal TotalAmount { get; set; }
		public List<InvoiceChargeLineDto> ServiceLines { get; set; } = new();
	}
}
