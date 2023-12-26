import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import TextField from "@mui/material/TextField";

const CaptureImage = () => {
  const webcamRef = useRef(null);
  const ws = useRef(null);

  const [fullname, setFullname] = useState("");
  const [serverMessage, setServerMessage] = useState("");

  // Event handler to update the state when the input changes
  const handleFullnameChange = (event) => {
    setFullname(event.target.value);
  };

  const connectWebSocket = () => {
    ws.current = new WebSocket("ws://localhost:3001");

    ws.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    ws.current.onmessage = (event) => {
      setServerMessage(event.data);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  const disconnectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Create a FormData object to send the image
    const formData = new FormData();

    // Convert a data URI to a Blob
    const blob = dataURItoBlob(imageSrc);

    // Append the blob to the FormData
    formData.append("image", blob, "image.jpg");

    // Add metadata headers
    formData.append(
      "metadata",
      JSON.stringify({
        fullname: fullname,
        // resolution: "640x480",
        // Add other metadata fields as needed
      })
    );

    try {
      // Send a POST request to your Node.js server
      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });

      // Handle the response from the server if needed
      const result = await response.json();
      console.log("Server response:", result);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Convert a data URI to a Blob
  const dataURItoBlob = (dataURI) => {
    // Split the data URI to get the base64 part
    const base64 = dataURI.split(",")[1];

    // Convert the base64 string to a Uint8Array
    const uint8Array = new Uint8Array(
      atob(base64)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    // Create a Blob with the correct MIME type
    return new Blob([uint8Array], { type: "image/jpeg" });
  };

  return (
    <div>
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
      <br />
      <button onClick={captureImage}>Capture Image</button>

      <div>
        <strong>Server Message:</strong>
        <h3 style={{color: "black"}}>{serverMessage}</h3>
        
      </div>
    </div>
  );
};

export default CaptureImage;
