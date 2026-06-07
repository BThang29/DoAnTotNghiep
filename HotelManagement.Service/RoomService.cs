using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Rooms;
using DoAnWebQuanLyKhachSan.Utils.Repository;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class RoomService
	{
		private readonly HotelManagementRepository _repository;
		private readonly BaseService _baseService;

		public RoomService(HotelManagementRepository repository, IMapper mapper)
		{
			_repository = repository;
			_baseService = new BaseService(repository, mapper);
		}

		public async Task<PagingResult<RoomGridDto>> GetRooms(RoomGridPagingDto pagingModel)
		{
			pagingModel ??= new RoomGridPagingDto();
			return await _baseService.FilterPagedAsync<RoomGridView, RoomGridDto>(pagingModel);
		}

		public async Task<List<RoomGridDto>> GetAllRooms()
		{
			return await _baseService.All<RoomGridView, RoomGridDto>()
				.OrderBy(x => x.RoomName)
				.ToListAsync();
		}

		public async Task<RoomDetailDto?> GetRoomById(int id)
		{
			return await _baseService.FindAsync<RoomGridView, RoomDetailDto>(x => x.Id == id);
		}

		public async Task<int?> CreateRoom(RoomCreateDto model)
		{
			if(!await CheckRoomNameExist(model.RoomName))
			{
				return -1;
			}

			var roomTypeId = await ResolveRoomTypeIdAsync(model.RoomTypeId);
			if (!string.IsNullOrWhiteSpace(model.RoomTypeId) && roomTypeId == null)
			{
				return -2;
			}

			var roomStatusId = await ResolveRoomStatusIdAsync(model.RoomStatusId);
			if (!string.IsNullOrWhiteSpace(model.RoomStatusId) && roomStatusId == null)
			{
				return -3;
			}

			await _baseService.CreateAsync<Room, RoomCreateDto>(model);
			return model.id;
		}

		public async Task<bool?> UpdateRoom(int id, RoomUpdateDto model)
		{
			var room = await GetDbContext().Rooms.FirstOrDefaultAsync(x => x.id == id);
			if (room == null)
			{
				return null;
			}

			var roomTypeId = await ResolveRoomTypeIdAsync(model.RoomTypeId);
			if (!string.IsNullOrWhiteSpace(model.RoomTypeId) && roomTypeId == null)
			{
				return false;
			}

			var roomStatusId = await ResolveRoomStatusIdAsync(model.RoomStatusId);
			if (!string.IsNullOrWhiteSpace(model.RoomStatusId) && roomStatusId == null)
			{
				return false;
			}

			model.RoomStatusId = roomStatusId;
			model.RoomTypeId = roomTypeId;

			await _baseService.UpdateAsync<Room, RoomUpdateDto>(id,model);
			return true;
		}

		public async Task<bool?> UpdateRoomStatus(int id, string? roomStatusId)
		{
			var room = await GetDbContext().Rooms.FirstOrDefaultAsync(x => x.id == id);
			if (room == null)
			{
				return null;
			}

			var resolvedRoomStatusId = await ResolveRoomStatusIdAsync(roomStatusId);
			if (resolvedRoomStatusId == null)
			{
				return false;
			}

			room.room_status = resolvedRoomStatusId;
			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<int?> DeleteRoom(int id)
		{
			var room = await GetDbContext().Rooms.FirstOrDefaultAsync(x => x.id == id);
			if (room == null)
			{
				return null;
			}

			GetDbContext().Rooms.Remove(room);
			await GetDbContext().SaveChangesAsync();
			return id;
		}

		public async Task<List<RoomTypeDto>> GetRoomTypes()
		{
			return await _baseService.All<RoomType, RoomTypeDto>()
				.OrderBy(x => x.Id)
				.ToListAsync();
		}

		public async Task<string?> CreateRoomType(RoomTypeCreateDto model)
		{
			var roomTypeId = model.Id.Trim();
			var exists = await GetDbContext().RoomTypes.AsNoTracking().AnyAsync(x => x.id == roomTypeId);
			if (exists)
			{
				return null;
			}

			var entity = new RoomType
			{
				id = roomTypeId,
				details = model.Details.Trim()
			};

			await _baseService.CreateAsync<RoomType, RoomTypeCreateDto>(model);
			return entity.id;
		}

		public async Task<bool?> UpdateRoomType(string id, RoomTypeUpdateDto model)
		{
			var normalizedId = id.Trim();
			var entity = await GetDbContext().RoomTypes.FirstOrDefaultAsync(x => x.id == normalizedId);
			if (entity == null)
			{
				return null;
			}

			entity.details = model.Details.Trim();
			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<string?> DeleteRoomType(string id)
		{
			var normalizedId = id.Trim();
			var entity = await GetDbContext().RoomTypes.FirstOrDefaultAsync(x => x.id == normalizedId);
			if (entity == null)
			{
				return null;
			}

			var hasRooms = await GetDbContext().Rooms.AsNoTracking().AnyAsync(x => x.roomtype_id == normalizedId);
			if (hasRooms)
			{
				return "-2";
			}

			GetDbContext().RoomTypes.Remove(entity);
			await GetDbContext().SaveChangesAsync();
			return normalizedId;
		}

		public async Task<List<RoomStatusDto>> GetRoomStatuses()
		{
			return await _baseService.All<RoomStatus, RoomStatusDto>()
				.OrderBy(x => x.Id)
				.ToListAsync();
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}

		private async Task<string?> ResolveRoomTypeIdAsync(string? roomTypeId)
		{
			if (string.IsNullOrWhiteSpace(roomTypeId))
			{
				return null;
			}

			return await GetDbContext().RoomTypes
				.AsNoTracking()
				.Where(x => x.id == roomTypeId.Trim())
				.Select(x => x.id)
				.FirstOrDefaultAsync();
		}

		private async Task<string?> ResolveRoomStatusIdAsync(string? roomStatusId)
		{
			if (string.IsNullOrWhiteSpace(roomStatusId))
			{
				return null;
			}

			return await GetDbContext().RoomStatuses
				.AsNoTracking()
				.Where(x => x.id == roomStatusId.Trim())
				.Select(x => x.id)
				.FirstOrDefaultAsync();
		}

		public async Task<bool> CheckRoomNameExist(string roomName)
		{
			var room = await GetDbContext().Rooms.FirstOrDefaultAsync(x=> x.room_name == roomName.Trim());
			if (room != null)
			{
				return false; 
			}
			return true;
		}
	}
}
