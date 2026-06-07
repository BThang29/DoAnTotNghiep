using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.API.HubConfig;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Chat;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/chat")]
    public class ChatController : BaseController
    {
        private readonly ChatService _chatService;
        private readonly IHubContext<MessageHub> _hubContext;

        public ChatController(ChatService chatService, IHubContext<MessageHub> hubContext)
        {
            _chatService = chatService;
            _hubContext = hubContext;
        }

        [HttpGet("context")]
        public async Task<ApiResult<ChatClientContextDto>> GetContext()
        {
            var context = await _chatService.GetClientContextAsync(ResolveUserId(), ResolveGuestToken());
            if (context == null)
            {
                return Failure<ChatClientContextDto>(404, "Khong tim thay thong tin hoi thoai.");
            }

            return Success(context, "Lay thong tin hoi thoai thanh cong.");
        }

        [HttpGet("messages")]
        public async Task<ApiResult<List<ChatMessageDto>>> GetMessages()
        {
            return Success(await _chatService.GetClientMessagesAsync(ResolveUserId(), ResolveGuestToken()), "Lay lich su chat thanh cong.");
        }

        [HttpPost("guest/bootstrap")]
        public async Task<ApiResult<ChatConversationBootstrapDto>> ResolveGuestConversation([FromBody] ChatGuestConversationResolveDto model)
        {
            if (ResolveUserId().HasValue)
            {
                return Failure<ChatConversationBootstrapDto>(400, "Nguoi dung da dang nhap khong can khoi tao hoi thoai guest.");
            }

            var guestToken = ResolveGuestToken();
            if (string.IsNullOrWhiteSpace(guestToken))
            {
                return Failure<ChatConversationBootstrapDto>(400, "Khong tim thay guestToken de khoi tao hoi thoai.");
            }

            var result = await _chatService.ResolveGuestConversationAsync(guestToken, model);
            if (result == null)
            {
                return Failure<ChatConversationBootstrapDto>(400, "Thong tin guest khong hop le hoac khong the khoi tao hoi thoai.");
            }

            var thread = await _chatService.GetAdminThreadByConversationKeyAsync(result.Context.ConversationKey);
            if (thread != null)
            {
                await _hubContext.Clients.Group("admins").SendAsync("ChatThreadUpdated", thread);
            }

            return Success(result, result.MatchedExistingConversation
                ? "Da tim thay hoi thoai cu va nap lai lich su chat."
                : "Da tao hoi thoai moi cho khach vang lai.");
        }

        [HttpPost("send")]
        public async Task<ApiResult<ChatMessageDto>> Send([FromBody] ChatSendMessageDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Content))
            {
                return Failure<ChatMessageDto>(400, "Noi dung tin nhan khong duoc de trong.");
            }

            var message = await _chatService.SendCustomerMessageAsync(ResolveUserId(), ResolveGuestToken(), model.Content);
            if (message == null)
            {
                return Failure<ChatMessageDto>(404, "Khong the tao hoi thoai chat.");
            }

            return Success(message, "Gui tin nhan thanh cong.", 201);
        }

        [HttpPut("guest-profile")]
        public async Task<ApiResult<ChatClientContextDto>> UpdateGuestProfile([FromBody] ChatGuestProfileDto model)
        {
            var guestToken = ResolveGuestToken();
            if (string.IsNullOrWhiteSpace(guestToken))
            {
                return Failure<ChatClientContextDto>(400, "Khong tim thay guestToken de cap nhat thong tin.");
            }

            var context = await _chatService.UpdateGuestProfileAsync(guestToken, model);
            if (context == null)
            {
                return Failure<ChatClientContextDto>(404, "Khong tim thay hoi thoai guest.");
            }

            return Success(context, "Cap nhat thong tin guest thanh cong.");
        }

        [HttpPost("request-verification")]
        public async Task<ApiResult<bool>> RequestGuestEmailVerification([FromBody] ChatVerificationRequestDto model)
        {
            var guestToken = ResolveGuestToken();
            if (string.IsNullOrWhiteSpace(guestToken))
            {
                return Failure<bool>(400, "Khong tim thay guestToken de xac minh.");
            }

            var success = await _chatService.RequestGuestEmailVerificationAsync(guestToken, model.Email);
            if (!success)
            {
                return Failure<bool>(400, "Khong the gui ma xac minh email.");
            }

            return Success(true, "Da gui ma xac minh email.");
        }

        [HttpPost("verify-email")]
        public async Task<ApiResult<ChatClientContextDto>> VerifyGuestEmail([FromBody] ChatVerificationConfirmDto model)
        {
            var guestToken = ResolveGuestToken();
            if (string.IsNullOrWhiteSpace(guestToken))
            {
                return Failure<ChatClientContextDto>(400, "Khong tim thay guestToken de xac minh.");
            }

            var context = await _chatService.ConfirmGuestEmailVerificationAsync(guestToken, model.Code);
            if (context == null)
            {
                return Failure<ChatClientContextDto>(400, "Ma xac minh khong hop le hoac da het han.");
            }

            return Success(context, "Xac minh email thanh cong.");
        }

        [HttpPut("seen")]
        public async Task<ApiResult<bool>> MarkAdminMessagesAsSeen()
        {
            await _chatService.MarkAdminMessagesAsSeenByCustomerAsync(ResolveUserId(), ResolveGuestToken());
            return Success(true, "Cap nhat trang thai xem thanh cong.");
        }

        private int? ResolveUserId()
        {
            return User?.Identity?.IsAuthenticated == true ? UserIdentity.UserId : null;
        }

        private string? ResolveGuestToken()
        {
            return Request.Headers["X-Guest-Token"].FirstOrDefault()
                ?? Request.Query["guestToken"].FirstOrDefault();
        }
    }
}
