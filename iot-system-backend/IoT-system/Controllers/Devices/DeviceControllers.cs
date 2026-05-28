using IoT_system.DTOS.Devices;
using IoT_system.Services.Devices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.Devices
{
    [Route("api/device")]
    public class DeviceControllers : ControllerBase
    {
        private readonly DeviceServices deviceServices;

        public DeviceControllers(DeviceServices _deviceServices)
        {
            deviceServices = _deviceServices;
        }

        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("device-list")]
        public async Task<IActionResult> Getdevices([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await deviceServices.ListOfDevices(page, pageSize);
            return Ok(result);
        }

        // ------------- action ----------
        // find by id
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("find-device-by-id/{id}")]
        public async Task<IActionResult> FindDevicdeById(int id)
        {
            var device = await deviceServices.FindDeviceById(id);
            return Ok(device);
        }

        // search
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("search-device")]
        public async Task<IActionResult> SearchDevice([FromQuery] string? keyword, [FromQuery] bool? status)
        {
            var device = await deviceServices.Search(keyword, status);
            return Ok(device);
        }

        // --------- CRUD -----------
        // add
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpPost("add")]
        public async Task<IActionResult> AddDevices([FromBody] DeviceCreateDtos deviceCreateDtos)
        {
            var result = await deviceServices.CreateDevice(deviceCreateDtos);
            return Ok(result);
        }

        // update
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateDevices(int id, [FromBody] DeviceUpdateDtos deviceUpdateDtos)
        {
            var result = await deviceServices.UpdateDevice(id, deviceUpdateDtos);
            return Ok(result);
        }

        // delete
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> RemoveDevices(int id)
        {
            var result = await deviceServices.DeleteDevice(id);
            return Ok(result);
        }
    }
}
