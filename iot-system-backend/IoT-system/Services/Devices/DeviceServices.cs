using IoT_system.DTOS.Devices;
using IoT_system.DTOS.MQTT;

namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        Task<List<PendingDeviceDto>> GetPendingDevices();
        Task<bool> ClaimDevice(int deviceId, int userId);
    }
}