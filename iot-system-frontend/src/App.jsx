import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { CreateRouter } from "./routes/route";

function App() {
  const route = CreateRouter();
  return (
    <>
      <BrowserRouter>{route}</BrowserRouter>
    </>
  );
}

export default App;
