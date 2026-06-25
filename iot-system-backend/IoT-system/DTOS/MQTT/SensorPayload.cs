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

        //thêm 3 field này do DHT11
        [JsonPropertyName("tempAlert")]
        public bool TempAlert { get; set; }
        [JsonPropertyName("humidLowAlert")]
        public bool HumidLowAlert { get; set; }
        [JsonPropertyName("humidHighAlert")]
        public bool HumidHighAlert { get; set; }
    }
}
