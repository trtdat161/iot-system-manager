using IoT_system.DTOS.languages;

namespace IoT_system.Services.Languages
{
    public interface LanguageServices
    {
        public Task<List<LanguageResponseDtos>> FindAll();
    }
}
