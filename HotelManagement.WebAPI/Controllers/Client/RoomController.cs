using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Bookings;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms;
using DoAnWebQuanLyKhachSan.Service.Dtos.Rooms;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Client
{
    [Route("api/client/room")]
    public class RoomController : BaseController
	{
		private readonly ClientRoomService _clientRoomService;
        private readonly BookingRoomService _bookingRoomService;

        public RoomController(ClientRoomService clientRoomService, BookingRoomService bookingRoomService)
		{
			_clientRoomService = clientRoomService;
			_bookingRoomService = bookingRoomService;
		}

		[HttpGet]
		public async Task<ApiResult<PagingResult<ClientRoomDto>>> GetRooms([FromQuery] ClientRoomPagingDto pagingModel)
		{
			var rooms = await _clientRoomService.GetRooms(pagingModel);
			if (rooms == null)
			{
				return Failure<PagingResult<ClientRoomDto>>(400, "Khoang thoi gian tim phong khong hop le.");
			}

			return Success(rooms, "Lay danh sach phong thanh cong.");
		}

		[HttpGet("{id:int}")]
		public async Task<ApiResult<ClientRoomDto>> GetRoomById(int id)
		{
			var room = await _clientRoomService.GetRoomById(id);
			if (room == null)
			{
				return Failure<ClientRoomDto>(404, "Khong tim thay phong.");
			}

			return Success(room, "Lay chi tiet phong thanh cong.");
		}

		[HttpGet("types")]
		public async Task<ApiResult<List<RoomTypeDto>>> GetRoomTypes()
		{
			return Success(await _clientRoomService.GetRoomTypes(), "Lay danh sach loai phong thanh cong.");
		}

		[HttpGet("featured-by-type")]
		public async Task<ApiResult<List<ClientRoomTypeGroupDto>>> GetFeaturedRoomsByType([FromQuery] int roomsPerType = 4)
		{
			return Success(await _clientRoomService.GetFeaturedRoomsByType(roomsPerType), "Lay danh sach phong noi bat theo loai thanh cong.");
		}


        /// <summary>
        /// Kiểm tra danh sách phòng trống trong khoảng thời gian yêu cầu.
        /// </summary>
        [HttpGet("available-rooms")]
        public async Task<ApiResult<PagingResult<AvailableRoomDto>>> CheckAvailableRooms([FromQuery] AvailableRoomPagingDto pagingModel)
        {
            if (pagingModel.DateEnd.Date < pagingModel.DateStart.Date)
            {
                return Failure<PagingResult<AvailableRoomDto>>(400, "Khoang thoi gian kiem tra phong khong hop le.");
            }

            var rooms = await _bookingRoomService.CheckAvailableRoomsPaged(pagingModel);
            if (rooms == null)
            {
                return Failure<PagingResult<AvailableRoomDto>>(400, "Khoang thoi gian kiem tra phong khong hop le.");
            }

            return Success(rooms, "Kiem tra phong trong thanh cong.");
        }
    }
}
