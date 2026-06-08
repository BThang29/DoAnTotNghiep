using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/booking")]
    [Authorize]
    public class BookingController : BaseController
	{
		private readonly ClientBookingService _clientBookingService;

		public BookingController(ClientBookingService clientBookingService)
		{
			_clientBookingService = clientBookingService;
		}

		[HttpGet("{id:int}")]
		[AllowAnonymous]
		public async Task<ApiResult<ClientBookingDetailDto>> GetBookingById(int id)
		{
			var booking = await _clientBookingService.GetBookingById(id);
			if (booking == null)
			{
				return Failure<ClientBookingDetailDto>(404, "Khong tim thay dat phong.");
			}

			var currentUserId = UserIdentity?.UserId > 0 ? UserIdentity.UserId : (int?)null;
			var guestAccessToken = ResolveGuestAccessToken();
			var canAccess = await _clientBookingService.CanAccessBooking(id, currentUserId, guestAccessToken);
			if (!canAccess)
			{
				return Failure<ClientBookingDetailDto>(403, "Ban khong co quyen truy cap booking nay.");
			}

			return Success(booking, "Lay chi tiet dat phong thanh cong.");
		}

		[HttpPost("{id:int}/cancel-payment-timeout")]
		[AllowAnonymous]
		public async Task<ApiResult<bool>> CancelPaymentTimeout(int id)
		{
			var currentUserId = UserIdentity?.UserId > 0 ? UserIdentity.UserId : (int?)null;
			var guestAccessToken = ResolveGuestAccessToken();
			var result = await _clientBookingService.CancelPendingBooking(id, currentUserId, guestAccessToken);
			if (result == -1)
			{
				return Failure<bool>(404, "Khong tim thay dat phong.");
			}

			if (result == -5)
			{
				return Failure<bool>(403, "Ban khong co quyen thao tac booking nay.");
			}

			if (result == -6)
			{
				return Failure<bool>(400, "Booking nay da bi huy truoc do.");
			}

			if (result == -2)
			{
				return Failure<bool>(400, "Dat phong da co giao dich thanh toan, khong the huy tu dong.");
			}

			if (result == -3)
			{
				return Failure<bool>(400, "Dat phong van trong thoi gian giu cho, chua the huy tu dong.");
			}

			return Success(true, "Dat phong da bi huy do qua thoi gian thanh toan.");
		}

		[HttpPost("{id:int}/cancel")]
		[AllowAnonymous]
		public async Task<ApiResult<bool>> CancelBooking(int id)
		{
			var currentUserId = UserIdentity?.UserId > 0 ? UserIdentity.UserId : (int?)null;
			var guestAccessToken = ResolveGuestAccessToken();
			var result = await _clientBookingService.CancelPendingBooking(id, currentUserId, guestAccessToken, true);
			if (result == -1)
			{
				return Failure<bool>(404, "Khong tim thay dat phong.");
			}

			if (result == -5)
			{
				return Failure<bool>(403, "Ban khong co quyen thao tac booking nay.");
			}

			if (result == -6)
			{
				return Failure<bool>(400, "Booking nay da bi huy truoc do.");
			}

			if (result == -2)
			{
				return Failure<bool>(400, "Dat phong da co giao dich thanh toan, khong the huy.");
			}

			return Success(true, "Dat phong da duoc huy.");
		}

		[HttpPost]
		public async Task<ApiResult<ClientBookingResultDto>> CreateBooking([FromBody] ClientBookingCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<ClientBookingResultDto>(400, "Du lieu dat phong khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.FullName))
			{
				return Failure<ClientBookingResultDto>(400, "Ten khach hang khong duoc de trong.");
			}

			if (model.RoomId <= 0)
			{
				return Failure<ClientBookingResultDto>(400, "Phong khong hop le.");
			}

			if (model.DateStart.Date < DateTime.Today)
			{
				return Failure<ClientBookingResultDto>(400, "Ngay nhan phong khong duoc nho hon ngay hien tai.");
			}

			if (model.DateEnd.Date < model.DateStart.Date)
			{
				return Failure<ClientBookingResultDto>(400, "Ngay tra phong phai lon hon hoac bang ngay nhan phong.");
			}

			var currentUserId = UserIdentity?.UserId > 0 ? UserIdentity.UserId : (int?)null;
			if (!currentUserId.HasValue)
			{
				return Failure<ClientBookingResultDto>(401, "Vui long dang nhap de tao dat phong.");
			}

			var bookingId = await _clientBookingService.CreateBooking(model, currentUserId);
			if (!bookingId.HasValue)
			{
				return Failure<ClientBookingResultDto>(500, "Khong the tao dat phong.");
			}

			if (bookingId.Value == -2)
			{
				return Failure<ClientBookingResultDto>(404, "Khong tim thay phong.");
			}

			if (bookingId.Value == -3)
			{
				return Failure<ClientBookingResultDto>(400, "Voucher khong hop le hoac het han.");
			}

			if (bookingId.Value == -4)
			{
				return Failure<ClientBookingResultDto>(400, "Phong da duoc dat trong khoang thoi gian nay.");
			}

			var result = await _clientBookingService.GetBookingResult(bookingId.Value);
			if (result == null)
			{
				return Failure<ClientBookingResultDto>(500, "Khong the tai du lieu dat phong sau khi tao.");
			}

			return Success(result, "Dat phong online thanh cong.", 201);
		}

		private string? ResolveGuestAccessToken()
		{
			if (Request.Headers.TryGetValue("X-Booking-Access-Token", out var headerValue))
			{
				var token = headerValue.FirstOrDefault();
				if (!string.IsNullOrWhiteSpace(token))
				{
					return token.Trim();
				}
			}

			var queryToken = Request.Query["accessToken"].FirstOrDefault();
			return string.IsNullOrWhiteSpace(queryToken) ? null : queryToken.Trim();
		}
	}
}
