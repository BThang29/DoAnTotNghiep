using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Rooms;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/room")]
	[Authorize]
	public class RoomController : BaseController
	{
		private readonly RoomService _roomService;

		/// <summary>
		/// Khoi tao controller quan ly phong.
		/// </summary>
		public RoomController(RoomService roomService)
		{
			_roomService = roomService;
		}

		/// <summary>
		/// Lay danh sach phong theo bo loc phan trang.
		/// </summary>
		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewRoom, PrivilegeList.ManageRoom)]
		public async Task<ApiResult<PagingResult<RoomGridDto>>> GetRooms([FromQuery] RoomGridPagingDto pagingModel)
		{
			return Success(await _roomService.GetRooms(pagingModel), "Lay danh sach phong thanh cong.");
		}

		/// <summary>
		/// Lay toan bo danh sach phong.
		/// </summary>
		[HttpGet("all")]
		[CustomAuthorize(PrivilegeList.ViewRoom, PrivilegeList.ManageRoom)]
		public async Task<ApiResult<List<RoomGridDto>>> GetAllRooms()
		{
			return Success(await _roomService.GetAllRooms(), "Lay toan bo danh sach phong thanh cong.");
		}

		/// <summary>
		/// Lay thong tin chi tiet cua mot phong.
		/// </summary>
		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewRoom, PrivilegeList.ManageRoom)]
		public async Task<ApiResult<RoomDetailDto>> GetRoomById(int id)
		{
			var room = await _roomService.GetRoomById(id);
			if (room == null)
			{
				return Failure<RoomDetailDto>(404, "Khong tim thay phong.");
			}

			return Success(room, "Lay thong tin phong thanh cong.");
		}

		/// <summary>
		/// Tao moi mot phong.
		/// </summary>
		[HttpPost]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<int>> CreateRoom([FromBody] RoomCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Du lieu dau vao khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.RoomName))
			{
				return Failure<int>(400, "Ten phong khong duoc de trong.");
			}

			var roomId = await _roomService.CreateRoom(model);
			if (roomId.HasValue)
			{
				if (roomId == -1)
				{
					return Failure<int>(400, "Ten phong da ton tai trong he thong. Vui long dat ten khac.");
				}
				if (roomId == -2)
				{
					return Failure<int>(400, "Loai phong khong ton tai.");
				}
				if (roomId == -3)
				{
					return Failure<int>(400, "Trang thai phong khong ton tai.");
				}
			}

			return Success(roomId.Value, "Tao phong thanh cong.", 201);
		}

		/// <summary>
		/// Cap nhat thong tin phong theo id.
		/// </summary>
		[HttpPut("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<bool>> UpdateRoom(int id, [FromBody] RoomUpdateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Du lieu cap nhat phong khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.RoomName))
			{
				return Failure<bool>(400, "Ten phong khong duoc de trong.");
			}

			var updated = await _roomService.UpdateRoom(id, model);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay phong.");
			}

			if (!updated.Value)
			{
				return Failure<bool>(400, "Loai phong hoac trang thai phong khong hop le.");
			}

			return Success(true, "Cap nhat phong thanh cong.");
		}

		/// <summary>
		/// Cap nhat trang thai phong theo id.
		/// </summary>
		[HttpPut("{id:int}/status")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<bool>> UpdateRoomStatus(int id, [FromBody] RoomStatusUpdateDto model)
		{
			var updated = await _roomService.UpdateRoomStatus(id, model.RoomStatusId);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay phong.");
			}

			if (!updated.Value)
			{
				return Failure<bool>(400, "Trang thai phong khong hop le.");
			}

			return Success(true, "Cap nhat trang thai phong thanh cong.");
		}

		/// <summary>
		/// Xoa mot phong theo id.
		/// </summary>
		[HttpDelete("{id:int}")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<int>> DeleteRoom(int id)
		{
			var deletedId = await _roomService.DeleteRoom(id);
			if (!deletedId.HasValue)
			{
				return Failure<int>(404, "Khong tim thay phong.");
			}

			return Success(deletedId.Value, "Xoa phong thanh cong.");
		}

		/// <summary>
		/// Lay danh sach loai phong.
		/// </summary>
		[HttpGet("types")]
		[CustomAuthorize(PrivilegeList.ViewRoom, PrivilegeList.ManageRoom)]
		public async Task<ApiResult<List<RoomTypeDto>>> GetRoomTypes()
		{
			return Success(await _roomService.GetRoomTypes(), "Lay danh sach loai phong thanh cong.");
		}

		[HttpPost("types")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<string>> CreateRoomType([FromBody] RoomTypeCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<string>(400, "Du lieu tao loai phong khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.Id))
			{
				return Failure<string>(400, "Ma loai phong khong duoc de trong.");
			}

			if (string.IsNullOrWhiteSpace(model.Details))
			{
				return Failure<string>(400, "Ten loai phong khong duoc de trong.");
			}

			var roomTypeId = await _roomService.CreateRoomType(model);
			if (string.IsNullOrWhiteSpace(roomTypeId))
			{
				return Failure<string>(400, "Ma loai phong da ton tai.");
			}

			return Success(roomTypeId, "Tao loai phong thanh cong.", 201);
		}

		[HttpPut("types/{id}")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<bool>> UpdateRoomType(string id, [FromBody] RoomTypeUpdateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<bool>(400, "Du lieu cap nhat loai phong khong hop le.");
			}

			if (string.IsNullOrWhiteSpace(model.Details))
			{
				return Failure<bool>(400, "Ten loai phong khong duoc de trong.");
			}

			var updated = await _roomService.UpdateRoomType(id, model);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay loai phong.");
			}

			return Success(true, "Cap nhat loai phong thanh cong.");
		}

		[HttpDelete("types/{id}")]
		[CustomAuthorize(PrivilegeList.ManageRoom)]
		public async Task<ApiResult<string>> DeleteRoomType(string id)
		{
			var deletedId = await _roomService.DeleteRoomType(id);
			if (deletedId == null)
			{
				return Failure<string>(404, "Khong tim thay loai phong.");
			}

			if (deletedId == "-2")
			{
				return Failure<string>(400, "Loai phong dang duoc su dung boi phong, khong the xoa.");
			}

			return Success(deletedId, "Xoa loai phong thanh cong.");
		}

		/// <summary>
		/// Lay danh sach trang thai phong.
		/// </summary>
		[HttpGet("statuses")]
		[CustomAuthorize(PrivilegeList.ViewRoom, PrivilegeList.ManageRoom)]
		public async Task<ApiResult<List<RoomStatusDto>>> GetRoomStatuses()
		{
			return Success(await _roomService.GetRoomStatuses(), "Lay danh sach trang thai phong thanh cong.");
		}
	}
}
