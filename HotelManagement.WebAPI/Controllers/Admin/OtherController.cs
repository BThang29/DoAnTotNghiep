using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Others;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/other")]
	[Authorize]
	public class OtherController : BaseController
	{
		private readonly OtherService _otherService;

		/// <summary>
		/// Khởi tạo controller quản lý các danh mục khác.
		/// </summary>
		public OtherController(OtherService otherService)
		{
			_otherService = otherService;
		}

		/// <summary>
		/// Lấy danh sách dịch vụ khách sạn.
		/// </summary>
		[HttpGet("services")]
		[CustomAuthorize(PrivilegeList.ViewService, PrivilegeList.ManageService)]
		public async Task<ApiResult<PagingResult<ServiceGridDto>>> GetServices([FromQuery] ServiceGridPagingDto pagingModel)
		{
			return Success(await _otherService.GetServices(pagingModel), "Lay danh sach dich vu thanh cong.");
		}

		/// <summary>
		/// Lấy chi tiết một dịch vụ khách sạn.
		/// </summary>
		[HttpGet("services/{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewService, PrivilegeList.ManageService)]
		public async Task<ApiResult<ServiceDetailDto>> GetServiceById(int id)
		{
			var service = await _otherService.GetServiceById(id);
			if (service == null)
			{
				return Failure<ServiceDetailDto>(404, "Khong tim thay dich vu.");
			}

			return Success(service, "Lay chi tiet dich vu thanh cong.");
		}

		/// <summary>
		/// Tạo mới một dịch vụ khách sạn.
		/// </summary>
		[HttpPost("services")]
		[CustomAuthorize(PrivilegeList.ManageService)]
		public async Task<ApiResult<int>> CreateService([FromBody] ServiceCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Du lieu tao dich vu khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.NameService))
			{
				return Failure<int>(400, "Ten dich vu khong duoc de trong.");
			}

			var serviceId = await _otherService.CreateService(model);
			if (!serviceId.HasValue)
			{
				return Failure<int>(400, "Loai dich vu khong hop le.");
			}

			return Success(serviceId.Value, "Tao dich vu thanh cong.", 201);
		}

		/// <summary>
		/// Cập nhật thông tin một dịch vụ khách sạn.
		/// </summary>
		[HttpPut("services/{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageService)]
		public async Task<ApiResult<bool>> UpdateService(int id, [FromBody] ServiceUpdateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Du lieu cap nhat dich vu khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.NameService))
			{
				return Failure<bool>(400, "Ten dich vu khong duoc de trong.");
			}

			var updated = await _otherService.UpdateService(id, model);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay dich vu.");
			}

			if (!updated.Value)
			{
				return Failure<bool>(400, "Loai dich vu khong hop le.");
			}

			return Success(true, "Cap nhat dich vu thanh cong.");
		}

		/// <summary>
		/// Xóa một dịch vụ khách sạn.
		/// </summary>
		[HttpDelete("services/{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageService)]
		public async Task<ApiResult<int>> DeleteService(int id)
		{
			var deletedId = await _otherService.DeleteService(id);
			if (!deletedId.HasValue)
			{
				return Failure<int>(404, "Khong tim thay dich vu.");
			}

			if (deletedId.Value == -2)
			{
				return Failure<int>(400, "Khong the xoa dich vu da phat sinh ton kho hoac hoa don.");
			}

			return Success(deletedId.Value, "Xoa dich vu thanh cong.");
		}

		/// <summary>
		/// Lấy danh sách loại dịch vụ mặc định như ăn uống, giặt là, spa, minibar.
		/// </summary>
		[HttpGet("service-types")]
		[CustomAuthorize(PrivilegeList.ViewService, PrivilegeList.ManageService)]
		public async Task<ApiResult<List<ServiceTypeDto>>> GetServiceTypes()
		{
			return Success(await _otherService.GetServiceTypes(), "Lay danh sach loai dich vu thanh cong.");
		}
	}
}
