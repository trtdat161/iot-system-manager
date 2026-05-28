using AutoMapper;
using IoT_system.DTOS.DashboardAdmin;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.DashboardAdmin
{
    public class DashboardAdminServicesImpl : DashboardAdminServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;

        public DashboardAdminServicesImpl(DatabaseContext _dbContext, IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }

        public async Task<DashboardAdminResponseDtos> TotalDeviceAndUser()
        {
            var accountTotal = await dbContext.Accounts.Where(a => a.DeletedAt == null).CountAsync();
            var deviceTotal = await dbContext.Devices.Where(a => a.DeletedAt == null).CountAsync();

            // Không check null vì CountAsync() luôn trả về int (>= 0) - nếu ko có trả về 0
            return new DashboardAdminResponseDtos {
                AccountTotal = accountTotal,
                DeviceTotal = deviceTotal
            };
        }
    }
}
