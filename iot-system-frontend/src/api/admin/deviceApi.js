import { axiosInstance } from "../common/axiosInstance";

export const GetStatusDevice = (page = 1, pageSize = 10, status) =>
  axiosInstance.get("device/get-status-device", {
    params: {
      page,
      pageSize,
      ...(status ? { status } : {}),
    },
  });
