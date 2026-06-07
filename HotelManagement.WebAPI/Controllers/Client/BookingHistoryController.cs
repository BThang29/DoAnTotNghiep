using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.BookingHistories;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/booking-history")]
    [Authorize]
    public class BookingHistoryController : BaseController
	{
		private readonly ClientBookingHistoryService _clientBookingHistoryService;

		public BookingHistoryController(ClientBookingHistoryService clientBookingHistoryService)
		{
			_clientBookingHistoryService = clientBookingHistoryService;
		}

		[HttpGet]
		public async Task<ApiResult<PagingResult<ClientBookingHistoryDto>>> GetBookingHistories([FromQuery] ClientBookingHistoryPagingDto query)
		{
			if ((!query.UserId.HasValue || query.UserId.Value <= 0) && UserIdentity?.UserId > 0)
			{
				query.UserId = UserIdentity.UserId;
			}

			if (!query.UserId.HasValue || query.UserId.Value <= 0)
			{
				return Failure<PagingResult<ClientBookingHistoryDto>>(400, "Can cung cap userId de xem lich su booking.");
			}

			return Success(await _clientBookingHistoryService.GetBookingHistories(query), "Lay lich su booking thanh cong.");
		}
	}
}
