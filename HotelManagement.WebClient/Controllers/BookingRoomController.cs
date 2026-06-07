using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
	public class BookingRoomController : Controller
	{
		public IActionResult AvailableRooms()
		{
			return View();
		}

        public IActionResult CreateBooking()
        {
            return View();
        }
    }
}
