import { axiosInstance } from "../axiosInstance";

export const adminGetHistory = (page, pageSize) =>
  axiosInstance.get(
    `notification/admin-history?page=${page}&pageSize=${pageSize}`,
  );

export const HistoryDetailForAdmin = (id) =>
  axiosInstance.get(`notification/history-detail/${id}`);

export const SearchAndFilterHistory = (
  page = 1,
  pageSize = 10,
  fromDate,
  toDate,
  isRead,
  type,
) =>
  axiosInstance.get(
    `notification/search-history?page=${page}&pageSize=${pageSize}&fromDate=${fromDate ?? ""}&toDate=${toDate ?? ""}&isRead=${isRead ?? ""}&type=${type ?? ""}`,
  );
