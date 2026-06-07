using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class UserSystemController : Controller
    {
        public IActionResult Information()
        {
            return View();
        }

        public IActionResult UserSystem()
        {
            return View();
        }

        public IActionResult ChangePassword()
        {
            return View("UserSystem");
        }
    }
}
