using System;
using System.Collections.Generic;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Users
{
    public class UserDetailDto
    {
		public int Id { get; set; }
		public string UserName { get; set; } = string.Empty;
		public string FullName { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string PhoneNumber { get; set; } = string.Empty;
		public int Active { get; set; }
		public bool IsAdministrator { get; set; }
		public string NewPassword { get; set; } = string.Empty;
		public List<int> RoleIds { get; set; } = new();
		public List<string> RoleNames { get; set; } = new();
		public string CreateDate { get; set; } = string.Empty;
		public string backgroundImage { get; set; } = string.Empty;
		public string Address { get; set; } = string.Empty;
	}
}
