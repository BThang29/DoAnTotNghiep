using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class CustomerController : Controller
    {
        public IActionResult Customers()
        {
            return View();
        }

        public IActionResult CreateCustomer()
        {
            return View();
        }
    }
}
