using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using MQTTnet.Protocol;

namespace IoT_system.Configurations.mqtt
{
    // file này là cấu hình các tk user gửi lệnh điều on off device, chỉ để GỬI ĐI, không lắng nghe gì 
    public class MqttClient
    {
        private IManagedMqttClient _client;
        private readonly ILogger<MqttClient> _logger;

        public bool IsConnected => _client?.IsConnected ?? false;

        public MqttClient(ILogger<MqttClient> logger)
        {
            _logger = logger;
        }

        public async Task ConnectAsync(string broker, int port)
        {
            var options = new MqttClientOptionsBuilder()
                .WithClientId($"backend_{Guid.NewGuid():N}")
                .WithTcpServer(broker, port)
                .WithCleanSession()
                .Build();

            var managedOptions = new ManagedMqttClientOptionsBuilder()
                .WithClientOptions(options)
                .Build();

            _client = new MqttFactory().CreateManagedMqttClient();

            _client.ConnectedAsync += e =>
            {
                _logger.LogInformation("MQTT connected");
                return Task.CompletedTask;
            };

            _client.DisconnectedAsync += e =>
            {
                _logger.LogWarning("MQTT disconnected");
                return Task.CompletedTask;
            };

            await _client.StartAsync(managedOptions);
            _logger.LogInformation("MQTT starting...");
        }

        public async Task PublishAsync(string topic, string payload)
        {
            if (_client == null)
            {
                throw new InvalidOperationException("MQTT client chưa được khởi tạo, kiểm tra lại Program.cs đã gọi ConnectAsync chưa");
            }

            var msg = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _client.EnqueueAsync(msg);
        }
    }
}