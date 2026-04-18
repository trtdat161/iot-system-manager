namespace IoT_system.DTOS.languages
{
    public class LanguageResponseDtos // dto trả về language
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string Code { get; set; } = null!;
    }
}
