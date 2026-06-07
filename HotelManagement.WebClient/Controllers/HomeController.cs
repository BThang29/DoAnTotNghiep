using DoAnWebQuanLyKhachSan.WebAppClient.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace DoAnWebQuanLyKhachSan.WebAppClient.Controllers
{
	public class HomeController : Controller
	{
		public IActionResult Index()
		{
			return View();
		}

        public IActionResult AboutUs()
        {
            return View();
        }

        public IActionResult Blog()
        {
            return View();
        }

        public IActionResult Contact()
        {
            return View();
        }

        public IActionResult Services()
        {
            return View();
        }
    }
}
