namespace DoAnWebQuanLyKhachSan.Service.Dtos.Others
{
	public class ServiceUpdateDto
	{
		public string NameService { get; set; } = string.Empty;
		public decimal? Price { get; set; }
		public string? ServiceCode { get; set; }
		public int? RemainingInventory { get; set; }
		public string? UnitName { get; set; }
		public int? ServiceTypeId { get; set; }
	}
}
