import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HistoryDetailForAdmin } from "../../api/admin/notification";

export function HistoryDetail() {
  const [historyDetail, setHistoryDetail] = useState(null);
  const [user, setUser] = useState([]); // list user nhận đc thông báo
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const fetchHistoryDetail = async () => {
    try {
      const response = await HistoryDetailForAdmin(id);
      const foundHistoryDetail = response.data;
      console.log("foundHistoryDetail:", foundHistoryDetail);
      if (foundHistoryDetail) {
        setHistoryDetail(foundHistoryDetail);
      } else {
        setError("History detail not found");
      }
    } catch (error) {
      console.error("Error fetching history detail:", error);
    }
  };

  useEffect(() => {
    fetchHistoryDetail();
  }, [id]);

  return (
    <>
      <h2>HistoryDetail</h2>
      <p>Detail for history item with ID: {id}</p>
      {historyDetail && (
        <div>
          <p>{historyDetail.message}</p>
          <p>Type: {historyDetail.type}</p>
          <p>Is Read: {historyDetail.IsRead ? "Yes" : "No"}</p>
          <ul>
            {historyDetail.users &&
              historyDetail.users.map((user) => (
                <li key={user.id}>{user.fullname}</li>
              ))}
          </ul>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  );
}
