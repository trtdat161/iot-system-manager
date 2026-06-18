namespace IoT_system.DTOS.MQTT
{
    public class SensorPayload
    {
        public string Type { get; set; } = null!;

        public float Temperature { get; set; }

        public float Humidity { get; set; }// độ ẩm

        public int Gas { get; set; }

        public bool Alert { get; set; }
    }
}
