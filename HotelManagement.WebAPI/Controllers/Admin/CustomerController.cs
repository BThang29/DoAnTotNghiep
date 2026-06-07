using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Customers;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/customer")]
	[Authorize]
	public class CustomerController : BaseController
	{
		private readonly CustomerService _customerService;

		/// <summary>
		/// Khởi tạo controller quản lý khách hàng.
		/// </summary>
		public CustomerController(CustomerService customerService)
		{
			_customerService = customerService;
		}

		/// <summary>
		/// Lấy danh sách khách hàng theo bộ lọc phân trang.
		/// </summary>
		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<PagingResult<CustomerGridDto>>> GetCustomers([FromQuery] CustomerGridPagingDto pagingModel)
		{
			return Success(await _customerService.GetCustomers(pagingModel), "Lấy danh sách khách hàng thành công.");
		}

		/// <summary>
		/// Lấy thông tin chi tiết của một khách hàng.
		/// </summary>
		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<CustomerDetailDto>> GetCustomerById(int id)
		{
			var customer = await _customerService.GetCustomerById(id);
			if (customer == null)
			{
				return Failure<CustomerDetailDto>(404, "Không tìm thấy khách hàng.");
			}

			return Success(customer, "Lấy thông tin khách hàng thành công.");
		}

		/// <summary>
		/// Tạo mới một khách hàng.
		/// </summary>
		[HttpPost]
		[CustomAuthorize(PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<int>> CreateCustomer([FromBody] CustomerCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Dữ liệu tạo khách hàng không hợp lệ.");
			}

			if (string.IsNullOrWhiteSpace(model.FullName))
			{
				return Failure<int>(400, "Tên khách hàng không được để trống.");
			}

			var customerId = await _customerService.CreateCustomer(model);
			if (!customerId.HasValue)
			{
				return Failure<int>(400, "Loại khách hàng không hợp lệ.");
			}

			return Success(customerId.Value, "Tạo khách hàng thành công.", 201);
		}

		/// <summary>
		/// Cập nhật thông tin khách hàng theo id.
		/// </summary>
		[HttpPut("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<bool>> UpdateCustomer(int id, [FromBody] CustomerUpdateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Dữ liệu cập nhập khách hàng không hợp lệ.");
			}

			if (string.IsNullOrWhiteSpace(model.FullName))
			{
				return Failure<bool>(400, "Tên khách hàng không được để trống.");
			}

			var updated = await _customerService.UpdateCustomer(id, model);
			if (updated == -1)
			{
				return Failure<bool>(404, "Không tìm thấy tên khách hàng.");
			}

			if (updated == -2)
			{
				return Failure<bool>(400, "Loại khách hàng không hợp lệ.");
			}

			return Success(true, "Cập nhập khách hàng thành công.");
		}

		/// <summary>
		/// Cập nhật phân loại khách hàng VIP hoặc thường.
		/// </summary>
		[HttpPut("{id:int}/type")]
		[CustomAuthorize(PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<bool>> UpdateCustomerType(int id, [FromBody] CustomerTypeUpdateDto model)
		{
			var updated = await _customerService.UpdateCustomerType(id, model.CustomerTypeId);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Không tìm thấy khách hàng.");
			}

			if (!updated.Value)
			{
				return Failure<bool>(400, "Loại khách hàng không hợp lệ.");
			}

			return Success(true, "Cập nhập loại khách hàng thành công.");
		}

		/// <summary>
		/// Xóa một khách hàng theo id.
		/// </summary>
		[HttpDelete("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<int>> DeleteCustomer(int id)
		{
			var deletedId = await _customerService.DeleteCustomer(id);
			if (!deletedId.HasValue)
			{
				return Failure<int>(404, "Không tìm thấy khách hàng.");
			}

			return Success(deletedId.Value, "Xóa khách hàng không thành công.");
		}

		/// <summary>
		/// Lấy danh sách loại khách hàng để phục vụ phân loại.
		/// </summary>
		[HttpGet("types")]
		[CustomAuthorize(PrivilegeList.ViewCustomer, PrivilegeList.ManageCustomer)]
		public async Task<ApiResult<List<CustomerTypeDto>>> GetCustomerTypes()
		{
			return Success(await _customerService.GetCustomerTypes(), "Lấy danh sách loại khách hàng không thành công.");
		}
	}
}
