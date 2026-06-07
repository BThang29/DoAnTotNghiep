using System.Collections.Generic;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Users
{
    public class UserUpdateDto
    {
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsAdministrator { get; set; }
        public string backgroundImage { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public List<int> RoleIds { get; set; } = new();
    }
}
