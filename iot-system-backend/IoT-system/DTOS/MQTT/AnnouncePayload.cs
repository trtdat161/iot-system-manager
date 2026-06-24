using System.Text.Json.Serialization;

namespace IoT_system.DTOS.MQTT
{
    public class AnnouncePayload
    {
        [JsonPropertyName("mac")]// mao với "mac" esp gửi lên
        public string Mac { get; set; } = null!;
    }
}
