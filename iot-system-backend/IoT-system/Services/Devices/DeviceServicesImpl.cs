using IoT_system.Configurations.mqtt;

namespace IoT_system.Services.Devices
{
    public class DeviceServicesImpl : DeviceServices
    {
        private readonly MqttClient mqttClient;

        public DeviceServicesImpl(MqttClient _mqttClient)
        {
            mqttClient = _mqttClient;
        }

        // ------ connect mqtt -------
        public async Task ConnectDevice()
        {
            await mqttClient.ConnectAsync(
                broker: "broker.hivemq.com",
                port: 1883
            );
        }
    }
}