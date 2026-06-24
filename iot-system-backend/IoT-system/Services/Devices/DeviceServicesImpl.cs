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
        public async Task<List<PendingDeviceDto>> GetPendingDevices(int userId)
        {
            return await db.Devices
                .AsNoTracking()
                .Where(x => x.DeletedAt == null && x.Accounts.All(a => a.Id != userId))
                // device mà user này chưa join
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
            if (device == null) return false;

            var user = await db.Accounts.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return false;

            // User này đã join device này rồi
            if (user.DeviceId == deviceId) return false;

            user.DeviceId = deviceId;

            // Chỉ publish MQTT lần đầu tiên có người claim
            if (!device.IsClaimed)
            {
                device.IsClaimed = true;
                await mqtt.PublishAsync(
                    $"devices/{device.MacAddress}/command",
                    "claimed", 
                    retained: true
                );

                await Task.Delay(500);
                await mqtt.PublishAsync(
                    $"devices/{device.MacAddress}/command",
                    "", 
                    retained: true
                ); // xóa retained
            }

            await db.SaveChangesAsync();
            return true;
        }
    }
}