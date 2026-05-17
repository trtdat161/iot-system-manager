using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Devices;
using IoT_system.DTOS.Languages;
using IoT_system.Models;

namespace IoT_system.Profiles
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles() {

            // ------- Account ------
            /*
             chỉ rõ ra field language là Language.Code
             */
            CreateMap<Account, AccountResponseDtos>()
                .ForMember(dest => dest.LanguageCode, 
                           opt => opt.MapFrom(src => src.Language.Code))
                .ForMember(dest => dest.DeviceName, 
                           opt => opt.MapFrom(src => src.Device != null ? src.Device.Name : null));
            CreateMap<AccountRegisterDtos, Account>();
            CreateMap<AccountUpldateDtos, Account>();   

            // ------- Language -------
            CreateMap<Language, LanguageResponseDtos>();

            // ------- device -------
            CreateMap<Device, DeviceResponseDtos>();
            CreateMap<DeviceCreateDtos, Device>();
            CreateMap<DeviceUpdateDtos, Device>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());
        }
    }
}
