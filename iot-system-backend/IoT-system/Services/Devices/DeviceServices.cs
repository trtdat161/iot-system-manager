using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
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

        // hiển thị các thiết bị có trong hệ thống và trạng thái on + off
        public Task<PagedResponseDtos<DeviceResponseDtos>> GetStatusDevice(int page, int pageSize, string? status); // dashboard admin list user
    }
}