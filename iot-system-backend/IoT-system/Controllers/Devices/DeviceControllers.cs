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

    }
}
