namespace IoT_system.DTOS.DashboardAdmin
{
    public class DashboardAlertTrendResponseDtos
    {
        public List<DashboardAlertMonthDtos> Months { get; set; } = new();
        public List<DashboardAlertDayDtos> Days { get; set; } = new();
    }

    public class DashboardAlertMonthDtos
    {
        public DateTime Month { get; set; }
        public int Count { get; set; }
        public bool HasDanger { get; set; }
    }

    public class DashboardAlertDayDtos
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public bool HasDanger { get; set; }
    }
}
