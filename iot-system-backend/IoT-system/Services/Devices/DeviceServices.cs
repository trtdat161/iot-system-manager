using IoT_system.DTOS.Devices;

namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        public Task<List<DeviceResponseDtos>> listOfDevices();

        // ----------- CRUD -----------
        public Task<DeviceResponseDtos> createDevice(DeviceCreateDtos deviceCreateDtos);
        public Task<DeviceResponseDtos> updateDevice(int id, DeviceUpdateDtos deviceUpdateDtos);
        public Task<bool> deleteDevice(int id);
    }
}
