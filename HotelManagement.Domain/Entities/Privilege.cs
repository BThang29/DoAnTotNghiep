using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Privilege
    {
        public Privilege()
        {
            RolePrivileges = new HashSet<RolePrivilege>();
            UserPrivileges = new HashSet<UserPrivilege>();
        }

        [StringLength(50)]
        public string Id { get; set; }
        [Required]
        [StringLength(250)]
        public string Name { get; set; }
        [StringLength(4000)]
        public string Description { get; set; }
        public bool? Status { get; set; }

        [InverseProperty("Privilege")]
        public virtual ICollection<RolePrivilege> RolePrivileges { get; set; }
        [InverseProperty("Privilege")]
        public virtual ICollection<UserPrivilege> UserPrivileges { get; set; }
    }

    public enum PrivilegeList
    {
        [Description("Xem người dùng")]
        ViewUser,
        [Description("Quản lý người dùng")]
        ManageUser,
        [Description("Xem nhóm người dùng")]
        ViewRole,
        [Description("Quản lý nhóm người dùng")]
        ManageRole,
        [Description("Xem nhân viên")]
        ViewEmployee,
        [Description("Quản lý nhân viên")]
        ManageEmployee,
        [Description("Xem khách hàng")]
        ViewCustomer,
        [Description("Quản lý khách hàng")]
        ManageCustomer,
        [Description("Xem phòng")]
        ViewRoom,
        [Description("Quản lý phòng")]
        ManageRoom,
        [Description("Xem đặt phòng")]
        ViewBooking,
        [Description("Quản lý đặt phòng")]
        ManageBooking,
        [Description("Nhận phòng")]
        CheckIn,
        [Description("Trả phòng")]
        CheckOut,
        [Description("Xem hóa đơn")]
        ViewInvoice,
        [Description("Quản lý hóa đơn")]
        ManageInvoice,
        [Description("Tạo hóa đơn")]
        CreateInvoice,
        [Description("Xem thanh toán")]
        ViewPayment,
        [Description("Quản lý thanh toán")]
        ManagePayment,
        [Description("Xem dịch vụ")]
        ViewService,
        [Description("Quản lý dịch vụ")]
        ManageService,
        [Description("Cập nhật sử dụng dịch vụ")]
        UpdateServiceUsage,
        [Description("Xem hỗ trợ khách hàng")]
        ViewCustomerSupport,
        [Description("Xem dashboard")]
        ViewDashboard,
        [Description("Xem báo cáo")]
        ViewReport,
        [Description("Xem báo cáo doanh thu")]
        ViewRevenueReport,
        [Description("Xuất báo cáo tài chính")]
        ExportFinancialReport,
        [Description("Đăng ký tài khoản")]
        RegisterAccount,
        [Description("Đăng nhập")]
        LoginAccount,
        [Description("Xem giá phòng")]
        ViewRoomPrice,
        [Description("Tạo đặt phòng")]
        CreateBooking,
        [Description("Thanh toán online")]
        OnlinePayment,
        [Description("Xem lịch sử đặt phòng")]
        ViewBookingHistory,
        [Description("Gửi phản hồi")]
        SubmitFeedback
    }
}
