using IoT_system.Models;
using IoT_system.Configurations.mqtt;
using Microsoft.EntityFrameworkCore;
using IoT_system.DTOS.Devices;
namespace IoT_system.Services.Devices
{
    public class DeviceServiceImpl : DeviceServices
    {
        private readonly DatabaseContext db;
        private readonly MqttClient mqtt;
        public DeviceServiceImpl(DatabaseContext _db, MqttClient _mqtt)
        {
            db = _db;
            mqtt = _mqtt;
        }
        public async Task<List<PendingDeviceDto>> GetPendingDevices()
        {
            return await db.Devices
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
            var device = await db.Devices.FirstOrDefaultAsync(x => x.Id == deviceId);
            if (device == null)
            {
                return false;
            }

            var user = await db.Accounts.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null)
            {
                return false;
            }

            user.DeviceId = device.Id;
            device.IsClaimed = true;// set lại = true khi đã connect thiết bị

            await db.SaveChangesAsync();
            await mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "claimed"
            );
            return true;
        }
    }
}