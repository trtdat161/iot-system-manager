using System.Text.Json.Serialization;

namespace IoT_system.DTOS.MQTT
{
    public class SensorPayload
    {
        /* mao lại chữ thường cho khớp với json esp gửi lên để tránh lỗi tiềm ẩn */
        [JsonPropertyName("type")]
        public string Type { get; set; } = null!;

        [JsonPropertyName("temperature")]
        public float Temperature { get; set; }

        [JsonPropertyName("humidity")]
        public float Humidity { get; set; }

        [JsonPropertyName("gas")]
        public int Gas { get; set; }

        [JsonPropertyName("alert")]
        public bool Alert { get; set; }
    }
}
