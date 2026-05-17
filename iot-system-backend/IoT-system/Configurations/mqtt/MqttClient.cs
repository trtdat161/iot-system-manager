using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;

namespace IoT_system.Configurations.mqtt
{
    public class MqttClient
    {
        private IManagedMqttClient mqttClient;
        private readonly ILogger<MqttClient> logger;

        public MqttClient(ILogger<MqttClient> _logger)
        {
            logger = _logger;
        }

        // use library to configuration mqtt before connect broker
        public async Task ConnectAsync(string broker, int port)
        {
            try
            {
                var messageBuilder = new MqttClientOptionsBuilder() // Tạo object builder để cấu hình MQTT client
                    .WithTcpServer(broker, port)
                    .WithClientId($"DatTech_{Guid.NewGuid()}")// MQTT bắt mỗi client phải có clientId, broker dùng id này để phân biệt các thiết bị như esp32,...
                    .WithCleanSession();// mỗi lần connect tạo session mới, xoá session cũ

                var options = new ManagedMqttClientOptionsBuilder()
                    .WithClientOptions(messageBuilder.Build())
                    .Build();

                mqttClient = new MqttFactory().CreateManagedMqttClient();

                mqttClient.ConnectedAsync += async e =>
                {
                    logger.LogInformation("ok MQTT Broker");
                };

                mqttClient.DisconnectedAsync += async e =>
                {
                    logger.LogInformation("disconnected MQTT");
                };

                // kết nối đến mqtt
                await mqttClient.StartAsync(options);
                logger.LogInformation("connecting MQTT...");
            }
            catch (Exception ex) {
                logger.LogError(ex, "error connect MQTT");
                throw;
            }
        }


        // gửi message
        public async Task PublishAsync(string topic, string payload)
        {
            if(mqttClient == null || mqttClient.IsConnected)
            {
                throw new InvalidOperationException("MQTT not connected !");
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await mqttClient.EnqueueAsync(message);
            logger.LogInformation(" send; {payload}", payload);
            /* 
             * => Payload = phần data/nội dung được gửi đi giống trong jwt 
             */
        }
    }
}
