using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Customers;
using DoAnWebQuanLyKhachSan.Service.Helpers;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;
using static PdfSharp.Capabilities.Features;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class CustomerService
	{
		private const string VipCustomerTypeName = "VIP";
		private const string NormalCustomerTypeName = "Thuong";
		private readonly BaseService _baseService;

		public CustomerService(HotelManagementRepository repository, IMapper mapper)
		{
			_baseService = new BaseService(repository, mapper);
		}

		public async Task<PagingResult<CustomerGridDto>> GetCustomers(CustomerGridPagingDto pagingModel)
		{
			await EnsureDefaultCustomerTypesAsync();
			pagingModel ??= new CustomerGridPagingDto();
			return await _baseService.FilterPagedAsync<CustomerLookupView, CustomerGridDto>(pagingModel);
		}

		public async Task<CustomerDetailDto?> GetCustomerById(int id)
		{
			await EnsureDefaultCustomerTypesAsync();
			return await _baseService.FindAsync<CustomerLookupView, CustomerDetailDto>(x => x.Id == id);
		}

		public async Task<int?> CreateCustomer(CustomerCreateDto model)
		{
			await EnsureDefaultCustomerTypesAsync();
			var customerTypeId = await ResolveCustomerTypeIdAsync(model.Customer_Type);
			if (model.Customer_Type.HasValue && customerTypeId == null)
			{
				return null;
			}

			await _baseService.CreateAsync<Customer, CustomerCreateDto>(model);
			return model.Id;
		}

		public async Task<int> UpdateCustomer(int id, CustomerUpdateDto model)
		{
			var customer = await GetDbContext().Customers.FirstOrDefaultAsync(x => x.id == id);
			if (customer == null)
			{
				return -1;
			}

			await EnsureDefaultCustomerTypesAsync();
			var customerTypeId = await ResolveCustomerTypeIdAsync(model.Customer_Type);
			if (model.Customer_Type.HasValue && customerTypeId == null)
			{
				return -2;
			}
			
			model.Customer_Type = customerTypeId;
			return await _baseService.UpdateAsync<Customer, CustomerUpdateDto>(id, model);
		}

		public async Task<bool?> UpdateCustomerType(int id, int? customerTypeId)
		{
			var customer = await GetDbContext().Customers.FirstOrDefaultAsync(x => x.id == id);
			if (customer == null)
			{
				return null;
			}

			await EnsureDefaultCustomerTypesAsync();
			var resolvedCustomerTypeId = await ResolveCustomerTypeIdAsync(customerTypeId);
			if (resolvedCustomerTypeId == null)
			{
				return false;
			}

			customer.customer_type = resolvedCustomerTypeId;
			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<int?> DeleteCustomer(int id)
		{
			var customer = await GetDbContext().Customers.FirstOrDefaultAsync(x => x.id == id);
			if (customer == null)
			{
				return null;
			}

			return await _baseService.DeleteAsync<Customer, int>(id);
		}

		public async Task<List<CustomerTypeDto>> GetCustomerTypes()
		{
			await EnsureDefaultCustomerTypesAsync();
			return await _baseService.All<CustomerType, CustomerTypeDto>()
				.OrderBy(x => x.Id)
				.ToListAsync();
		}

		private HotelManagementContext GetDbContext()
		{
			return _baseService.GetDbContext<HotelManagementContext>();
		}

		private async Task EnsureDefaultCustomerTypesAsync()
		{
			var db = GetDbContext();
			var existingTypes = await db.CustomerTypes
				.Select(x => x.summary ?? string.Empty)
				.ToListAsync();

			var missingTypes = new List<CustomerType>();
			if (!existingTypes.Any(x => x.Equals(VipCustomerTypeName, StringComparison.OrdinalIgnoreCase)))
			{
				missingTypes.Add(new CustomerType { summary = VipCustomerTypeName });
			}

			if (!existingTypes.Any(x => x.Equals(NormalCustomerTypeName, StringComparison.OrdinalIgnoreCase)))
			{
				missingTypes.Add(new CustomerType { summary = NormalCustomerTypeName });
			}

			if (missingTypes.Count == 0)
			{
				return;
			}

			db.CustomerTypes.AddRange(missingTypes);
			await db.SaveChangesAsync();
		}

		private async Task<int?> ResolveCustomerTypeIdAsync(int? customerTypeId)
		{
			if (!customerTypeId.HasValue)
			{
				return null;
			}

			return await GetDbContext().CustomerTypes
				.AsNoTracking()
				.Where(x => x.id == customerTypeId.Value)
				.Select(x => (int?)x.id)
				.FirstOrDefaultAsync();
		}

		private static string? Normalize(string? value)
		{
			return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
		}
	}
}
