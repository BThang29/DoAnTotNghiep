namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.BookingHistories
{
	public class ClientBookingHistoryDto
	{
		public int? BookingHistoryId { get; set; }
		public int BookingId { get; set; }
		public int? InvoiceId { get; set; }
		public int? UserId { get; set; }
		public int? CustomerId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public string CustomerPhone { get; set; } = string.Empty;
		public string CustomerMail { get; set; } = string.Empty;
		public int? RoomId { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public DateTime? DateBooking { get; set; }
		public DateTime? DateStart { get; set; }
		public DateTime? DateEnd { get; set; }
		public decimal? Deposit { get; set; }
		public decimal TotalAmount { get; set; }
		public string Feedback { get; set; } = string.Empty;
		public string Status { get; set; } = string.Empty;
	}
}
