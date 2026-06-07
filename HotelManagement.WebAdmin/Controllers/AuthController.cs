using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
	public class AuthController : Controller
	{
		// GET: AuthController
		public ActionResult Login()
		{
			return View();
		}

		// GET: AuthController/Register
		public ActionResult Register()
		{
			return View();
		}
	}
}
