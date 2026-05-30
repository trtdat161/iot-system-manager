using IoT_system.Services.DashboardAdmin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.DashboardAdmin
{
    [Route("api/dashboard-admin")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardAdminServices dashboardAdminServices; 

        public DashboardController(DashboardAdminServices _dashboardAdminServices) {
            dashboardAdminServices = _dashboardAdminServices;
        }

        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("overview")]
        public async Task<IActionResult> TotalDeviceAndUser()
        {
            var result = await dashboardAdminServices.DashboardAdmin();
            return Ok(result);
        }
    }
}
