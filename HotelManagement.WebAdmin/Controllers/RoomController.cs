using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class RoomController : Controller
    {
        public IActionResult Rooms()
        {
            return View();
        }

        public IActionResult CreateRoom()
        {
            return View();
        }

        public IActionResult RoomTypes()
        {
            return View();
        }

        public IActionResult RoomStatuses()
        {
            return View();
        }
    }
}
