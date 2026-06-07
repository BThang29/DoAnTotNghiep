using DoAnWebQuanLyKhachSan.Service.Dtos.Others;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard
{
	public class DashboardSummaryDto
	{
		public RevenueSummaryDto Revenue { get; set; } = new();
		public RoomOccupancySummaryDto Rooms { get; set; } = new();
		public int StayingGuestCount { get; set; }
		public List<ServiceTypeDto> ServiceTypes { get; set; } = new();
	}
}
