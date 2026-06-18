using IoT_system.DTOS.MQTT;
using IoT_system.Models;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using System;
using System.Text.Json;
/*  QUAN TRỌNG NHẤT */
namespace IoT_system.Services.Mqtt
{
    public class IotMqttIngestService : BackgroundService
    {
        private readonly MqttClient mqtt;
        private readonly IServiceScopeFactory scopeFactory;
        private readonly ILogger<IotMqttIngestService> logger;

        private IMqttClient _client;

        public IotMqttIngestService(
            MqttClient _mqtt,
            IServiceScopeFactory _scopeFactory,
            ILogger<IotMqttIngestService> _logger)
        {
            mqtt = _mqtt;
            scopeFactory = _scopeFactory;
            logger = _logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new MqttFactory();
            _client = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer("broker.hivemq.com", 1883)
                .WithClientId("backend_subscriber")
                .Build();

            _client.ConnectedAsync += async e =>
            {
                await _client.SubscribeAsync("devices/announce");
                await _client.SubscribeAsync("devices/+/data");

                logger.LogInformation("Subscribed topics");
            };

            _client.ApplicationMessageReceivedAsync += HandleMessage;

            await _client.ConnectAsync(options, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
                await Task.Delay(1000, stoppingToken);
        }

        private async Task HandleMessage(MqttApplicationMessageReceivedEventArgs e)
        {
            var topic = e.ApplicationMessage.Topic;
            var payload = e.ApplicationMessage.ConvertPayloadToString();

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();

            // ---------------- ANNOUNCE ----------------
            if (topic == "devices/announce")
            {
                var data = JsonSerializer.Deserialize<AnnouncePayload>(payload);
                if (data == null) return;

                var exists = db.Devices.FirstOrDefault(x => x.MacAddress == data.Mac);

                if (exists == null)
                {
                    db.Devices.Add(new Device
                    {
                        MacAddress = data.Mac,
                        IsClaimed = false,
                        CreatedAt = DateTime.UtcNow
                    });

                    await db.SaveChangesAsync();
                }

                return;
            }

            // ---------------- SENSOR DATA ----------------
            var parts = topic.Split('/');
            var mac = parts[1];

            var device = db.Devices.FirstOrDefault(x => x.MacAddress == mac);
            if (device == null) return;

            device.LastSeenAt = DateTime.UtcNow;

            var sensor = JsonSerializer.Deserialize<SensorPayload>(payload);
            if (sensor == null) return;

            if (sensor.Alert)
            {
                var users = db.Accounts
                    .Where(x => x.DeviceId == device.Id)
                    .ToList();

                foreach (var u in users)
                {
                    db.Notifications.Add(new Notification
                    {
                        DeviceId = device.Id,
                        UserId = u.Id,
                        Message = BuildMessage(sensor),
                        Type = sensor.Type,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await db.SaveChangesAsync();
        }

        private string BuildMessage(SensorPayload s)
        {
            return s.Type switch
            {
                "gas" => $"Gas nguy hiểm: {s.Gas}",
                "temp_high" => $"Nhiệt độ cao: {s.Temperature}",
                "temp_low" => $"Nhiệt độ thấp: {s.Temperature}",
                _ => "Cảnh báo thiết bị"
            };
        }
    }
}