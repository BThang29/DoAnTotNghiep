using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
    public class UserSystemController : Controller
    {
        public IActionResult ChangePassword()
        {
            return View();
        }
    }
}
