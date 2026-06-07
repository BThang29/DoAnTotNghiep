using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoAnWebQuanLyKhachSan.Utils.Service;
using DoAnWebQuanLyKhachSan.Data.Entities;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/employee")]
	[Authorize]
	public class EmployeeController : BaseController
	{
		private readonly AuthorizationService _authorizationService;

		public EmployeeController(AuthorizationService authorizationService)
		{
			_authorizationService = authorizationService;
		}

		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewEmployee)]
		public async Task<ApiResult<PagingResult<UserGridDto>>> GetEmployees([FromQuery] UserGridPagingDto pagingModel)
		{
			return Success(await _authorizationService.GetEmployees(pagingModel), "Lay danh sach nhan vien thanh cong.");
		}

		[HttpPut("{id:int}/activate")]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<bool>> ActivateEmployee(int id)
		{
			if (!UserIdentity.IsAdministrator)
			{
				return Failure<bool>(403, "Chi quan tri vien cap cao nhat moi duoc kich hoat tai khoan.");
			}

			if (id <= 0)
			{
				return Failure<bool>(400, "Tai khoan khong hop le.");
			}

			var isSuccess = await _authorizationService.ActivateUser(id);
			if (!isSuccess)
			{
				return Failure<bool>(404, "Khong tim thay tai khoan can kich hoat.");
			}

			return Success(true, "Kich hoat tai khoan thanh cong.");
		}

		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewEmployee)]
		public async Task<ApiResult<UserDetailDto>> GetEmployeeById(int id)
		{
			var employee = await _authorizationService.GetEmployeeById(id);
			if (employee == null)
			{
				return Failure<UserDetailDto>(404, "Khong tim thay nhan vien.");
			}

			return Success(employee, "Lay thong tin nhan vien thanh cong.");
		}

		[HttpPost]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<int>> CreateEmployee([FromBody] UserCreateDto newEmployee)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Dữ liệu đầu vào không hợp lệ.");
			}

			var result = await _authorizationService.CreateEmployee(newEmployee);
			if (result == -2)
			{
				return Failure<int>(400, "Nhân viên phải có ít nhất 1 vai trò.");
			}

			if (result == -3)
			{
				return Failure<int>(400, "Danh sách vai trò nhân viên không hợp lệ.");
			}

			return Success(result, "Tạo nhân viên thành công.", 201);
		}

		[HttpPut("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<bool>> UpdateEmployee(int id, [FromBody] UserUpdateDto editedEmployee)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Dữ liệu nhân viên cập nhập không đúng.");
			}

			var result = await _authorizationService.UpdateEmployee(id, editedEmployee);
			if (result == -1)
			{
				return Failure<bool>(404, "Không tìm thấy nhân viên.");
			}

			if (result == -2)
			{
				return Failure<bool>(400, "Nhân viên phải có ít nhất 1 vai trò.");
			}

			if (result == -3)
			{
				return Failure<bool>(400, "Danh sách vai trò nhân viên không hợp lệ.");
			}

			return Success(true, "Cập nhập nhân viên thành công.");
		}

		[HttpPut("{id:int}/image")]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<bool>> UpdateEmployeeImage(int id, [FromBody] ImageUpdateDto model)
		{
			var result = await _authorizationService.UpdateEmployeeImage(id, model);
			if (result == -1)
			{
				return Failure<bool>(404, "Không tìm thấy nhân viên.");
			}

			if (result == -2)
			{
				return Failure<bool>(400, "Ảnh đại diện không được để trống.");
			}

			return Success(true, "Cập nhập ảnh đại diện thành công.");
		}

		[HttpDelete("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<int>> DeleteEmployee(int id)
		{
			var result = await _authorizationService.DeleteEmployee(id, UserIdentity.UserId);
			if (result == -2)
			{
				return Failure<int>(400, "Không thể tự xóa từ tài khoản đăng nhập.");
			}

			if (result == -1)
			{
				return Failure<int>(404, "Không tìm thấy nhân viên.");
			}

			return Success(result, "Xóa nhân viên thành công.");
		}

		[HttpDelete]
		[CustomAuthorize(PrivilegeList.ManageEmployee)]
		public async Task<ApiResult<int>> DeleteEmployees([FromBody] int[] ids)
		{
			var result = await _authorizationService.DeleteEmployees(ids, UserIdentity.UserId);
			if (result == -2)
			{
				return Failure<int>(400, "Danh sách nhân viên cần xóa không được để trống.");
			}

			if (result == -3)
			{
				return Failure<int>(400, "Không thể tự xóa từ tài khoản đăng nhập.");
			}

			if (result == -1)
			{
				return Failure<int>(404, "Có nhân viên không tồn tại.");
			}

			return Success(result, "Xóa danh sách nhân viên thành công.");
		}
	}
}
