using System.ComponentModel;
using DoAnWebQuanLyKhachSan.Utils.Common;

namespace DoAnWebQuanLyKhachSan.Data
{
    public class HotelManagementException : ApplicationException
    {
        public HotelManagementException(HotelManagementExceptionCode code, params object[] args) : base(string.Format(code.GetEnumDescription(), args)) { }

        public HotelManagementException(string message) : base(message) { }
    }

    public enum HotelManagementExceptionCode
    {
        [Description("Không thể xóa {0} do có dữ liệu liên quan.")]
        DeleteRecordWithRelatedData = 1
    }
}
