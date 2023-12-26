# Face Recognition System

This project is a facial recognition system that captures images from a webcam, processes them using AWS Rekognition, and stores the results in DynamoDB. The system also provides real-time updates via WebSocket communication and displays notifications on an Arduino-connected LCD screen.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- Image capture using React and the `react-webcam` library.
- AWS Lambda function for facial recognition with Rekognition.
- Real-time updates via WebSocket communication.
- Notifications on an Arduino-connected LCD screen.
- Results stored in DynamoDB.

## Architecture

The project follows a serverless architecture using AWS services such as S3, DynamoDB, Lambda, and Rekognition. WebSocket communication is established between the React app and a local Node.js server. The system integrates an Arduino Uno with an LCD screen for physical notifications.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js and npm
- Serverless Framework (if deploying AWS Lambda functions)
- Arduino IDE (if working with Arduino Uno)
- AWS CLI configured with necessary credentials

## Getting Started

1. Clone the repository: `git clone https://github.com/saghirajs/aws_serverless_face_rekognition.git`
2. Navigate to the project directory: `cd aws_serverless_face_rekognition`
3. Install dependencies for the Node.js backend: `cd nodejs_backend && npm install`
4. Install dependencies for the React app: `cd ../serverless-face-rekognition && npm install`
5. Follow the configuration steps below.
6. Start the local Node.js server: `cd ../nodejs_backend && npm start`

## Configuration

1. Set up an AWS account and configure AWS CLI credentials.
2. Create an S3 bucket, DynamoDB table, and Lambda function using the provided CloudFormation template.
3. Configure the React app and local Node.js server with necessary environment variables.
4. Connect your Arduino Uno and update the COM port in the Arduino code.

## Usage

1. Run the React app: `cd ../serverless-face-rekognition && npm start`
2. Capture images using the webcam.
3. Observe real-time updates, notifications on the Arduino screen, and stored results in DynamoDB.

## Testing

To test the complete application flow, follow the steps in the "Testing the Face Detection App" section of the documentation.

## Contributing

Contributions are welcome! Please follow the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
