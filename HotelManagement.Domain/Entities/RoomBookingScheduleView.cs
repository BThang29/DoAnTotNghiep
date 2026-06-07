using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class RoomBookingScheduleView
    {
        public int BookingId { get; set; }
        public int RoomId { get; set; }
        public DateTime? DateStart { get; set; }
        public DateTime? DateEnd { get; set; }
    }
}
