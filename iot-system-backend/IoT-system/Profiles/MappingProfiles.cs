using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.languages;
using IoT_system.Models;

namespace IoT_system.Profiles
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles() {

            // ------- Account ------
            CreateMap<Account, AccountResponseDtos>()
                .ForMember(dest => dest.LanguageCode, opt => opt.MapFrom(src => src.Language.Code));
            CreateMap<AccountRegisterDtos, Account>();
            CreateMap<AccountUpldateDtos, Account>();

            // ------- Language -----
            CreateMap<Language, LanguageResponseDtos>();
        }
    }
}
