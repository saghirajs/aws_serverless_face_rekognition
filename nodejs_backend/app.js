const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sizeOf = require("image-size");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const { SerialPort } = require("serialport");

const arduino_port = new SerialPort({ path: "COM3", baudRate: 9600 });

arduino_port.on("open", () => {
  console.log("Arduino port is open");
});

arduino_port.on("error", (err) => {
  console.error("Error:", err.message);
});

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const s3 = new S3Client({
  credentials: {
    accessKeyId: "AKIATZQ2IXCD7S3K4IUV",
    secretAccessKey: "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",
  },
  region: "eu-west-2",
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (socket) => {
  console.log("WebSocket connection established");

  socket.on("message", (message) => {
    console.log("Received message from React app:", message);
  });

  socket.on("close", (code, reason) => {
    console.log(`WebSocket closed: ${code} - ${reason}`);
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new Error("Invalid image data");
    }

    const imageBuffer = req.file.buffer;

    let dimensions;
    try {
      dimensions = sizeOf(imageBuffer);
    } catch (error) {
      console.error("Error getting image dimensions:", error);
    }

    const contentType = dimensions
      ? `image/${dimensions.type}`
      : "application/octet-stream";

    const destinationPath = "uploads/";
    const filename = `${Date.now()}_${req.file.originalname}`;
    const filePath = `${destinationPath}${filename}`;

    const metadata = JSON.parse(req.body.metadata || "{}");

    const s3Params = {
      Bucket: "londonfacerekognition",
      Key: filename,
      Body: imageBuffer,
      Metadata: metadata,
    };

    const s3Response = await s3.send(new PutObjectCommand(s3Params));

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("Image uploaded to S3 successfully");
        arduino_port.write(`Image uploaded to S3 successfully\n`);
      }
    });

    res.json({
      success: true,
      message: "Image uploaded to S3 successfully",
      filePath,
      s3Response,
    });
  } catch (error) {
    console.error("Error handling image upload:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/receive-sns-message", (req, res) => {
  if (Array.isArray(req.body) && req.body.length > 0) {
    const snsMessageText = String(req.body[0]);

    console.log("Number of faces detected:", snsMessageText);

    const message = snsMessageText + " faces detected";
    arduino_port.write(`${message}\n`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("Number of faces detected: " + snsMessageText);
      }
    });

    res.status(200).json({
      success: true,
      message: "SNS message received successfully",
      snsMessage: snsMessageText,
    });
  } else {
    console.error("Invalid or empty array in the request body");
    res.status(400).json({
      success: false,
      message: "Bad Request: Invalid or empty array in the request body",
    });
  }
});
