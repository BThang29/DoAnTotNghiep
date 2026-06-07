using System;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Users
{
    public class UserGridDto
    {
		public int Id { get; set; }
		public string UserName { get; set; } = string.Empty;
		public string FullName { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public int Active { get; set; }
		public bool IsAdministrator { get; set; }
		public string PhoneNumber { get; set; } = string.Empty;
		public string[] Roles { get; set; } = Array.Empty<string>();
		public int? DeletedUserId { get; set; }
		public string CreateDate { get; set; } = string.Empty;
		public string backgroundImage { get; set; } = string.Empty;
		public string Address { get; set; } = string.Empty;
	}
}
