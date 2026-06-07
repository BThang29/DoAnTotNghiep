using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Invoices;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/invoice")]
	[Authorize]
	public class InvoiceController : BaseController
	{
		private readonly InvoiceService _invoiceService;

		/// <summary>
		/// Khởi tạo controller quản lý hóa đơn.
		/// </summary>
		public InvoiceController(InvoiceService invoiceService)
		{
			_invoiceService = invoiceService;
		}

		/// <summary>
		/// Lấy danh sách hóa đơn.
		/// </summary>
		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewInvoice, PrivilegeList.ManageInvoice, PrivilegeList.CreateInvoice)]
		public async Task<ApiResult<PagingResult<InvoiceGridDto>>> GetInvoices([FromQuery] InvoiceGridPagingDto pagingModel)
		{
			return Success(await _invoiceService.GetInvoices(pagingModel), "Lay danh sach hoa don thanh cong.");
		}

		/// <summary>
		/// Lấy chi tiết một hóa đơn.
		/// </summary>
		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewInvoice, PrivilegeList.ManageInvoice, PrivilegeList.CreateInvoice)]
		public async Task<ApiResult<InvoiceDetailDto>> GetInvoiceById(int id)
		{
			var invoice = await _invoiceService.GetInvoiceById(id);
			if (invoice == null)
			{
				return Failure<InvoiceDetailDto>(404, "Khong tim thay hoa don.");
			}

			return Success(invoice, "Lay chi tiet hoa don thanh cong.");
		}

		/// <summary>
		/// Tính tiền phòng và dịch vụ trước khi lập hóa đơn.
		/// </summary>
		[HttpPost("calculate")]
		[CustomAuthorize(PrivilegeList.ViewInvoice, PrivilegeList.ManageInvoice, PrivilegeList.CreateInvoice)]
		public async Task<ApiResult<InvoiceCalculationDto>> CalculateInvoice([FromBody] InvoiceCreateDto model)
		{
			if (!ModelState.IsValid || model.BookingId <= 0)
			{
				return Failure<InvoiceCalculationDto>(400, "Du lieu tinh hoa don khong hop le.");
			}

			var result = await _invoiceService.CalculateInvoice(model);
			if (result == null)
			{
				return Failure<InvoiceCalculationDto>(404, "Khong tim thay booking, phong hoac dich vu.");
			}

			return Success(result, "Tinh hoa don thanh cong.");
		}

		/// <summary>
		/// Tạo mới hóa đơn cho booking.
		/// </summary>
		[HttpPost]
		[CustomAuthorize(PrivilegeList.CreateInvoice, PrivilegeList.ManageInvoice)]
		public async Task<ApiResult<int>> CreateInvoice([FromBody] InvoiceCreateDto model)
		{
			if (!ModelState.IsValid || model.BookingId <= 0)
			{
				return Failure<int>(400, "Du lieu tao hoa don khong hop le.");
			}

			var result = await _invoiceService.CreateInvoice(model);
			if (!result.HasValue)
			{
				return Failure<int>(404, "Khong tim thay booking.");
			}

			if (result.Value == -2)
			{
				return Failure<int>(400, "Danh sach dich vu khong hop le.");
			}

			if (result.Value == -3)
			{
				return Failure<int>(400, "Voucher dich vu khong hop le.");
			}

			return Success(result.Value, "Tao hoa don thanh cong.", 201);
		}

		/// <summary>
		/// Lấy dữ liệu in hóa đơn.
		/// </summary>
		[HttpGet("{id:int}/print")]
		[CustomAuthorize(PrivilegeList.ViewInvoice, PrivilegeList.ManageInvoice, PrivilegeList.CreateInvoice)]
		public async Task<ApiResult<InvoiceDetailDto>> PrintInvoice(int id)
		{
			var invoice = await _invoiceService.GetPrintableInvoice(id);
			if (invoice == null)
			{
				return Failure<InvoiceDetailDto>(404, "Khong tim thay hoa don.");
			}

			return Success(invoice, "Lay du lieu in hoa don thanh cong.");
		}

		/// <summary>
		/// Xoa hoa don va du lieu lien quan.
		/// </summary>
		[HttpDelete("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageInvoice)]
		public async Task<ApiResult<bool>> DeleteInvoice(int id)
		{
			var deleted = await _invoiceService.DeleteInvoice(id);
			if (!deleted.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay hoa don.");
			}

			return Success(true, "Xoa hoa don thanh cong.");
		}
	}
}
