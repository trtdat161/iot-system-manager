using IoT_system.DTOS.Devices;
using IoT_system.DTOS.MQTT;

namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        public Task<List<PendingDeviceDto>> GetPendingDevices(int userId);
        public Task<bool> ClaimDevice(int deviceId, int userId);
    }
}