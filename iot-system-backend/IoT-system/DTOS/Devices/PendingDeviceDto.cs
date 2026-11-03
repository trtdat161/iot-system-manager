namespace IoT_system.DTOS.Devices
{
    public class PendingDeviceDto
    {
        public int Id { get; set; }
        public string MacAddress { get; set; } = null!;
        public int? LastDeviceId { get; set; } // để sau khi disconnect còn biết thiết bị liên kết user nào 
    }
}
