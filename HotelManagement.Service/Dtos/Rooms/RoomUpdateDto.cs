namespace DoAnWebQuanLyKhachSan.Service.Dtos.Rooms
{
	public class RoomUpdateDto
	{
		public string RoomName { get; set; } = string.Empty;
		public decimal? Price { get; set; }
		public string? RoomTypeId { get; set; }
		public string? RoomStatusId { get; set; }
	}
}
