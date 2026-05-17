namespace IoT_system.DTOS.Devices
{
    public class DeviceResponseDtos
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public bool Status { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
