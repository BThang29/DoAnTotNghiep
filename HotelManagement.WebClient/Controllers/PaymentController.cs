using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
    public class PaymentController : Controller
    {
        public IActionResult Checkout()
        {
            return View();
        }
    }
}
