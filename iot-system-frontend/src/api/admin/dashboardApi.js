import { axiosInstance } from "../common/axiosInstance";

export const DashboardSummary = () =>
  axiosInstance.get("dashboard-admin/overview");

export const GetAlertTrend = (type, month) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (month) params.set("month", month);

  return axiosInstance.get(`dashboard-admin/alert-trend?${params.toString()}`);
};

const API_KEY = "75e8296ef4835c3a11743859d152a24c";
const city = "Ho Chi Minh City";
export const Weather = () =>
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=vi`,
  ).then((data) => data.json());
