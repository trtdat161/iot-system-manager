import { axiosInstance } from "../axiosInstance";

export const UserGetHistory = (page, pageSize) =>
  axiosInstance.get(
    `notification/user-history?page=${page}&pageSize=${pageSize}`,
  );

export const SearchAndFilterHistory = (date, isRead, type) =>
  axiosInstance.get(
    `notification/search-history?date=${date}&isRead=${isRead}&type=${type}`,
  );
