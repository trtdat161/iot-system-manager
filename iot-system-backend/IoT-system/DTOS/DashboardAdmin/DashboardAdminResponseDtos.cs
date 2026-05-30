using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Devices;

namespace IoT_system.DTOS.DashboardAdmin
{
    public class DashboardAdminResponseDtos
    {
        /* sô ng dùng, số thiết bị */
        public int AccountTotal { get; set; } 
        //public int DeviceTotal { get; set; } 


        /* ng dùng hoạt động, ng dùng bị khoá */
        public int UserActive { get; set; }
        public int UserLock { get; set;}


        /* thiết bị hoạt động thiết bị offline */
        public int DeviceOnline { get; set; }
        public int DeviceOffline { get; set; }


        /* thống kê bao nhiêu user trong 1 tháng qua */
        public int CountUserOneMonth { get; set; }

    }
}
