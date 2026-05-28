using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
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
        public async Task<PagedResponseDtos<DeviceResponseDtos>> ListOfDevices(int page, int pageSize)
        {
            if(page <= 0)
            {
                page = 1;
            }
            if(pageSize <= 0 || pageSize > 100)
            {
                pageSize = 10; 
            }

            var query = dbContext.Devices.Where(d => d.DeletedAt == null).AsNoTracking();

            var totalItems = await query.CountAsync();
            var devices = await query.OrderBy(d => d.Id)
                                     .Skip((page - 1) * pageSize)
                                     .Take(pageSize)
                                     .ToListAsync();

            return new PagedResponseDtos<DeviceResponseDtos>
            {
                Data = mapper.Map<List<DeviceResponseDtos>>(devices),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };
        }
        /*
         if (page <= 0)
            {
                page = 1;
            }
            if (pageSize <= 0 || pageSize > 100){
                pageSize = 10; // giới hạn max 100
            }
            // tolist nếu ko có record thì trả về [] nên ko cần check null
            var query = dbContext.Accounts.Where(a => a.DeletedAt == null).AsNoTracking();

            var totalItems = await query.CountAsync(); // đếm tổng trước khi phân trang
            var accounts = await query.OrderBy(a => a.Id) // orderBy tăng dân theo id (PHẢI CÓ KHI PHÂN TRANG)
                                     .Skip((page - 1) * pageSize)
                                     .Take(pageSize)
                                     .ToListAsync();

            return new PagedResponseDtos<AccountResponseDtos>
            {
                Data = mapper.Map<List<AccountResponseDtos>>(accounts),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };*/

        // find by id
        public async Task<DeviceResponseDtos> FindDeviceById(int id)
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

            return mapper.Map<DeviceResponseDtos>(device);
        }

        // search and filter
        public async Task<List<DeviceResponseDtos>> Search(string? keyword, bool? status)
        {
            var query = dbContext.Devices.Where(d => d.DeletedAt == null).AsQueryable();

            if (status.HasValue) // nếu có status
            {
                query = query.Where(d => d.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(d => d.Name.ToLower().Contains(keyword.ToLower()));
            }

            var devices = await query.AsNoTracking().ToListAsync();
            return mapper.Map<List<DeviceResponseDtos>>(devices);
        }

        // --------- CRUD ----------

        // add device
        public async Task<DeviceResponseDtos> CreateDevice(DeviceCreateDtos deviceCreateDtos)
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
        public async Task<DeviceResponseDtos> UpdateDevice(int id, DeviceUpdateDtos deviceUpdateDtos)
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
        public async Task<bool> DeleteDevice(int id)
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
