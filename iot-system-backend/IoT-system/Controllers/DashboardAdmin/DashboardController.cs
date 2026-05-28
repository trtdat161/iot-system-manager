using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.DashboardAdmin
{
    [Route("api/dashboard-admin")]
    public class DashboardController : ControllerBase
    {
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("total-device-user")]
        public async Task<IActionResult> TotalDeviceAndUser()
        {
            
        }
    }
}
