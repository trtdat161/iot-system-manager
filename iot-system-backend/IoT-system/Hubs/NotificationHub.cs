using Microsoft.AspNetCore.SignalR;

namespace IoT_system.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinDeviceGroup(string mac)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, mac.ToUpperInvariant());
        }

        public async Task LeaveDeviceGroup(string mac)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, mac.ToUpperInvariant());
        }
    }
}