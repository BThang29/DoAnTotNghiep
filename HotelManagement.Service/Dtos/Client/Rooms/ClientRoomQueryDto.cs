namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms
{
	public class ClientRoomQueryDto
	{
		public string? Keyword { get; set; }
		public string? RoomTypeId { get; set; }
		public decimal? MinPrice { get; set; }
		public decimal? MaxPrice { get; set; }
		public DateTime? DateStart { get; set; }
		public DateTime? DateEnd { get; set; }
		public bool OnlyAvailable { get; set; } = true;
	}
}
