using AutoMapper;
using IoT_system.Configurations.mqtt;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Devices;
using IoT_system.Helper;
using IoT_system.Helpers;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;
namespace IoT_system.Services.Devices
{
    public class DeviceServiceImpl : DeviceServices
    {
        private readonly DatabaseContext db;
        private readonly MqttClient mqtt;
        private readonly IMapper mapper;
        private readonly int onlineWindowSeconds = 30; // ESP im lặng quá 30 giây thì coi là offline

        public DeviceServiceImpl(DatabaseContext _db, MqttClient _mqtt, IMapper _mapper)
        {
            db = _db;
            mqtt = _mqtt;
            mapper = _mapper;
        }

        // kiểm tra device có đang online không (dựa vào lần cuối ESP gửi tin lên)
        private bool IsOnline(DateTime? lastSeenAt)
        {
            // Chưa từng nghe thấy ESP kêu lần nào
            if (lastSeenAt == null)
            {
                return false;
            }

            // Mốc giới hạn = bây giờ trừ 30 giây
            DateTime limitTime = TimeHelper.VnNow().AddSeconds(-onlineWindowSeconds);

            return lastSeenAt.Value >= limitTime;
        }

        public async Task<List<PendingDeviceDto>> GetPendingDevices(int userId)
        {
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid!");
            }

            // Mốc giới hạn = bây giờ trừ 30 giây
            DateTime limitTime = TimeHelper.VnNow().AddSeconds(-onlineWindowSeconds);

            // Lấy danh sách thiết bị đang online và chưa được liên kết với tài khoản này
            return await db.Devices
                .AsNoTracking()
                .Where(d =>
                    d.LastSeenAt != null &&
                    d.LastSeenAt >= limitTime &&
                    !d.Accounts.Any(a => a.Id == userId)) // phủ đinh lại kiểu nếu user có rồi thì sẽ true => false muc đích để lọc và hiển thị ra thiết bị chưa được liên kết với tài khoản 
                .Select(d => new PendingDeviceDto
                {
                    Id = d.Id,
                    MacAddress = d.MacAddress,
                    IsClaimed = d.IsClaimed // để FE biết gọi Claim (lần đầu) hay Connect (tham gia lại)
                })
                .ToListAsync();
        }

        public async Task<bool> ClaimDevice(int deviceId, int userId)
        {
            if (deviceId <= 0 || userId <= 0)
                return false;

            var user = await db.Accounts
                .FirstOrDefaultAsync(a => a.Id == userId && a.DeletedAt == null);

            if (user == null)
                return false;

            var device = await db.Devices
                .FirstOrDefaultAsync(d => d.Id == deviceId);

            if (device == null)
                return false;

            // Device offline sẽ không nhận được lệnh "claimed" -> không cho claim
            if (!IsOnline(device.LastSeenAt))
            {
                return false;
            }

            // User đã kết nối device này rồi
            if (user.DeviceId == deviceId)
                return false;

            // User phải disconnect device hiện tại trước ---------
            if (user.DeviceId.HasValue)
                return false;

            // Device đã được claim thì không claim lại
            // Các user khác sử dụng ConnectDevice().
            if (device.IsClaimed)
                return false;

            device.IsClaimed = true;
            user.DeviceId = deviceId;
            user.LastDeviceId = deviceId; // MỚI: ghi nhớ thiết bị gần nhất

            await db.SaveChangesAsync();

            await mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "claimed",
                retained: true);

            return true;
        }

        // connect 
        public async Task<DeviceResponseDtos> ConnectDevice(int userId, int deviceId)
        {
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid!");
            }

            if (deviceId <= 0)
            {
                throw new BadHttpRequestException("deviceId invalid!");
            }

            var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == userId && a.DeletedAt == null);

            if (account == null)
            {
                throw new BadHttpRequestException("Account not found!");
            }

            var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == deviceId);

            if (device == null)
            {
                throw new BadHttpRequestException("Device not found!");
            }

            // Đã kết nối đúng device này
            if (account.DeviceId == deviceId)
            {
                throw new BadHttpRequestException("Already connected to this device!");
            }

            // phải disconnect trước
            if (account.DeviceId.HasValue)
            {
                throw new BadHttpRequestException("Please disconnect from your current device first!");
            }

            // Chỉ kết nối được device đã claim
            if (!device.IsClaimed)
            {
                throw new BadHttpRequestException("The device has not been claimed. Please claim it first!");
            }

            account.DeviceId = deviceId;
            account.LastDeviceId = deviceId; // MỚI: ghi nhớ thiết bị gần nhất
            await db.SaveChangesAsync();
            // Đồng bộ trạng thái CLAIMED xuống ESP qua MQTT
            await mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "claimed",
                retained: true);

            return mapper.Map<DeviceResponseDtos>(device);
        }

        public async Task<DeviceResponseDtos> DisconnectDevice(int userId, int deviceId)
        {
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid!");
            }

            if (deviceId <= 0)
            {
                throw new BadHttpRequestException("deviceId invalid!");
            }

            var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == userId && a.DeletedAt == null);

            if (account == null)
            {
                throw new BadHttpRequestException("Account not found!");
            }

            var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == deviceId);

            if (device == null)
            {
                throw new BadHttpRequestException("Device not found!");
            }

            // User không kết nối device này.
            if (account.DeviceId != deviceId)
            {
                throw new BadHttpRequestException("The user is not connected to this device!");
            }

            // Chỉ xóa DeviceId (ngừng nhận cảnh báo), KHÔNG xóa LastDeviceId để còn nối lại được
            account.DeviceId = null;
            await db.SaveChangesAsync();

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // Trả về thiết bị của user: đang connected thì lấy thiết bị hiện tại, đã disconnect thì lấy thiết bị gần nhất
        public async Task<DeviceResponseDtos?> GetConnectedDeviceAsync(int userId)
        {
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid!");
            }

            // MỚI: đọc account trước để biết đang connected hay không
            var account = await db.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == userId && a.DeletedAt == null);

            if (account == null)
            {
                return null;
            }

            // Đang connected thì dùng DeviceId, đã disconnect thì dùng LastDeviceId
            int? deviceId = account.DeviceId ?? account.LastDeviceId;

            // User chưa từng có thiết bị nào
            if (deviceId == null)
            {
                return null;
            }

            var device = await db.Devices
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == deviceId.Value);

            if (device == null)
            {
                return null;
            }

            return new DeviceResponseDtos
            {
                Id = device.Id,
                MacAddress = device.MacAddress,
                IsConnected = account.DeviceId != null // FE dựa vào cờ này để khóa/mở nút
            };
        }


        public async Task<PagedResponseDtos<DeviceResponseDtos>> GetStatusDevice(int page, int pageSize, string? status)
        {
            var query = db.Devices.AsNoTracking();
            var threshold = DateTime.UtcNow.AddSeconds(-30);

            if (status == "online")
            {
                query = query.Where(d => d.LastSeenAt >= threshold); 
                // thời điểm hiện tại - đi 30s, có heartbeat trong 30 giây gần nhất -> Online
            }

            else if(status == "offline")
            {
                query = query.Where(d => d.LastSeenAt == null || d.LastSeenAt < threshold);
                // Không có heartbeat trong vòng 30 giây gần nhất -> Offline
            }

            return await PaginationHelper.GetPagedAsync<Device, DeviceResponseDtos>(
                query.OrderByDescending(d => d.CreatedAt), page, pageSize, mapper);
        } 

    }
}