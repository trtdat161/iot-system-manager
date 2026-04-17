import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
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
