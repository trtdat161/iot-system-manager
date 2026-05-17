using AutoMapper;
using IoT_system.DTOS.Devices;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Devices
{
    public class DeviceServicesImpl : DeviceServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;

        public DeviceServicesImpl(DatabaseContext _dbContext, IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }
        public async Task<List<DeviceResponseDtos>> listOfDevices()
        {
            var devices = await dbContext.Devices.Where(d => d.DeletedAt == null).AsNoTracking().ToListAsync();
            return mapper.Map<List<DeviceResponseDtos>>(devices);
        }

        // --------- CRUD ----------

        // add device
        public async Task<DeviceResponseDtos> createDevice(DeviceCreateDtos deviceCreateDtos)
        {
            if (string.IsNullOrWhiteSpace(deviceCreateDtos.Name))
            {
                throw new BadHttpRequestException("name device is required");
            }
            /*
            map
            ko cần gán .name vì mapper đã map các field sẵn trong dto qua model
            vì do dto có field name nên khi map nó map cả .name qua nên ta chỉ cần map lại các field chưa có là đc
             */
            var device = mapper.Map<Device>(deviceCreateDtos); 
            device.Status = false;
            device.CreatedAt = DateTime.UtcNow;
            device.LastSeenAt = null;

            dbContext.Devices.Add(device);
            await dbContext.SaveChangesAsync();

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // update device
        public async Task<DeviceResponseDtos> updateDevice(int id, DeviceUpdateDtos deviceUpdateDtos)
        {
            if(id <= 0)
            {
                throw new BadHttpRequestException("id invalid");
            }

            if (string.IsNullOrWhiteSpace(deviceUpdateDtos.Name))
            {
                throw new BadHttpRequestException("name device if required");
            }

            var device = await dbContext.Devices.FindAsync(id);// device.Name = .... vì nó đã tự map hết từ dto qua

            if (device == null)
            {
                throw new BadHttpRequestException("device not found");
            }

            mapper.Map(deviceUpdateDtos, device); // ghi đè dữ liệu từ DTO lên entity đang có trong DB
            device.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // delete device
        public async Task<bool> deleteDevice(int id)
        {
            if(id <= 0)
            {
                throw new BadHttpRequestException("id invalid");
            }

            var device = await dbContext.Devices.FindAsync(id);
            if(device == null)
            {
                throw new BadHttpRequestException("device not found");
            }

            device.DeletedAt = DateTime.UtcNow;
            device.UpdatedAt = DateTime.UtcNow;// cũng cần udpate để biết lần cuối entity bị thay đổi
            return await dbContext.SaveChangesAsync() > 0;
        }
    }
}
