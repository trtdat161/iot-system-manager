using IoT_system.Services.Notifications;
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

        // thông báo chi tiết
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("history-detail/{id}")]
        public async Task<IActionResult> GetHistoryDetail(int id)
        {
            var result = await notificationServices.HistoryDetail(id);
            return Ok(result);
        }

        // searhc + filter story
        [Authorize]
        [Produces("application/json")]
        [HttpGet("search-history")]
        public async Task<IActionResult> SearchGetHistory([FromQuery] DateTime? fromDate = null, 
                                                          [FromQuery] DateTime? toDate = null, 
                                                          [FromQuery] bool? isRead = null, 
                                                          [FromQuery] string? type = null,
                                                          [FromQuery] int page = 1,
                                                          [FromQuery] int pageSize = 10)
        {
            var result = await notificationServices.SearchHistory(fromDate, toDate, isRead, type, page, pageSize);
            return Ok(result);
        }
    }
}
