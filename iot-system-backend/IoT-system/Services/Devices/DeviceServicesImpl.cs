using IoT_system.Models;
using IoT_system.Configurations.mqtt;

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

        public async Task<List<object>> GetPendingDevices()
        {
            return _db.Devices
                .Where(x => !x.IsClaimed)
                .Select(x => new
                {
                    x.Id,
                    x.MacAddress
                })
                .ToList<object>();
        }

        public async Task<bool> ClaimDevice(int deviceId, int userId)
        {
            var device = _db.Devices.FirstOrDefault(x => x.Id == deviceId);
            if (device == null) return false;

            var user = _db.Accounts.FirstOrDefault(x => x.Id == userId);
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