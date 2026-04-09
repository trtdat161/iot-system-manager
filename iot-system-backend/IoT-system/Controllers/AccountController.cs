using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
