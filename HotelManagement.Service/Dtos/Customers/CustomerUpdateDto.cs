namespace DoAnWebQuanLyKhachSan.Service.Dtos.Customers
{
	public class CustomerUpdateDto
	{
		public string FullName { get; set; } = string.Empty;
		public string? Identify { get; set; }
		public string? Phone { get; set; }
		public string? Mail { get; set; }
		public DateTime? Dob { get; set; }
		public int? Customer_Type { get; set; }
	}
}
