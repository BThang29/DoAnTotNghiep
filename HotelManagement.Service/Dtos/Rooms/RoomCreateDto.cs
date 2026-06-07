namespace DoAnWebQuanLyKhachSan.Service.Dtos.Rooms
{
	public class RoomCreateDto
	{
		public int id { get; set; }
		public int room { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public decimal? Price { get; set; }
		public string? RoomTypeId { get; set; }
		public string? RoomStatusId { get; set; }
	}
}
