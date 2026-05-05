import { useParams } from "react-router-dom";

export function LockAccount() {
  const { id } = useParams();
  return (
    <>
      <h1>Lock Account</h1>
      <p>Account ID: {id}</p>
    </>
  );
}
