using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms;
using DoAnWebQuanLyKhachSan.Service.Dtos.Rooms;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class ClientRoomService
	{
		private readonly HotelManagementRepository _repository;
		private readonly BaseService _baseService;
		private readonly IMapper _mapper;
		private readonly RoomAvailabilitySynchronizationService _roomAvailabilitySynchronizationService;

		public ClientRoomService(
			HotelManagementRepository repository,
			IMapper mapper,
			RoomAvailabilitySynchronizationService roomAvailabilitySynchronizationService)
		{
			_repository = repository;
			_baseService = new BaseService(repository, mapper);
			_mapper = mapper;
			_roomAvailabilitySynchronizationService = roomAvailabilitySynchronizationService;
		}

		public async Task<PagingResult<ClientRoomDto>?> GetRooms(ClientRoomPagingDto query)
		{
			query ??= new ClientRoomPagingDto();

			if (query.DateStart.HasValue && query.DateEnd.HasValue && query.DateEnd.Value.Date < query.DateStart.Value.Date)
			{
				return null;
			}

			await _roomAvailabilitySynchronizationService.SyncRoomStatusesAsync();

			var rooms = GetDbContext().RoomGridViews.AsNoTracking().AsQueryable();

			if (!string.IsNullOrWhiteSpace(query.Keyword))
			{
				var keyword = query.Keyword.Trim();
				rooms = rooms.Where(x => x.RoomName.Contains(keyword) || x.RoomTypeName.Contains(keyword));
			}

			if (!string.IsNullOrWhiteSpace(query.RoomTypeId))
			{
				rooms = rooms.Where(x => x.RoomTypeId == query.RoomTypeId);
			}

			if (query.MinPrice.HasValue)
			{
				rooms = rooms.Where(x => x.Price.HasValue && x.Price.Value >= query.MinPrice.Value);
			}

			if (query.MaxPrice.HasValue)
			{
				rooms = rooms.Where(x => x.Price.HasValue && x.Price.Value <= query.MaxPrice.Value);
			}

			var items = await rooms.OrderBy(x => x.RoomName).ToListAsync();
			var bookedRoomIds = new HashSet<int>();

			if (query.DateStart.HasValue && query.DateEnd.HasValue)
			{
				var ids = await GetDbContext().RoomBookingScheduleViews
					.AsNoTracking()
					.Where(x => x.DateStart.HasValue
						&& x.DateEnd.HasValue
						&& x.DateStart.Value.Date <= query.DateEnd.Value.Date
						&& query.DateStart.Value.Date <= x.DateEnd.Value.Date)
					.Select(x => x.RoomId)
					.Distinct()
					.ToListAsync();

				bookedRoomIds = ids.ToHashSet();
			}

			var results = items.Select(x =>
			{
				var dto = _mapper.Map<ClientRoomDto>(x);
				dto.IsAvailable = string.Equals(x.RoomStatusId, "AVAILABLE", StringComparison.OrdinalIgnoreCase)
					&& !bookedRoomIds.Contains(x.Id);
				return dto;
			}).ToList();

			var predicates = query.GetPredicates();
			if (predicates.Count > 0)
			{
				var filteredQuery = results.AsQueryable();
				foreach (var predicate in predicates)
				{
					filteredQuery = filteredQuery.Where(predicate);
				}

				results = filteredQuery.ToList();
			}

			var page = query.Page <= 0 ? 1 : query.Page;
			var itemsPerPage = query.ItemsPerPage <= 0 ? 9 : query.ItemsPerPage;
			var totalRows = results.Count;
			var totalPages = totalRows > 0 ? (int)Math.Ceiling(totalRows / (double)itemsPerPage) : 1;
			page = Math.Min(page, totalPages);

			return new PagingResult<ClientRoomDto>
			{
				CurrentPage = page,
				PageSize = itemsPerPage,
				TotalRows = totalRows,
				Data = results
					.Skip((page - 1) * itemsPerPage)
					.Take(itemsPerPage)
					.ToList()
			};
		}

		public async Task<ClientRoomDto?> GetRoomById(int id)
		{
			await _roomAvailabilitySynchronizationService.SyncRoomStatusesAsync();

			var room = await _baseService.FindAsync<RoomGridView, ClientRoomDto>(x => x.Id == id);
			if (room == null)
			{
				return null;
			}

			room.IsAvailable = string.Equals(room.RoomStatusId, "AVAILABLE", StringComparison.OrdinalIgnoreCase);
			return room;
		}

		public async Task<List<RoomTypeDto>> GetRoomTypes()
		{
			return await _baseService.All<RoomType, RoomTypeDto>().OrderBy(x => x.Name).ToListAsync();
		}

		public async Task<List<ClientRoomTypeGroupDto>> GetFeaturedRoomsByType(int roomsPerType)
		{
			var takeCount = roomsPerType <= 0 ? 4 : roomsPerType;

			await _roomAvailabilitySynchronizationService.SyncRoomStatusesAsync();

			var rooms = await GetDbContext().RoomGridViews
				.AsNoTracking()
				.OrderBy(x => x.RoomTypeName)
				.ThenBy(x => x.RoomName)
				.ToListAsync();

			return rooms
				.GroupBy(x => new { x.RoomTypeId, x.RoomTypeName })
				.OrderBy(x => x.Key.RoomTypeName)
				.Select(group => new ClientRoomTypeGroupDto
				{
					RoomTypeId = group.Key.RoomTypeId,
					RoomTypeName = group.Key.RoomTypeName,
					Rooms = group
						.Take(takeCount)
						.Select(room =>
						{
							var dto = _mapper.Map<ClientRoomDto>(room);
							dto.IsAvailable = string.Equals(room.RoomStatusId, "AVAILABLE", StringComparison.OrdinalIgnoreCase);
							return dto;
						})
						.ToList()
				})
				.Where(x => x.Rooms.Count > 0)
				.ToList();
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}
	}
}
