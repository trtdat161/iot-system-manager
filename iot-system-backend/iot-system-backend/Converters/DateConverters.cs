using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace IoT_system.Converters
{
    public class DateConverters : JsonConverter<DateOnly>
    {
        private string format = "dd/MM/yyyy";

        // ham Read doc chuoi json bien thanh DateOnly
        public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            // bien doi
            return DateOnly.ParseExact(reader.GetString(), format, CultureInfo.InvariantCulture);// CultureInfo.InvariantCulture không phu thuoc vao location
        }

        public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString(format));
        }
    }
}
