using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Messages;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
    [Route("api/admin/message")]
    [Authorize]
    public class MessageController : BaseController
    {
        private readonly MessageService _messageService;

        public MessageController(MessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<PagingResult<MessageGridDto>>> GetMessages([FromQuery] MessageGridPagingDto pagingModel)
        {
            return Success(await _messageService.GetMessages(pagingModel), "Lay danh sach tin nhan thanh cong.");
        }

        [HttpGet("{id:int}")]
        [CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<MessageDetailDto>> GetMessageById(int id)
        {
            var message = await _messageService.GetMessageById(id);
            if (message == null)
            {
                return Failure<MessageDetailDto>(404, "Khong tim thay tin nhan.");
            }

            return Success(message, "Lay chi tiet tin nhan thanh cong.");
        }

        [HttpPost]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<int>> CreateMessage([FromBody] MessageCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return Failure<int>(400, "Du lieu tao tin nhan khong hop le.");
            }

            if (string.IsNullOrWhiteSpace(model.CustomerName))
            {
                return Failure<int>(400, "Ten khach hang khong duoc de trong.");
            }

            if (model.ConversationId.GetValueOrDefault() <= 0
                && model.CustomerId.GetValueOrDefault() <= 0
                && string.IsNullOrWhiteSpace(model.GuestToken)
                && string.IsNullOrWhiteSpace(model.ConversationKey))
            {
                return Failure<int>(400, "Can cung cap ConversationId, CustomerId hoac GuestToken de xac dinh hoi thoai.");
            }

            if (string.IsNullOrWhiteSpace(model.Content))
            {
                return Failure<int>(400, "Noi dung tin nhan khong duoc de trong.");
            }

            var messageId = await _messageService.CreateMessage(model);
            return Success(messageId, "Tao tin nhan thanh cong.", 201);
        }

        [HttpPut("{id:int}")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<bool>> UpdateMessage(int id, [FromBody] MessageUpdateDto model)
        {
            if (!ModelState.IsValid)
            {
                return Failure<bool>(400, "Du lieu cap nhat tin nhan khong hop le.");
            }

            if (string.IsNullOrWhiteSpace(model.CustomerName))
            {
                return Failure<bool>(400, "Ten khach hang khong duoc de trong.");
            }

            if (model.CustomerId.GetValueOrDefault() <= 0 && string.IsNullOrWhiteSpace(model.GuestToken))
            {
                return Failure<bool>(400, "Can cung cap CustomerId hoac GuestToken de xac dinh hoi thoai.");
            }

            if (string.IsNullOrWhiteSpace(model.Content))
            {
                return Failure<bool>(400, "Noi dung tin nhan khong duoc de trong.");
            }

            var success = await _messageService.UpdateMessage(id, model);
            if (!success)
            {
                return Failure<bool>(404, "Khong tim thay tin nhan.");
            }

            return Success(true, "Cap nhat tin nhan thanh cong.");
        }

        [HttpPut("{id:int}/seen")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<bool>> UpdateSeenStatus(int id, [FromBody] MessageSeenUpdateDto model)
        {
            var success = await _messageService.UpdateSeenStatus(id, model.Seen);
            if (!success)
            {
                return Failure<bool>(404, "Khong tim thay tin nhan.");
            }

            return Success(true, "Cap nhat trang thai xem thanh cong.");
        }

        [HttpDelete("{id:int}")]
        [CustomAuthorize(PrivilegeList.ManageCustomer)]
        public async Task<ApiResult<int>> DeleteMessage(int id)
        {
            var deletedId = await _messageService.DeleteMessage(id);
            if (!deletedId.HasValue)
            {
                return Failure<int>(404, "Khong tim thay tin nhan.");
            }

            return Success(deletedId.Value, "Xoa tin nhan thanh cong.");
        }
    }
}
