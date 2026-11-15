using AutoMapper;
using IoT_system.DTOS.DashboardAdmin;
using IoT_system.Helper;
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

            var userActive = await dbContext.Accounts.Where(a => a.DeletedAt == null && a.Status == true).CountAsync();
            var userLock = await dbContext.Accounts.Where(a => a.DeletedAt == null && a.Status == false).CountAsync();

            var totalAlerts = await dbContext.Notifications.CountAsync();

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
                TotalAlerts = totalAlerts,
                CountUserOneMonth = countUserOneMonth
            };
        }

        public async Task<DashboardAlertTrendResponseDtos> GetAlertTrend(string? type, DateTime? month)
        {
            var now = TimeHelper.VnNow();
            var currentMonthStart = new DateTime(now.Year, now.Month, 1);
            var periodStart = currentMonthStart.AddMonths(-11);
            var periodEnd = currentMonthStart.AddMonths(1);

            var query = dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.CreatedAt >= periodStart && n.CreatedAt < periodEnd);

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(n => n.Type == type);
            }

            // Gộp thông báo cùng thiết bị/loại/thời điểm để một đợt không bị đếm theo từng người nhận.
            var alertEvents = await query
                .Select(n => new { n.DeviceId, n.Type, n.CreatedAt })
                .Distinct()
                .Select(n => new { n.Type, n.CreatedAt })
                .ToListAsync();

            var eventsByMonth = alertEvents
                .GroupBy(alert => new DateTime(alert.CreatedAt.Year, alert.CreatedAt.Month, 1))
                .ToDictionary(group => group.Key, group => group.ToList());

            var months = Enumerable.Range(0, 12)
                .Select(monthOffset =>
                {
                    var monthStart = periodStart.AddMonths(monthOffset);
                    var monthEvents = eventsByMonth.GetValueOrDefault(monthStart) ?? new();
                    return new DashboardAlertMonthDtos
                    {
                        Month = monthStart,
                        Count = monthEvents.Count,
                        HasDanger = monthEvents.Any(alert => alert.Type == "gas_danger")
                    };
                })
                .ToList();

            var days = new List<DashboardAlertDayDtos>();
            if (month.HasValue)
            {
                var selectedMonthStart = new DateTime(month.Value.Year, month.Value.Month, 1);
                if (selectedMonthStart >= periodStart && selectedMonthStart < periodEnd)
                {
                    var selectedMonthEnd = selectedMonthStart.AddMonths(1);
                    var eventsByDay = alertEvents
                        .Where(alert =>
                            alert.CreatedAt >= selectedMonthStart &&
                            alert.CreatedAt < selectedMonthEnd)
                        .GroupBy(alert => alert.CreatedAt.Date)
                        .ToDictionary(group => group.Key, group => group.ToList());

                    days = Enumerable.Range(
                            1,
                            DateTime.DaysInMonth(selectedMonthStart.Year, selectedMonthStart.Month))
                        .Select(day =>
                        {
                            var date = selectedMonthStart.AddDays(day - 1);
                            var dayEvents = eventsByDay.GetValueOrDefault(date) ?? new();
                            return new DashboardAlertDayDtos
                            {
                                Date = date,
                                Count = dayEvents.Count,
                                HasDanger = dayEvents.Any(alert => alert.Type == "gas_danger")
                            };
                        })
                        .ToList();
                }
            }

            return new DashboardAlertTrendResponseDtos
            {
                Months = months,
                Days = days
            };
        }
    }
}
