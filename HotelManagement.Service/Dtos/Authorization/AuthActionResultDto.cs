namespace DoAnWebQuanLyKhachSan.Service.Dtos.Authorization
{
    public class AuthActionResultDto
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? ResultObj { get; set; }
    }
}
