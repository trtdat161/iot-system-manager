import { axiosInstance } from "./axiosInstance";

export const SearchAndFilterHistory = (
  page = 1,
  pageSize = 10,
  fromDate,
  toDate,
  isRead,
  type,
) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (isRead !== "" && isRead !== undefined && isRead !== null) {
    params.set("isRead", isRead);
  }
  if (type) params.set("type", type);

  return axiosInstance.get(`notification/search-history?${params.toString()}`);
};
