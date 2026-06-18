namespace IoT_system.Services.Devices
{
    public interface DeviceServices
    {
        Task<List<object>> GetPendingDevices();
        Task<bool> ClaimDevice(int deviceId, int userId);
    }
}