namespace IoT_system.Helper
{
    public class TimeHelper
    {
        private static readonly TimeZoneInfo VnTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh"
        );

        // Dùng cái này thay cho DateTime.UtcNow ở MỌI chỗ insert
        public static DateTime VnNow()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnTimeZone);
        }
    }
}
