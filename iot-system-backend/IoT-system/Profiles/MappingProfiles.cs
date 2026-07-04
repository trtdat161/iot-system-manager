using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Devices;
using IoT_system.DTOS.Languages;
using IoT_system.DTOS.Notification;
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
                           opt => opt.MapFrom(src => src.Language != null ? src.Language.Code : null))// check null
                .ForMember(dest => dest.DeviceName, 
                           opt => opt.MapFrom(src => src.Device != null ? src.Device.Name : null));
            CreateMap<AccountRegisterDtos, Account>();
            CreateMap<AccountUpldateDtos, Account>();   

            // ------- Language -------
            CreateMap<Language, LanguageResponseDtos>();

            // ------- device -------
            CreateMap<Device, DeviceResponseDtos>();
            CreateMap<DeviceUpdateDtos, Device>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            // ------- notification -------
            CreateMap<Notification, NotificationAdminResponseDtos>(); // admin xem đc hết lịch sử của user nào
            CreateMap<Notification, NotificationUserResponseDtos>(); // user chỉ xem đc lịch sử của họ
            CreateMap<Notification, NotificationDetailResponseDtos>(); // admin xem lịch sử chi tiết thông báo gửi cho các user nào


        }
    }
}
/* -------- AutoMapper chỉ cần khi mày chuyển đổi qua lại giữa 2 object có nhiều field -------- */
