import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const CaptureImage = () => {
  const webcamRef = useRef(null);
  const [imageName, setImageName] = useState("");

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Upload image to S3
    // const s3 = new AWS.S3({
    //   accessKeyId: "AKIATZQ2IXCD7S3K4IUV",
    //   secretAccessKey: "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",
    // });

    // const params = {
    //   Bucket: "londonfacerekognition",
    //   Key: `${Date.now()}.png`,
    //   Body: imageSrc,
    //   ContentType: "image/png",
    // };

    // try {
    //   const response = await s3.upload(params).promise();
    //   console.log("Image uploaded to S3:", response);

    //   // Call a function to check recognition (you need to implement this)
    //   checkRecognition(response.Location);
    // } catch (error) {
    //   console.error("Error uploading image to S3:", error);
    // }
  };

//   const checkRecognition = (imageUrl) => {
//     // You need to implement recognition logic here
//     // This can involve using AWS Rekognition or any other recognition service
//     // Once you have the recognition result, update your UI accordingly
//     console.log("Checking recognition for image:", imageUrl);
//   };

  return (
    <div>
      <Webcam ref={webcamRef} />
      <button onClick={captureImage}>Capture Image</button>
    </div>
  );
};

export default CaptureImage;
