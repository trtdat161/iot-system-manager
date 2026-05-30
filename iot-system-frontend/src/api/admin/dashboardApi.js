import { axiosInstance } from "../axiosInstance";

export const DashboardSummary = () =>
  axiosInstance.get("dashboard-admin/overview");

const API_KEY = "75e8296ef4835c3a11743859d152a24c";
const city = "Ho Chi Minh City";
export const Weather = () =>
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=vi`,
  ).then((data) => data.json());
