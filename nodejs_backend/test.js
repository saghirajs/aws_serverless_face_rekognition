const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const arduino_port = new SerialPort('COM3', { baudRate: 9600 }); // Replace 'COMx' with your Arduino port
const parser = port.pipe(new Readline({ delimiter: '\n' }));

parser.on('data', (data) => {
  console.log(`Received data from Arduino: ${data}`);
  // Display the data in your React app or take further actions
});

// Send data to Arduino
const message = 'Hello Arduino!';
arduino_port.write(`${message}\n`);
