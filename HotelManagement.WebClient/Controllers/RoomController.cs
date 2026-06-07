using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
    public class RoomController : Controller
    {
        public IActionResult Rooms()
        {
            return View();
        }

        public IActionResult RoomDetail()
        {
            return View();
        }
    }
}
