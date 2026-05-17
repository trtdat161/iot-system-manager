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
        [HttpGet("list")]
        public async Task<IActionResult> Getdevices()
        {
            var result = await deviceServices.listOfDevices();
            return Ok(result);
        }

        // --------- CRUD -----------
        // add
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpPost("add")]
        public async Task<IActionResult> AddDevices([FromBody] DeviceCreateDtos deviceCreateDtos)
        {
            var result = await deviceServices.createDevice(deviceCreateDtos);
            return Ok(result);
        }

        // update
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateDevices(int id, [FromBody] DeviceUpdateDtos deviceUpdateDtos)
        {
            var result = await deviceServices.updateDevice(id, deviceUpdateDtos);
            return Ok(result);
        }

        // delete
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> RemoveDevices(int id)
        {
            var result = await deviceServices.deleteDevice(id);
            return Ok(result);
        }
    }
}
