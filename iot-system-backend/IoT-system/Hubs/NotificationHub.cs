using Microsoft.AspNetCore.SignalR;

namespace IoT_system.Hubs
{
    public class NotificationHub : Hub
    {
        public const string AdminGroup = "notification-admins";

        public async Task JoinDeviceGroup(string mac)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, mac.ToUpperInvariant());
        }

        public async Task LeaveDeviceGroup(string mac)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, mac.ToUpperInvariant());
        }

        public async Task JoinAdminGroup()
        {
            if (Context.User?.IsInRole("admin") != true)
            {
                throw new HubException("Only administrators can join the admin notification group.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
        }

        public async Task LeaveAdminGroup()
        {
            if (Context.User?.IsInRole("admin") != true)
            {
                throw new HubException("Only administrators can leave the admin notification group.");
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, AdminGroup);
        }
    }
}