namespace DoAnWebQuanLyKhachSan.Service.Dtos.Authorization
{
    public class AuthTokenResponseDto
    {
        public int UserId { get; set; }
        public int? CustomerId { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public DateTime Expires { get; set; }
        public string ExpiresString { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public List<AuthClaimDto> Claims { get; set; } = new();
        public List<string> Privileges { get; set; } = new();
    }
}
