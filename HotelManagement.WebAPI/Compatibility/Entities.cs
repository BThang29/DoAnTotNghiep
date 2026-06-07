using Microsoft.AspNetCore.Identity;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
	public class User : IdentityUser<int>
	{
		public bool IsAdministrator { get; set; }
	}

	public enum PrivilegeList
	{
		View = 0,
		Create = 1,
		Update = 2,
		Delete = 3
	}

	public class message
	{
		public int Id { get; set; }
		public string username { get; set; } = string.Empty;
		public int user_id { get; set; }
		public int isAdmin { get; set; }
		public DateTime createdDate { get; set; }
		public string content { get; set; } = string.Empty;
		public int clientId { get; set; }
	}
}
