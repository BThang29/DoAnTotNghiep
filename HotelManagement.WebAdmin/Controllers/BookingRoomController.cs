using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class BookingRoomController : Controller
    {
        public IActionResult BookingRoom()
        {
            return View();
        }

        public IActionResult CreateBookingRoom()
        {
            return View();
        }

        public IActionResult CheckAvailableRoom()
        {
            return View();
        }

        public IActionResult Deposit()
        {
            return View();
        }
    }
}
