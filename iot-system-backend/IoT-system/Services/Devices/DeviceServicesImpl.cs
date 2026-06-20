using IoT_system.Models;
using IoT_system.Configurations.mqtt;
using Microsoft.EntityFrameworkCore;
using IoT_system.DTOS.Devices;
namespace IoT_system.Services.Devices
{
    public class DeviceServiceImpl : DeviceServices
    {
        private readonly DatabaseContext _db;
        private readonly MqttClient _mqtt;
        public DeviceServiceImpl(DatabaseContext db, MqttClient mqtt)
        {
            _db = db;
            _mqtt = mqtt;
        }
        public async Task<List<PendingDeviceDto>> GetPendingDevices()
        {
            return await _db.Devices
                .Where(x => !x.IsClaimed)
                .Select(x => new PendingDeviceDto
                {
                    Id = x.Id,
                    MacAddress = x.MacAddress
                })
                .ToListAsync();
        }
        public async Task<bool> ClaimDevice(int deviceId, int userId)
        {
            var device = await _db.Devices.FirstOrDefaultAsync(x => x.Id == deviceId);
            if (device == null) return false;

            var user = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return false;

            user.DeviceId = device.Id;
            device.IsClaimed = true;

            await _db.SaveChangesAsync();
            await _mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "claimed"
            );
            return true;
        }
    }
}