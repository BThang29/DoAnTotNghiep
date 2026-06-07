namespace DoAnWebQuanLyKhachSan.Service.Dtos.Chat
{
    public class ChatConversationBootstrapDto
    {
        public ChatClientContextDto Context { get; set; } = new ChatClientContextDto();
        public List<ChatMessageDto> Messages { get; set; } = new List<ChatMessageDto>();
        public bool MatchedExistingConversation { get; set; }
    }
}
