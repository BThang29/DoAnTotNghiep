namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class BookingDetailDto
	{
		public int Id { get; set; }
		public int? CustomerId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public string CustomerPhone { get; set; } = string.Empty;
		public int? RoomId { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public decimal? RoomPrice { get; set; }
		public DateTime? DateBooking { get; set; }
		public DateTime? DateStart { get; set; }
		public DateTime? DateEnd { get; set; }
		public decimal? Deposit { get; set; }
		public int? EmployeeId { get; set; }
		public int? VoucherId { get; set; }
		public string VoucherCode { get; set; } = string.Empty;
	}
}
