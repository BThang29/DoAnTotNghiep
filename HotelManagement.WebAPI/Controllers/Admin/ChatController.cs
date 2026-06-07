using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
    [Route("api/admin/chat")]
    [Authorize]
    public class ChatController : BaseController
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("threads")]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<List<ChatThreadDto>>> GetThreads([FromQuery] string? keyword)
        {
            return Success(await _chatService.GetAdminThreadsAsync(keyword), "Lay danh sach hoi thoai thanh cong.");
        }

        [HttpGet("messages")]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<List<ChatMessageDto>>> GetMessages([FromQuery] string conversationKey)
        {
            return Success(await _chatService.GetAdminMessagesAsync(conversationKey), "Lay lich su chat thanh cong.");
        }

        [HttpPost("send")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<ChatMessageDto>> Send([FromBody] ChatSendMessageDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Content))
            {
                return Failure<ChatMessageDto>(400, "Noi dung tin nhan khong duoc de trong.");
            }

            if (string.IsNullOrWhiteSpace(model.ConversationKey))
            {
                return Failure<ChatMessageDto>(400, "Can cung cap conversationKey de gui tin nhan.");
            }

            var message = await _chatService.SendAdminMessageAsync(UserIdentity.UserId, model.ConversationKey, model.Content);
            if (message == null)
            {
                return Failure<ChatMessageDto>(404, "Khong tim thay hoi thoai de gui tin nhan.");
            }

            return Success(message, "Gui tin nhan thanh cong.", 201);
        }

        [HttpPut("seen")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<bool>> MarkCustomerMessagesAsSeen([FromQuery] string conversationKey)
        {
            await _chatService.MarkCustomerMessagesAsSeenByAdminAsync(conversationKey);
            return Success(true, "Cap nhat trang thai xem thanh cong.");
        }
    }
}
