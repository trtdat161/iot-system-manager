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

        public async Task<DashboardAdminResponseDtos> DashboardAdmin()
        {
            var accountTotal = await dbContext.Accounts.Where(a => a.DeletedAt == null).CountAsync();
            //var deviceTotal = await dbContext.Devices.Where(a => a.DeletedAt == null).CountAsync();

            var userActive = await dbContext.Accounts.Where(a => a.DeletedAt == null && a.Status == true).CountAsync();
            var userLock = await dbContext.Accounts.Where(a => a.DeletedAt == null && a.Status == false).CountAsync();

            var deviceOnl = await dbContext.Devices.Where(d => d.DeletedAt == null && d.Status == true).CountAsync();
            var deviceOff = await dbContext.Devices.Where(d => d.DeletedAt == null && d.Status == false).CountAsync();

            // Thống kê user mới trong 1 tháng qua
            var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);// -1 lùi về 1 tháng
            var countUserOneMonth = await dbContext.Accounts
                .Where(d => d.DeletedAt == null
                         && d.CreatedAt >= oneMonthAgo
                         && d.Status == true).CountAsync();
  

            // Không check null vì CountAsync() luôn trả về int (>= 0) - nếu ko có trả về 0
            return new DashboardAdminResponseDtos {
                AccountTotal = accountTotal,
                UserActive = userActive,// dùng để làm biểu đồ tròn user đã có luôn
                UserLock = userLock,// dùng để làm biểu đồ tròn user bị khoá
                DeviceOnline = deviceOnl,
                DeviceOffline = deviceOff,
                CountUserOneMonth = countUserOneMonth
            };
        }
    }
}
