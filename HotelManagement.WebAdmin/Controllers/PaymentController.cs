using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class PaymentController : Controller
    {
        public IActionResult Payments()
        {
            return View();
        }

        public IActionResult PaymentQr()
        {
            return View();
        }
    }
}
