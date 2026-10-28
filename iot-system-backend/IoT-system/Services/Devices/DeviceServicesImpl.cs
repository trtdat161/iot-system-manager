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
            if (userId <= 0)
            {
                throw new BadHttpRequestException("userId invalid!");
            }
            // Lấy danh sách thiết bị chưa được liên kết với tài khoản
            return await db.Devices
                .AsNoTracking()
                .Where(d =>
                    d.DeletedAt == null &&
                    !d.Accounts.Any(a => a.Id == userId)) // phủ đinh lại kiểu nếu user có rồi thì sẽ true => false muc đích để lọc và hiển thị ra thiết bị chưa được liên kết với tài khoản 
                .Select(d => new PendingDeviceDto
                {
                    Id = d.Id,
                    MacAddress = d.MacAddress
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
                .FirstOrDefaultAsync(d => d.Id == deviceId && d.DeletedAt == null);

            if (device == null)
                return false;

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

            await db.SaveChangesAsync();

            await mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "claimed",
                retained: true);

            await Task.Delay(500);

            await mqtt.PublishAsync(
                $"devices/{device.MacAddress}/command",
                "",
                retained: true);

            return true;
        }

        // connect disconnect
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
                throw new BadHttpRequestException("Account not found!");

            var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == deviceId && d.DeletedAt == null);

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
            await db.SaveChangesAsync();

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

            var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == deviceId && d.DeletedAt == null);

            if (device == null)
            {
                throw new BadHttpRequestException("Device not found!");
            }

            // User không kết nối device này.
            if (account.DeviceId != deviceId)
            {
                throw new BadHttpRequestException("The user is not connected to this device!");
            }

            account.DeviceId = null;
            await db.SaveChangesAsync();

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // Hàm dọn dẹp trạng thái claim của 1 device sau khi có người rời đi
        
    }
}