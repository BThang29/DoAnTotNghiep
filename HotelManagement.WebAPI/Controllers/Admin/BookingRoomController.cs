using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Bookings;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/booking-room")]
	[Authorize]
	public class BookingRoomController : BaseController
	{
		private readonly BookingRoomService _bookingRoomService;

		/// <summary>
		/// Khởi tạo controller quản lý đặt phòng.
		/// </summary>
		public BookingRoomController(BookingRoomService bookingRoomService)
		{
			_bookingRoomService = bookingRoomService;
		}

		/// <summary>
		/// Lấy danh sách booking.
		/// </summary>
		[HttpGet]
		[CustomAuthorize(PrivilegeList.ViewBooking, PrivilegeList.ManageBooking)]
		public async Task<ApiResult<PagingResult<BookingGridDto>>> GetBookings([FromQuery] BookingGridPagingDto pagingModel)
		{
			return Success(await _bookingRoomService.GetBookings(pagingModel), "Lay danh sach dat phong thanh cong.");
		}

		/// <summary>
		/// Lấy chi tiết booking theo id.
		/// </summary>
		[HttpGet("{id:int}")]
		[CustomAuthorize(PrivilegeList.ViewBooking, PrivilegeList.ManageBooking)]
		public async Task<ApiResult<BookingDetailDto>> GetBookingById(int id)
		{
			var booking = await _bookingRoomService.GetBookingById(id);
			if (booking == null)
			{
				return Failure<BookingDetailDto>(404, "Khong tim thay booking.");
			}

			return Success(booking, "Lay chi tiet booking thanh cong.");
		}

		/// <summary>
		/// Tạo mới booking đặt phòng.
		/// </summary>
		[HttpPost]
		[CustomAuthorize(PrivilegeList.ManageBooking, PrivilegeList.CreateBooking)]
		public async Task<ApiResult<int>> CreateBooking([FromBody] BookingCreateDto model)
		{
			if (!ModelState.IsValid)
			{
				return Failure<int>(400, "Dữ liệu đặt phòng không hợp lệ.");
			}

			if (model.CustomerId <= 0 || model.RoomId <= 0)
			{
				return Failure<int>(400, "Khách hàng hoặc phòng không hợp lệ.");
			}

			if (model.DateStart.Date < DateTime.Today)
			{
				return Failure<int>(400, "Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
			}

			if (model.DateEnd.Date < model.DateStart.Date)
			{
				return Failure<int>(400, "Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.");
			}

			var result = await _bookingRoomService.CreateBooking(model);
			if (!result.HasValue)
			{
				return Failure<int>(404, "Không tìm thấy khách hàng.");
			}

			if (result.Value == -2)
			{
				return Failure<int>(404, "Không tìm thấy phòng.");
			}

			if (result.Value == -3)
			{
				return Failure<int>(400, "Voucher không hợp lệ hoặc hết hạn.");
			}

			if (result.Value == -4)
			{
				return Failure<int>(400, "Phòng đã được đặt trong khoảng thời gian này.");
			}

			return Success(result.Value, "Đặt phòng thành công.", 201);
		}

		/// <summary>
		/// Kiểm tra danh sách phòng trống trong khoảng thời gian yêu cầu.
		/// </summary>
		[HttpGet("available-rooms")]
		[CustomAuthorize(PrivilegeList.ViewBooking, PrivilegeList.ManageBooking, PrivilegeList.ViewRoom)]
		public async Task<ApiResult<List<AvailableRoomDto>>> CheckAvailableRooms([FromQuery] AvailableRoomQueryDto query)
		{
			if (query.DateStart.Date < DateTime.Today)
			{
				return Failure<List<AvailableRoomDto>>(400, "Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
			}

			if (query.DateEnd.Date < query.DateStart.Date)
			{
				return Failure<List<AvailableRoomDto>>(400, "Khoang thoi gian kiem tra phong khong hop le.");
			}

			var rooms = await _bookingRoomService.CheckAvailableRooms(query);
			if (rooms == null)
			{
				return Failure<List<AvailableRoomDto>>(400, "Khoang thoi gian kiem tra phong khong hop le.");
			}

			return Success(rooms, "Kiem tra phong trong thanh cong.");
		}

		[HttpGet("available-rooms-paged")]
		[CustomAuthorize(PrivilegeList.ViewBooking, PrivilegeList.ManageBooking, PrivilegeList.ViewRoom)]
		public async Task<ApiResult<PagingResult<AvailableRoomDto>>> CheckAvailableRoomsPaged([FromQuery] AvailableRoomPagingDto pagingModel)
		{
			if (pagingModel.DateStart.Date < DateTime.Today)
			{
				return Failure<PagingResult<AvailableRoomDto>>(400, "Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
			}

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

		/// <summary>
		/// Cập nhật tiền đặt cọc cho booking.
		/// </summary>
		[HttpPut("{id:int}/deposit")]
		[CustomAuthorize(PrivilegeList.ManageBooking)]
		public async Task<ApiResult<bool>> UpdateDeposit(int id, [FromBody] BookingDepositUpdateDto model)
		{
			if (model.Deposit < 0)
			{
				return Failure<bool>(400, "Tien dat coc khong hop le.");
			}

			var updated = await _bookingRoomService.UpdateDeposit(id, model.Deposit);
			if (!updated.HasValue)
			{
				return Failure<bool>(404, "Khong tim thay booking.");
			}

			return Success(true, "Cap nhat dat coc thanh cong.");
		}
	}
}
