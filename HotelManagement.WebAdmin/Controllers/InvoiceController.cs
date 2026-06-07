using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class InvoiceController : Controller
    {
        public IActionResult Invoices()
        {
            return View();
        }

        public IActionResult CreateInvoice()
        {
            return View();
        }
    }
}
