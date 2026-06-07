using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Bookings;
using DoAnWebQuanLyKhachSan.Service.Helpers;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Dynamic.Core;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class BookingRoomService
	{
		private readonly HotelManagementRepository _repository;
		private readonly HotelManagementBaseService _baseService;
		private readonly IUserIdentity<int> _userIdentity;
		private readonly EmailService _emailService;

		public BookingRoomService(HotelManagementRepository repository, IUserIdentity<int> userIdentity, IMapper mapper, EmailService emailService)
		{
			_repository = repository;
			_baseService = new HotelManagementBaseService(repository, mapper);
			_userIdentity = userIdentity;
			_emailService = emailService;
		}

		public async Task<PagingResult<BookingGridDto>> GetBookings(BookingGridPagingDto pagingModel)
		{
			pagingModel ??= new BookingGridPagingDto();
			return await _baseService.FilterPagedAsync<BookingGridView, BookingGridDto>(pagingModel);
		}

		public async Task<BookingDetailDto?> GetBookingById(int id)
		{
			return await _baseService.FindAsync<BookingDetailView, BookingDetailDto>(x => x.Id == id);
		}

		public async Task<int?> CreateBooking(BookingCreateDto model)
		{
			var db = GetDbContext();
			var customer = await db.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.id == model.CustomerId);
			if (customer == null)
			{
				return null;
			}

			var room = await db.Rooms.FirstOrDefaultAsync(x => x.id == model.RoomId);
			if (room == null)
			{
				return -2;
			}

			string? voucherCode = null;
			if (model.VoucherId.HasValue)
			{
				var voucher = await db.Vouchers.AsNoTracking().FirstOrDefaultAsync(x => x.id == model.VoucherId.Value);
				if (voucher == null || !IsVoucherActive(voucher, model.DateStart))
				{
					return -3;
				}

				voucherCode = voucher.voucher_code;
			}

			var hasConflict = await HasBookingConflict(model.RoomId, model.DateStart, model.DateEnd);
			if (hasConflict)
			{
				return -4;
			}

			var booking = new Booking
			{
				user_id = customer.userid,
				room_id = model.RoomId,
				date_booking = DateTime.Now,
				date_start = model.DateStart,
				date_end = model.DateEnd,
				deposit = model.Deposit,
				employee_id = _userIdentity.UserId,
				voucher_id = model.VoucherId
			};

			db.Bookings.Add(booking);
			room.room_status = "OCCUPIED";
			await db.SaveChangesAsync();

			if (!string.IsNullOrWhiteSpace(customer.mail))
			{
				try
				{
					await _emailService.SendBookingCreatedEmail(
						customer.mail,
						customer.fullname ?? "Khách hàng",
						booking.id,
						room.room_name ?? $"Phòng {room.id}",
						room.price,
					model.DateStart,
						model.DateEnd,
						model.Deposit,
						voucherCode);
				}
				catch
				{
					// Best-effort: khong de loi gui mail lam hong luong tao booking.
				}
			}

			return booking.id;
		}

		public async Task<List<AvailableRoomDto>?> CheckAvailableRooms(AvailableRoomQueryDto query)
		{
			if (query.DateEnd.Date < query.DateStart.Date)
			{
				return null;
			}

			var rooms = GetDbContext().Rooms
				.AsNoTracking()
				.Where(x => x.room_status == "AVAILABLE")
				.AsQueryable();
			if (!string.IsNullOrWhiteSpace(query.RoomTypeId))
			{
				rooms = rooms.Where(x => x.roomtype_id == query.RoomTypeId);
			}

			var roomList = await rooms.ToListAsync();
			var bookedRoomIds = await GetDbContext().Bookings
				.AsNoTracking()
				.Where(x =>
					x.room_id.HasValue &&
					x.date_start.HasValue &&
					x.date_end.HasValue &&
					x.date_start.Value.Date <= query.DateEnd.Date &&
					query.DateStart.Date <= x.date_end.Value.Date)
				.Select(x => x.room_id!.Value)
				.Distinct()
				.ToListAsync();

			var roomTypeMap = await GetDbContext().RoomTypes
				.AsNoTracking()
				.ToDictionaryAsync(x => x.id, x => x.details ?? string.Empty);

			return roomList
				.Where(x => !bookedRoomIds.Contains(x.id))
				.Select(x => new AvailableRoomDto
				{
					RoomId = x.id,
					RoomName = x.room_name,
					Price = x.price,
					RoomTypeId = x.roomtype_id,
					RoomTypeName = !string.IsNullOrWhiteSpace(x.roomtype_id) && roomTypeMap.ContainsKey(x.roomtype_id) ? roomTypeMap[x.roomtype_id] : string.Empty
				})
				.ToList();
		}

		public async Task<PagingResult<AvailableRoomDto>?> CheckAvailableRoomsPaged(AvailableRoomPagingDto query)
		{
			if (query.DateEnd.Date < query.DateStart.Date)
			{
				return null;
			}

			query.NormalizeSort();
			var page = query.Page <= 0 ? 1 : query.Page;
			var itemsPerPage = query.ItemsPerPage <= 0 ? 6 : query.ItemsPerPage;
			var rooms = GetDbContext().Rooms
				.AsNoTracking()
				.Where(x => x.room_status == "AVAILABLE")
				.AsQueryable();
			if (!string.IsNullOrWhiteSpace(query.RoomTypeId))
			{
				rooms = rooms.Where(x => x.roomtype_id == query.RoomTypeId);
			}

			var roomList = await rooms
				.OrderBy(x => x.id)
				.ToListAsync();
			var bookedRoomIds = await GetDbContext().Bookings
				.AsNoTracking()
				.Where(x =>
					x.room_id.HasValue &&
					x.date_start.HasValue &&
					x.date_end.HasValue &&
					x.date_start.Value.Date <= query.DateEnd.Date &&
					query.DateStart.Date <= x.date_end.Value.Date)
				.Select(x => x.room_id!.Value)
				.Distinct()
				.ToListAsync();

			var roomTypeMap = await GetDbContext().RoomTypes
				.AsNoTracking()
				.ToDictionaryAsync(x => x.id, x => x.details ?? string.Empty);

			var availableRooms = roomList
				.Where(x => !bookedRoomIds.Contains(x.id))
				.Select(x => new AvailableRoomDto
				{
					RoomId = x.id,
					RoomName = x.room_name,
					Price = x.price,
					RoomTypeId = x.roomtype_id,
					RoomTypeName = !string.IsNullOrWhiteSpace(x.roomtype_id) && roomTypeMap.ContainsKey(x.roomtype_id) ? roomTypeMap[x.roomtype_id] : string.Empty
				})
				.ToList();

			var predicates = query.GetPredicates();
			if (predicates.Count > 0)
			{
				var filteredQuery = availableRooms.AsQueryable();
				foreach (var predicate in predicates)
				{
					filteredQuery = filteredQuery.Where(predicate);
				}

				availableRooms = filteredQuery.ToList();
			}

			availableRooms = availableRooms
				.AsQueryable()
				.OrderBy($"{query.SortExpression}, {nameof(AvailableRoomDto.RoomId)} asc")
				.ToList();

			var totalRows = availableRooms.Count;
			var totalPages = totalRows > 0 ? (int)Math.Ceiling(totalRows / (double)itemsPerPage) : 1;
			page = Math.Min(page, totalPages);
			var pagedRooms = availableRooms
				.Skip((page - 1) * itemsPerPage)
				.Take(itemsPerPage)
				.ToList();

			return new PagingResult<AvailableRoomDto>
			{
				CurrentPage = page,
				PageSize = itemsPerPage,
				TotalRows = totalRows,
				Data = pagedRooms
			};
		}

		public async Task<bool?> UpdateDeposit(int id, decimal deposit)
		{
			var booking = await GetDbContext().Bookings.FirstOrDefaultAsync(x => x.id == id);
			if (booking == null)
			{
				return null;
			}

			booking.deposit = deposit;
			await GetDbContext().SaveChangesAsync();
			return true;
		}

		private async Task<bool> HasBookingConflict(int roomId, DateTime dateStart, DateTime dateEnd)
		{
			return await GetDbContext().Bookings
				.AsNoTracking()
				.AnyAsync(x =>
					x.room_id == roomId &&
					x.date_start.HasValue &&
					x.date_end.HasValue &&
					x.date_start.Value.Date <= dateEnd.Date &&
					dateStart.Date <= x.date_end.Value.Date);
		}

		private static bool IsVoucherActive(Voucher voucher, DateTime referenceDate)
		{
			var date = referenceDate.Date;
			if (voucher.date_start.HasValue && voucher.date_start.Value.Date > date)
			{
				return false;
			}

			if (voucher.date_end.HasValue && voucher.date_end.Value.Date < date)
			{
				return false;
			}

			return true;
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}
	}
}
