using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Payments;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/payment")]
	[Authorize]
	public class PaymentController : BaseController
	{
		private readonly PaymentService _paymentService;

		/// <summary>
		/// Khởi tạo controller quản lý thanh toán.
		/// </summary>
		public PaymentController(PaymentService paymentService)
		{
			_paymentService = paymentService;
		}

		/// <summary>
		/// Lấy danh sách thanh toán.
		/// </summary>
		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewPayment, PrivilegeList.ManagePayment)]
		public async Task<ApiResult<PagingResult<PaymentGridDto>>> GetPayments([FromQuery] PaymentGridPagingDto pagingModel)
		{
			return Success(await _paymentService.GetPayments(pagingModel), "Lay danh sach thanh toan thanh cong.");
		}

		/// <summary>
		/// Lấy chi tiết một thanh toán.
		/// </summary>
		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewPayment, PrivilegeList.ManagePayment)]
		public async Task<ApiResult<PaymentDetailDto>> GetPaymentById(int id)
		{
			var payment = await _paymentService.GetPaymentById(id);
			if (payment == null)
			{
				return Failure<PaymentDetailDto>(404, "Khong tim thay thanh toan.");
			}

			return Success(payment, "Lay chi tiet thanh toan thanh cong.");
		}

		/// <summary>
		/// Tạo mới một thanh toán.
		/// </summary>
		[HttpPost]
		[CustomAuthorize(PrivilegeList.ManagePayment)]
		public async Task<ApiResult<int>> CreatePayment([FromBody] PaymentCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Du lieu tao thanh toan khong hop le.");
			}

			var result = await _paymentService.CreatePayment(model);
			if (!result.HasValue)
			{
				return Failure<int>(400, "Phuong thuc thanh toan khong hop le.");
			}

			if (result.Value == -2)
			{
				return Failure<int>(400, "Thong tin thanh toan khong hop le voi phuong thuc da chon.");
			}

			return Success(result.Value, "Tao thanh toan thanh cong.", 201);
		}

		/// <summary>
		/// Cập nhật thông tin thanh toán.
		/// </summary>
		[HttpPut("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManagePayment)]
		public async Task<ApiResult<bool>> UpdatePayment(int id, [FromBody] PaymentUpdateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Du lieu cap nhat thanh toan khong hop le.");
			}

			var updated = await _paymentService.UpdatePayment(id, model);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay thanh toan.");
			}

			if (!updated.Value)
			{
				return Failure<bool>(400, "Thong tin thanh toan khong hop le.");
			}

			return Success(true, "Cap nhat thanh toan thanh cong.");
		}

		/// <summary>
		/// Xóa một thanh toán.
		/// </summary>
		[HttpDelete("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManagePayment)]
		public async Task<ApiResult<int>> DeletePayment(int id)
		{
			var deletedId = await _paymentService.DeletePayment(id);
			if (!deletedId.HasValue)
			{
				return Failure<int>(404, "Khong tim thay thanh toan.");
			}

			if (deletedId.Value == -2)
			{
				return Failure<int>(400, "Khong the xoa thanh toan da duoc gan vao hoa don.");
			}

			return Success(deletedId.Value, "Xoa thanh toan thanh cong.");
		}

		/// <summary>
		/// Lấy danh sách phương thức thanh toán.
		/// </summary>
		[HttpGet("methods")]
		[CustomAuthorize(PrivilegeList.ViewPayment, PrivilegeList.ManagePayment)]
		public async Task<ApiResult<List<PaymentMethodDto>>> GetPaymentMethods()
		{
			return Success(await _paymentService.GetPaymentMethods(), "Lay danh sach phuong thuc thanh toan thanh cong.");
		}

		/// <summary>
		/// Lấy dữ liệu QR Code cho thanh toán chuyển khoản hoặc QR.
		/// </summary>
		[HttpGet("{id:int}/qr")]
		[CustomAuthorize(PrivilegeList.ViewPayment, PrivilegeList.ManagePayment)]
		public async Task<ApiResult<PaymentQrDto>> GetPaymentQr(int id)
		{
			var qr = await _paymentService.GetPaymentQr(id);
			if (qr == null)
			{
				return Failure<PaymentQrDto>(404, "Khong tim thay thanh toan.");
			}

			return Success(qr, "Lay du lieu QR thanh cong.");
		}
	}
}
