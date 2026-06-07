using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
    public class BookingHistoryController : Controller
    {
        public IActionResult History()
        {
            return View();
        }
    }
}
