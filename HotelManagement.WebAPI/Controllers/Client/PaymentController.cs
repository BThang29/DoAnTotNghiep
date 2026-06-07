using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Payments;
using DoAnWebQuanLyKhachSan.Service.Dtos.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/payment")]
    [Authorize]
    public class PaymentController : BaseController
	{
		private readonly ClientPaymentService _clientPaymentService;

		public PaymentController(ClientPaymentService clientPaymentService)
		{
			_clientPaymentService = clientPaymentService;
		}

		[HttpGet("methods")]
		[AllowAnonymous]
		public async Task<ApiResult<List<PaymentMethodDto>>> GetPaymentMethods()
		{
			return Success(await _clientPaymentService.GetPaymentMethods(), "Lay danh sach phuong thuc thanh toan thanh cong.");
		}

		[HttpGet("{id:int}")]
		public async Task<ApiResult<PaymentDetailDto>> GetPaymentById(int id)
		{
			var payment = await _clientPaymentService.GetPaymentById(id);
			if (payment == null)
			{
				return Failure<PaymentDetailDto>(404, "Khong tim thay thanh toan.");
			}

			return Success(payment, "Lay chi tiet thanh toan thanh cong.");
		}

		[HttpPost("online")]
		[AllowAnonymous]
		public async Task<ApiResult<ClientOnlinePaymentResultDto>> CreateOnlinePayment([FromBody] ClientOnlinePaymentCreateDto model)
		{
			if (!ModelState.IsValid || model.BookingId <= 0)
			{
				return Failure<ClientOnlinePaymentResultDto>(400, "Du lieu thanh toan online khong hop le.");
			}

			var currentUserId = UserIdentity?.UserId > 0 ? UserIdentity.UserId : (int?)null;
			model.BookingAccessToken ??= ResolveGuestAccessToken();
			var invoiceId = await _clientPaymentService.CreateOnlinePayment(model, currentUserId);
			if (!invoiceId.HasValue)
			{
				return Failure<ClientOnlinePaymentResultDto>(404, "Khong tim thay booking.");
			}

			if (invoiceId.Value == -2)
			{
				return Failure<ClientOnlinePaymentResultDto>(400, "Thong tin thanh toan khong hop le.");
			}

			if (invoiceId.Value == -3)
			{
				return Failure<ClientOnlinePaymentResultDto>(400, "Booking nay da co giao dich thanh toan.");
			}

			if (invoiceId.Value == -4)
			{
				return Failure<ClientOnlinePaymentResultDto>(400, "Phuong thuc thanh toan khong hop le.");
			}

			if (invoiceId.Value == -5)
			{
				return Failure<ClientOnlinePaymentResultDto>(403, "Ban khong co quyen thanh toan booking nay.");
			}

			if (invoiceId.Value == -6)
			{
				return Failure<ClientOnlinePaymentResultDto>(400, "Booking nay da bi huy, khong the thanh toan.");
			}

			var result = await _clientPaymentService.GetOnlinePaymentResult(invoiceId.Value);
			if (result == null)
			{
				return Failure<ClientOnlinePaymentResultDto>(500, "Khong the tai ket qua thanh toan.");
			}

			return Success(result, "Thanh toan online thanh cong.", 201);
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
