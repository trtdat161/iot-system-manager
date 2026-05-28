using IoT_system.DTOS.Common;
using IoT_system.DTOS.Devices;

namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        public Task<PagedResponseDtos<DeviceResponseDtos>> ListOfDevices(int page, int sizePage);
        public Task<DeviceResponseDtos> FindDeviceById(int id);
        public Task<List<DeviceResponseDtos>> Search(string? keyword, bool? status);

        // ----------- CRUD -----------
        public Task<DeviceResponseDtos> CreateDevice(DeviceCreateDtos deviceCreateDtos);
        public Task<DeviceResponseDtos> UpdateDevice(int id, DeviceUpdateDtos deviceUpdateDtos);
        public Task<bool> DeleteDevice(int id);
    }
}
