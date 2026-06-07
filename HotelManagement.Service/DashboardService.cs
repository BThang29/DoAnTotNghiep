using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard;
using DoAnWebQuanLyKhachSan.Service.Dtos.Others;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class DashboardService
	{
		private readonly HotelManagementRepository _repository;

		public DashboardService(HotelManagementRepository repository)
		{
			_repository = repository;
		}

		public async Task<DashboardSummaryDto> GetSummary()
		{
			var revenue = await GetRevenueSummary();
			var rooms = await GetRoomOccupancySummary();
			var stayingGuests = await GetStayingGuests();
			var serviceTypes = await GetServiceTypes();

			return new DashboardSummaryDto
			{
				Revenue = revenue,
				Rooms = rooms,
				StayingGuestCount = stayingGuests.Count,
				ServiceTypes = serviceTypes,
			};
		}

		public async Task<RevenueSummaryDto> GetRevenueSummary()
		{
			var today = DateTime.Today;
			var monthStart = new DateTime(today.Year, today.Month, 1);

			var invoices = await GetDbContext().InvoiceGridViews
				.AsNoTracking()
				.ToListAsync();

			var totalRevenue = invoices.Sum(x => x.TotalAmount);
			var revenueToday = invoices
				.Where(x => x.IssueDate.HasValue && x.IssueDate.Value.Date == today)
				.Sum(x => x.TotalAmount);
			var revenueThisMonth = invoices
				.Where(x => x.IssueDate.HasValue && x.IssueDate.Value.Date >= monthStart && x.IssueDate.Value.Date <= today)
				.Sum(x => x.TotalAmount);

			return new RevenueSummaryDto
			{
				TotalRevenue = totalRevenue,
				RevenueToday = revenueToday,
				RevenueThisMonth = revenueThisMonth,
				InvoiceCount = invoices.Count
			};
		}

		public async Task<RoomOccupancySummaryDto> GetRoomOccupancySummary()
		{
			var today = DateTime.Today;
			var totalRooms = await GetDbContext().Rooms.AsNoTracking().CountAsync();

			var occupiedRoomIds = await GetDbContext().Bookings
				.AsNoTracking()
				.Where(x => x.room_id.HasValue &&
					x.date_start.HasValue &&
					x.date_end.HasValue &&
					x.date_start.Value.Date <= today &&
					x.date_end.Value.Date >= today)
				.Select(x => x.room_id!.Value)
				.Distinct()
				.ToListAsync();

			var occupiedRooms = occupiedRoomIds.Count;
			var availableRooms = totalRooms - occupiedRooms;

			return new RoomOccupancySummaryDto
			{
				TotalRooms = totalRooms,
				AvailableRooms = availableRooms < 0 ? 0 : availableRooms,
				OccupiedRooms = occupiedRooms
			};
		}

		public async Task<List<StayingGuestDto>> GetStayingGuests()
		{
			return await GetDbContext().StayingGuestViews
				.AsNoTracking()
				.OrderBy(x => x.DateStart)
				.Select(x => new StayingGuestDto
				{
					CustomerId = x.CustomerId,
					CustomerName = x.CustomerName,
					Phone = x.Phone,
					BookingId = x.BookingId,
					RoomName = x.RoomName,
					DateStart = x.DateStart,
					DateEnd = x.DateEnd
				})
				.ToListAsync();
		}

		public async Task<List<ServiceTypeDto>> GetServiceTypes()
		{
			return await GetDbContext().ServiceTypes
				.AsNoTracking()
				.OrderBy(x => x.id)
				.Select(x => new ServiceTypeDto
				{
					Id = x.id,
					Name = x.details ?? string.Empty
				})
				.ToListAsync();
		}



        private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}
	}
}
