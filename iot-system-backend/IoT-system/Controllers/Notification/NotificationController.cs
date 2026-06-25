using IoT_system.Services.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IoT_system.Controllers.Notification
{
    [Route("api/notification")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationServices notificationServices;

        public NotificationController(NotificationServices _notificationServices)
        {
            notificationServices = _notificationServices;
        }
        // admin
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("admin-history")]
        public async Task<IActionResult> GetHistoryForAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await notificationServices.HistoryForAdmin(page, pageSize);
            return Ok(result);
        }

        // user
        [Authorize(Roles = "user")]
        [Produces("application/json")]
        [HttpGet("user-history")]
        public async Task<IActionResult> GetHistoryForUser([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await notificationServices.HistoryForUser(userId, page, pageSize);
            return Ok(result);
        }

    }
}
