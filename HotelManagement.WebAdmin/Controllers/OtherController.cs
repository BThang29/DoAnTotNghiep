using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class OtherController : Controller
    {
        public IActionResult Services()
        {
            return View();
        }

        public IActionResult CreateService()
        {
            return View();
        }

        public IActionResult ServiceTypes()
        {
            return View();
        }
    }
}
