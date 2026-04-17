using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.Models;

namespace IoT_system.Profiles
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles() {

            // ------- Account ------
            CreateMap<Account, AccountResponseDtos>();
            CreateMap<AccountRegisterDtos, Account>();
            CreateMap<AccountUpldateDtos, Account>();

        }
    }
}
