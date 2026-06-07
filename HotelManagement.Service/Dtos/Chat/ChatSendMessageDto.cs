namespace DoAnWebQuanLyKhachSan.Service.Dtos.Chat
{
    public class ChatSendMessageDto
    {
        public int? CustomerId { get; set; }
        public string ConversationKey { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
