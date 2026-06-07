using DoAnWebQuanLyKhachSan.Data;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class RoomAvailabilitySynchronizationService
    {
        private const string AvailableStatus = "AVAILABLE";
        private const string OccupiedStatus = "OCCUPIED";
        private const string MaintenanceStatus = "MAINTENANCE";

        private readonly HotelManagementRepository _repository;

        public RoomAvailabilitySynchronizationService(HotelManagementRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> SyncRoomStatusesAsync()
        {
            var db = GetDbContext();
            var now = DateTime.Now;
            var today = now.Date;

            var expiredPendingBookings = await db.Bookings
                .Where(x => x.booking_status == ClientBookingStatus.PendingPayment
                    && x.booking_exprire.HasValue
                    && x.booking_exprire.Value <= now)
                .ToListAsync();

            foreach (var booking in expiredPendingBookings)
            {
                booking.booking_status = ClientBookingStatus.Cancelled;
            }

            var occupiedRoomIds = await db.Bookings
                .AsNoTracking()
                .Where(x => x.room_id.HasValue
                    && x.booking_status != ClientBookingStatus.Cancelled
                    && (
                        (x.booking_status == ClientBookingStatus.PendingPayment
                            && x.booking_exprire.HasValue
                            && x.booking_exprire.Value > now)
                        || (x.booking_status == ClientBookingStatus.Paid
                            && x.date_start.HasValue
                            && x.date_end.HasValue
                            && x.date_start.Value.Date <= today
                            && today <= x.date_end.Value.Date)
                    ))
                .Select(x => x.room_id!.Value)
                .Distinct()
                .ToListAsync();

            var occupiedRoomIdSet = occupiedRoomIds.ToHashSet();
            var rooms = await db.Rooms
                .Where(x => x.room_status != MaintenanceStatus)
                .ToListAsync();

            var updatedCount = 0;
            foreach (var room in rooms)
            {
                var targetStatus = occupiedRoomIdSet.Contains(room.id)
                    ? OccupiedStatus
                    : AvailableStatus;

                if (string.Equals(room.room_status, targetStatus, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                room.room_status = targetStatus;
                updatedCount++;
            }

            if (expiredPendingBookings.Count > 0 || updatedCount > 0)
            {
                await db.SaveChangesAsync();
            }

            return updatedCount + expiredPendingBookings.Count;
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }
    }
}
