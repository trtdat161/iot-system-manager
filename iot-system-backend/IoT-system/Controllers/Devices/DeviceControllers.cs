using IoT_system.Services.Devices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IoT_system.Controllers.Devices
{
    [Route("api/device")]
    public class DeviceControllers : ControllerBase
    {
        private readonly DeviceServices deviceService;

        public DeviceControllers(DeviceServices _deviceService)
        {
            deviceService = _deviceService;
        }

        [HttpGet("pending")]
        [Produces("application/json")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> Pending()
        {
            var data = await deviceService.GetPendingDevices();
            return Ok(data);
        }

        [HttpPost("claim")]
        [Produces("application/json")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> Claim([FromBody] int deviceId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var ok = await deviceService.ClaimDevice(deviceId, userId);

            if (!ok)
                return NotFound();

            return Ok(new { message = "claimed" });
        }
    }
}