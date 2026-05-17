using IoT_system.DTOS.Languages;

namespace IoT_system.Services.Languages
{
    public interface LanguageServices
    {
        public Task<List<LanguageResponseDtos>> FindAll();
    }
}
