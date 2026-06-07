using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class ReviewController : Controller
    {
        public ActionResult Reviews()
        {
            return View();
        }
    }
}
