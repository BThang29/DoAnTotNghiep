namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class BookingCreateDto
	{
		public int id { get; set; }
		public int CustomerId { get; set; }
		public int RoomId { get; set; }
		public DateTime DateStart { get; set; }
		public DateTime DateEnd { get; set; }
		public decimal? Deposit { get; set; }
		public int? VoucherId { get; set; }
	}
}
