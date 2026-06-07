using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.RolePrivilege;
using DocumentFormat.OpenXml.Office2010.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/role")]
	[Authorize]
	public class RoleController : BaseController
	{
		private readonly AuthorizationService _authorizationService;

		/// <summary>
		/// Khởi tạo controller và inject service xử lý phân quyền.
		/// </summary>
		public RoleController(AuthorizationService authorizationService)
		{
			_authorizationService = authorizationService;
		}

		/// <summary>
		/// Lấy danh sách role theo điều kiện phân trang và tìm kiếm.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ViewRole, PrivilegeList.ManageRole)]
		[HttpGet("getlistroles")]
		public async Task<IActionResult> GetListRoles([FromQuery] RoleGridPagingDto pagingModel)
		{
			return Ok(await _authorizationService.GetRoles(pagingModel));
		}

		/// <summary>
		/// Lấy danh sách quyền đang được gán cho một role.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ViewRole, PrivilegeList.ManageRole)]
		[HttpGet("{id}/privileges")]
		public async Task<IActionResult> GetRolePrivieleges(int id)
		{
			return Ok(await _authorizationService.GetRolePrivileges(id));
		}

		/// <summary>
		/// Lưu lại danh sách quyền cho role được chỉ định.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ManageRole)]
		[HttpPut("{id}/saveroles")]
		public async Task<ApiResult<int>> SaveRolePrivileges(int id, RolePrivilegeUpdateDto dto)
		{
			try
			{
				await _authorizationService.SaveRolePrivileges(id, dto.privileges);
				return Success(id, "Phân quyền thành công");
			}
			catch (FormatException ex)
			{
				return Failure<int>(400, "Phân quyền thất bại");
			}
		}

		/// <summary>
		/// Lấy thông tin chi tiết của một role theo id.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ViewRole, PrivilegeList.ManageRole)]
		[HttpGet("{id}")]
		public async Task<ApiResult<RoleDetailDto>> GetRoleById(int id)
		{
			var dto = await _authorizationService.GetRoleById(id);

			if (dto != null)
			{
				return Success(dto, string.Empty);
			}

			return Failure<RoleDetailDto>(500, "Đã có lỗi xẩy ra với hệ thống vui lòng thử lại !");
		}

		/// <summary>
		/// Tạo mới một role trong hệ thống.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ManageRole)]
		[HttpPost]
		public async Task<ApiResult<int>> Create(RoleCreateDto roleCreateDto)
		{
			var dto = await _authorizationService.CreateRole(roleCreateDto);

			if (dto > 0)
			{
				return Success(dto, "Thêm mới thành công !", 201);
			}

			if (dto == -1)
			{
				return Failure<int>(400, "Ten role da ton tai !");
			}

			return Failure<int>(500, "Đã có lỗi xẩy ra với hệ thống vui lòng thử lại !");
		}

		/// <summary>
		/// Cập nhật thông tin của role theo id.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ManageRole)]
		[HttpPut("{id}")]
		public async Task<ApiResult<int>> UpdateRole(int id, RoleUpdateDto roleUpdateDto)
		{
			var dto = await _authorizationService.UpdateRole(id, roleUpdateDto);

			if (dto == 1)
			{
				return Success(dto, "Cập nhập thành công !");
			}

			return Failure<int>(500, "Đã có lỗi xẩy ra với hệ thống vui lòng thử lại !");
		}

		/// <summary>
		/// Xóa một role và các liên kết quyền liên quan.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ManageRole)]
		[HttpDelete("{id}")]
		public async Task<ApiResult<int>> Delete(int id)
		{
			var privilegeIds = await _authorizationService.GetRolePrivileges(id);
			var arr = privilegeIds.ToArray();
			await _authorizationService.DeleteRolePrivilege(id, arr);
			var check = await _authorizationService.DeleteRole(id);

			if (check == 1)
			{
				return Success(check, "Xóa bản ghi thành công !");
			}

			return Failure<int>(500, "Đã có lỗi xẩy ra với hệ thống vui lòng thử lại !");
		}

		/// <summary>
		/// Xóa nhiều role theo danh sách id và dọn các quyền liên quan.
		/// </summary>
		[CustomAuthorize(PrivilegeList.ManageRole)]
		[HttpDelete]
		public async Task<ApiResult<int>> DeleteRoles(string ids)
		{
			if (string.IsNullOrEmpty(ids))
			{
				return Failure<int>(400, "Danh sách role k được để trống !");
			}

			try
			{
				var roleIds = ids.Split(',').Select(x => Convert.ToInt32(x)).ToArray();

				//Xóa tất cả role_privilege liên quan đến các role cần xóa
				foreach (var roleId in roleIds)
				{
					var privilegeIds = await _authorizationService.GetRolePrivileges(roleId);
					var arr = privilegeIds.ToArray();
					await _authorizationService.DeleteRolePrivilege(roleId, arr);
				}

				var deletedCount = await _authorizationService.DeleteRole(roleIds);
				return Success(deletedCount, "Xóa danh sách role thành công !");
			}
			catch (FormatException ex)
			{
				return Failure<int>(400, ex.Message);
			}
			catch (Exception ex)
			{
				return Failure<int>(500, "Đã có lỗi xẩy ra với hệ thống vui lòng thử lại !");
			}
		}
	}
}
