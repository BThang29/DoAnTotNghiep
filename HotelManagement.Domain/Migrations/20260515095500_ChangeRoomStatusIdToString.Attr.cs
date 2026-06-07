using DoAnWebQuanLyKhachSan.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DoAnWebQuanLyKhachSan.Data.Migrations
{
    [DbContext(typeof(HotelManagementContext))]
    [Migration("20260515095500_ChangeRoomStatusIdToString")]
    partial class ChangeRoomStatusIdToString
    {
    }
}
