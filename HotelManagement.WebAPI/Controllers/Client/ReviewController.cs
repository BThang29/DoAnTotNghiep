using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews;
using DoAnWebQuanLyKhachSan.Service.Dtos.Reviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/review")]
    [Authorize]
    public class ReviewController : BaseController
	{
		private readonly ClientReviewService _clientReviewService;

		public ReviewController(ClientReviewService clientReviewService)
		{
			_clientReviewService = clientReviewService;
		}

        [HttpGet("room/{roomId:int}")]
		[AllowAnonymous]
        public async Task<ApiResult<List<ReviewGridDto>>> GetReviewsByRoom(int roomId, [FromQuery] int take = 10)
        {
            if (roomId <= 0)
            {
                return Failure<List<ReviewGridDto>>(400, "Ma phong khong hop le.");
            }

            return Success(await _clientReviewService.GetReviewsByRoom(roomId, take), "Lay review theo phong thanh cong.");
        }

		[HttpPost]
		public async Task<ApiResult<ClientReviewResultDto>> SubmitReview([FromBody] ClientReviewCreateDto model)
		{
			if (!ModelState.IsValid || model.BookingId <= 0 || model.Rating < 1m || model.Rating > 5m || string.IsNullOrWhiteSpace(model.Feedback))
			{
				return Failure<ClientReviewResultDto>(400, "Du lieu danh gia khong hop le.");
			}

			var historyId = await _clientReviewService.SubmitReview(model);
			if (!historyId.HasValue)
			{
				return Failure<ClientReviewResultDto>(404, "Khong tim thay booking.");
			}

			if (historyId.Value == -2)
			{
				return Failure<ClientReviewResultDto>(400, "Chi co the danh gia sau khi ky nghi ket thuc.");
			}

			if (historyId.Value == -3)
			{
				return Failure<ClientReviewResultDto>(403, "Thong tin xac thuc khach hang khong khop voi booking.");
			}

			var result = await _clientReviewService.GetReviewResult(historyId.Value);
			if (result == null)
			{
				return Failure<ClientReviewResultDto>(500, "Khong the tai lai noi dung danh gia.");
			}

			return Success(result, "Gui danh gia thanh cong.", 201);
		}
	}
}
