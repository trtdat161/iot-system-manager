namespace IoT_system.DTOS.Common
{
    public class PagedResponseDtos<T>
    {
        public List<T> Data { get; set; } = [];
        public int Page { get; set; }       // trang hiện tại
        public int PageSize { get; set; }   // số item / trang
        public int TotalItems { get; set; } // tổng item
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
        public bool HasNext => Page < TotalPages;
        public bool HasPrev => Page > 1;
    }
}
