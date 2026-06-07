using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Utils.Repository;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using Microsoft.Extensions.Logging;

namespace DoAnWebQuanLyKhachSan.Data
{
    public class HotelManagementRepository : Repository<HotelManagementContext, User, int>
    {
        public HotelManagementRepository(HotelManagementContext dbContext, IUserIdentity<int> currentUser, ILogger<HotelManagementRepository> logger) : base(dbContext, currentUser, logger)
        {

        }
    }
}
