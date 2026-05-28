using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.DashboardAdmin;
using IoT_system.DTOS.Devices;

namespace IoT_system.Services.DashboardAdmin
{
    public interface DashboardAdminServices
    {
        public Task<DashboardAdminResponseDtos> TotalDeviceAndUser();
    }
}
