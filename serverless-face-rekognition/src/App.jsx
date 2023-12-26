import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import CaptureImage from "./test";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <h1 style={{color: "black"}}>Serverless Face Recognition </h1>
        <CaptureImage />
      
    </>
  );
}

export default App;
