using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using MQTTnet.Protocol;

namespace IoT_system.Configurations.mqtt
{
    // file này là cấu hình các tk user gửi request lệnh điều on/off device, chỉ để GỬI ĐI, không lắng nghe gì 
    public class MqttClient
    {
        /* IManagedMqttClientBản "có quản lý" — tự động reconnect khi rớt mạng nếu đang mất kết nối mà gọi publish, 
         * tin nhắn được xếp hàng chờ, kết nối lại là tự gửi tiếp, cũng là đối tượng đại diện cho Backend khi kết nối Broker.
         * Nó làm được:
           - Connect
           - Publish
           - Subscribe
           - Disconnect
        */
        private IManagedMqttClient client;
        private readonly ILogger<MqttClient> logger;

        public bool IsConnected => client?.IsConnected ?? false;

        public MqttClient(ILogger<MqttClient> _logger)
        {
            logger = _logger;
        }

        public async Task ConnectAsync(string broker, int port)
        {
            var options = new MqttClientOptionsBuilder()// Là object dùng để khai báo thông tin kết nối
                .WithClientId($"backend_{Guid.NewGuid():N}")
                .WithTcpServer(broker, port)
                .WithCleanSession()
                .Build();
            /*
             WithCleanSession(): nói với broker "mỗi lần connect coi như phiên mới, đừng giữ lại message cũ nào của
             tao". Vì client này chỉ gửi, không subscribe, nên không cần broker lưu session cũ
             */

            var managedOptions = new ManagedMqttClientOptionsBuilder()
                .WithClientOptions(options)
                .Build();

            client = new MqttFactory().CreateManagedMqttClient();

            client.ConnectedAsync += e =>
            {
                logger.LogInformation("MQTT connected");
                return Task.CompletedTask;
            };

            client.DisconnectedAsync += e =>
            {
                logger.LogWarning("MQTT disconnected");
                return Task.CompletedTask;
            };

            await client.StartAsync(managedOptions);
            logger.LogInformation("MQTT starting...");
        }

        public async Task PublishAsync(string topic, string payload)
        {
            if (client == null)
            {
                throw new InvalidOperationException("MQTT client chưa được khởi tạo, kiểm tra lại Program.cs đã gọi ConnectAsync chưa");
            }

            var msg = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await client.EnqueueAsync(msg);
        }
    }
}