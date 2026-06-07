using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Others;
using DoAnWebQuanLyKhachSan.Utils.Repository;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class OtherService
	{
		private readonly HotelManagementRepository _repository;
		private readonly BaseService _baseService;

		public OtherService(HotelManagementRepository repository, IMapper mapper)
		{
			_repository = repository;
			_baseService = new BaseService(repository, mapper);
		}

		public async Task<PagingResult<ServiceGridDto>> GetServices(ServiceGridPagingDto pagingModel)
		{
			return await _baseService.FilterPagedAsync<ServiceGridView, ServiceGridDto>(pagingModel);
		}

		public async Task<ServiceDetailDto?> GetServiceById(int id)
		{
			return await _baseService.FindAsync<ServiceGridView, ServiceDetailDto>(x => x.Id == id);
		}

		public async Task<int?> CreateService(ServiceCreateDto model)
		{
			var serviceTypeId = await ResolveServiceTypeIdAsync(model.ServiceTypeId);
			if (model.ServiceTypeId.HasValue && serviceTypeId == null)
			{
				return null;
			}

			var entity = new ServiceDetail
			{
				name_service = model.NameService.Trim(),
				price = model.Price,
				service_code = Normalize(model.ServiceCode),
				remaining_inventory = model.RemainingInventory,
				unit_name = Normalize(model.UnitName),
				servicetype_id = serviceTypeId
			};

			GetDbContext().ServiceDetails.Add(entity);
			await GetDbContext().SaveChangesAsync();
			return entity.id;
		}

		public async Task<bool?> UpdateService(int id, ServiceUpdateDto model)
		{
			var entity = await GetDbContext().ServiceDetails.FirstOrDefaultAsync(x => x.id == id);
			if (entity == null)
			{
				return null;
			}

			var serviceTypeId = await ResolveServiceTypeIdAsync(model.ServiceTypeId);
			if (model.ServiceTypeId.HasValue && serviceTypeId == null)
			{
				return false;
			}

			entity.name_service = model.NameService.Trim();
			entity.price = model.Price;
			entity.service_code = Normalize(model.ServiceCode);
			entity.remaining_inventory = model.RemainingInventory;
			entity.unit_name = Normalize(model.UnitName);
			entity.servicetype_id = serviceTypeId;

			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<int?> DeleteService(int id)
		{
			var entity = await GetDbContext().ServiceDetails.FirstOrDefaultAsync(x => x.id == id);
			if (entity == null)
			{
				return null;
			}

			var hasInventoryReceiving = await GetDbContext().InventoryReceivings.AsNoTracking().AnyAsync(x => x.servicedetail_id == id);
			var hasInventoryDelivery = await GetDbContext().InventoryDeliveries.AsNoTracking().AnyAsync(x => x.servicedetail_id == id);
			var hasInvoiceDetail = await GetDbContext().InvoiceDetails.AsNoTracking().AnyAsync(x => x.servicedetail_id == id);

			if (hasInventoryReceiving || hasInventoryDelivery || hasInvoiceDetail)
			{
				return -2;
			}

			GetDbContext().ServiceDetails.Remove(entity);
			await GetDbContext().SaveChangesAsync();
			return id;
		}

		public async Task<List<ServiceTypeDto>> GetServiceTypes()
		{
			return await _baseService.All<ServiceType, ServiceTypeDto>()
				.OrderBy(x => x.Id)
				.ToListAsync();
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}

		private async Task<int?> ResolveServiceTypeIdAsync(int? serviceTypeId)
		{
			if (!serviceTypeId.HasValue)
			{
				return null;
			}

			return await GetDbContext().ServiceTypes
				.AsNoTracking()
				.Where(x => x.id == serviceTypeId.Value)
				.Select(x => (int?)x.id)
				.FirstOrDefaultAsync();
		}

		private static string? Normalize(string? value)
		{
			return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
		}
	}
}
