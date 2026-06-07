using System.Collections.Generic;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Users
{
    public class UserCreateDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int Active { get; set; } = 1;
        public bool IsAdministrator { get; set; }
        public string backgroundImage { get; set; } = string.Empty;
        public List<int> RoleIds { get; set; } = new();
    }
}
