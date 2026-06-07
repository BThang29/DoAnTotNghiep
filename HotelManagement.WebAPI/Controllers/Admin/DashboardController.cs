using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.API.Controllers.Admin
{
	[Route("api/admin/dashboard")]
	[Authorize]
	public class DashboardController : BaseController
	{
		private readonly DashboardService _dashboardService;

		/// <summary>
		/// Khởi tạo controller dashboard thống kê.
		/// </summary>
		public DashboardController(DashboardService dashboardService)
		{
			_dashboardService = dashboardService;
		}

		/// <summary>
		/// Lấy dữ liệu tổng quan dashboard.
		/// </summary>
		[HttpGet("summary")]
		[CustomAuthorize(PrivilegeList.ViewDashboard, PrivilegeList.ViewReport, PrivilegeList.ViewRevenueReport)]
		public async Task<ApiResult<DashboardSummaryDto>> GetSummary()
		{
			return Success(await _dashboardService.GetSummary(), "Lay du lieu tong quan thanh cong.");
		}

		/// <summary>
		/// Lấy thống kê doanh thu.
		/// </summary>
		[HttpGet("revenue")]
		[CustomAuthorize(PrivilegeList.ViewDashboard, PrivilegeList.ViewReport, PrivilegeList.ViewRevenueReport)]
		public async Task<ApiResult<RevenueSummaryDto>> GetRevenue()
		{
			return Success(await _dashboardService.GetRevenueSummary(), "Lay thong ke doanh thu thanh cong.");
		}

		/// <summary>
		/// Lấy thống kê phòng trống và đang thuê.
		/// </summary>
		[HttpGet("rooms")]
		[CustomAuthorize(PrivilegeList.ViewDashboard, PrivilegeList.ViewReport)]
		public async Task<ApiResult<RoomOccupancySummaryDto>> GetRooms()
		{
			return Success(await _dashboardService.GetRoomOccupancySummary(), "Lay thong ke phong thanh cong.");
		}

		/// <summary>
		/// Lấy danh sách khách đang lưu trú.
		/// </summary>
		[HttpGet("staying-guests")]
		[CustomAuthorize(PrivilegeList.ViewDashboard, PrivilegeList.ViewReport, PrivilegeList.ViewCustomer)]
		public async Task<ApiResult<List<StayingGuestDto>>> GetStayingGuests()
		{
			return Success(await _dashboardService.GetStayingGuests(), "Lay danh sach khach dang luu tru thanh cong.");
		}
	}
}
