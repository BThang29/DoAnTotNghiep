using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class RoleController : Controller
    {
        public IActionResult Roles()
        {
            return View();
        }
    }
}
