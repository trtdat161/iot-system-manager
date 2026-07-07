using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace IoT_system.Hubs
{
    public class NotificationHub : Hub
    {
        // Client join vào "phòng" riêng theo MAC thiết bị,
        // để chỉ nhận data của đúng thiết bị mình đang xem trên dashboard,
        // không bị nhận lẫn data của thiết bị khác (quan trọng khi hệ thống có nhiều ESP)
        public async Task JoinDeviceGroup(string mac)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, mac);// Context.ConnectionId hiểu ngầm là sẽ đc thêm vào / mac là tên group
        }

        public async Task LeaveDeviceGroup(string mac)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, mac);
        }
        /*
         * Groups là một đối tượng (property) do SignalR cung cấp để quản lý tất cả các group
         dùng group vì hiểu là Group là nhóm các kết nối của client (dashboard/web/app) đang quan tâm đến cùng một ESP.
         */
    }
}
