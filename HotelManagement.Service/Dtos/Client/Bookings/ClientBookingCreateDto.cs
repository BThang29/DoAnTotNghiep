namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Bookings
{
	public class ClientBookingCreateDto
	{
		public string FullName { get; set; } = string.Empty;
		public string? Identify { get; set; }
		public string? Phone { get; set; }
		public string? Mail { get; set; }
		public DateTime? Dob { get; set; }
		public int RoomId { get; set; }
		public DateTime DateStart { get; set; }
		public DateTime DateEnd { get; set; }
		public decimal? Deposit { get; set; }
		public int? VoucherId { get; set; }
	}
}
