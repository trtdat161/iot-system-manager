using AutoMapper;
using IoT_system.Configurations.mqtt;
using IoT_system.DTOS.Devices;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;
namespace IoT_system.Services.Devices
{
    public class DeviceServiceImpl : DeviceServices
    {
        private readonly DatabaseContext db;
        private readonly MqttClient mqtt;
        private readonly IMapper mapper;

        public DeviceServiceImpl(DatabaseContext _db, MqttClient _mqtt, IMapper _mapper)
        {
            db = _db;
            mqtt = _mqtt;
            mapper = _mapper;
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

        // connect disconnect
        public async Task<DeviceResponseDtos> ConnectOrDisconnect(int userId, int deviceId)
        {
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid !");
            }
            if (deviceId <= 0)
            {
                throw new BadHttpRequestException("deviceId invalid !");
            }

            var account = await db.Accounts.FindAsync(userId);
            if (account is null)
            {
                throw new BadHttpRequestException("Account not found !");
            }

            var device = await db.Devices.FindAsync(deviceId);
            if (device is null)
            {
                throw new BadHttpRequestException("Device not found !");
            }

            bool isConnected = account.DeviceId == deviceId;

            if (isConnected)
            {
                // ---- DISCONNECT ----
                account.DeviceId = null;
                await db.SaveChangesAsync();
                await SyncDeviceClaimStatusAsync(deviceId);
            }
            else
            {
                // ---- CONNECT (có thể đang connect device khác, cho chuyển thẳng) ----
                if (!device.IsClaimed)
                {
                    throw new BadHttpRequestException("The device has not been claimed, please claim it before connecting !");
                }

                int? oldDeviceId = account.DeviceId; // lưu lại device cũ TRƯỚC khi ghi đè

                account.DeviceId = deviceId;
                await db.SaveChangesAsync();

                // nếu trước đó đang connect device khác -> dọn dẹp trạng thái claim của device cũ
                if (oldDeviceId.HasValue && oldDeviceId.Value != deviceId)
                {
                    await SyncDeviceClaimStatusAsync(oldDeviceId.Value);
                }
            }

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // Hàm dọn dẹp trạng thái claim của 1 device sau khi có người rời đi
        private async Task SyncDeviceClaimStatusAsync(int deviceId)
        {
            // nếu vẫn còn người dùng đang hoạt động
            bool stillHasActiveUser = await db.Accounts.AnyAsync(a => a.DeviceId == deviceId && a.DeletedAt == null);

            if (!stillHasActiveUser)
            {
                var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == deviceId);
                if (device is not null && device.IsClaimed)
                {
                    // báo lại status vào db
                    device.IsClaimed = false;
                    await db.SaveChangesAsync();

                    // báo cho thiết bị thật biết để nó tự unclaim
                    await mqtt.PublishAsync(
                        $"devices/{device.MacAddress}/command",
                        "unclaim",
                        retained: true
                    );
                }
            }
        }
    }
}