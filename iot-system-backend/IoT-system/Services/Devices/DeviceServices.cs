using IoT_system.DTOS.Devices;
using IoT_system.DTOS.MQTT;
using Microsoft.Extensions.Configuration.UserSecrets;

namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        public Task<List<PendingDeviceDto>> GetPendingDevices(int userId);
        public Task<bool> ClaimDevice(int deviceId, int userId);

        // tách riêng connect - disconnect
        public Task<DeviceResponseDtos> ConnectDevice(int userId, int deviceId);
        public Task<DeviceResponseDtos> DisconnectDevice(int userId, int deviceId);
        public Task<DeviceResponseDtos?> GetConnectedDeviceAsync(int userId);
    }
}