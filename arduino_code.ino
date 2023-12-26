#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);  // Replace with your LCD address

// Variables for scrolling
const int scrollDelay = 500;  // Delay between scrolling steps
String message = "";          // Stores the message to be scrolled
int messageLength = 0;        // Length of the message
int scrollPosition = 0;       // Current scroll position

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.begin(16, 2);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    message = Serial.readStringUntil('\n');
    messageLength = message.length();
    scrollPosition = 0;  // Reset scroll position for new message
  }

  // Scroll the message if it's longer than the LCD width
  if (messageLength > 16) {
    for (int i = scrollPosition; i < scrollPosition + 16; i++) {
      lcd.setCursor(i - scrollPosition, 0);
      if (i < messageLength) {
        lcd.print(message[i]);
      } else {
        lcd.print(" ");  // Fill remaining space with spaces
      }
    }
    scrollPosition++;
    if (scrollPosition >= messageLength) {
      scrollPosition = 0;  // Reset scroll position to start over
    }
    delay(scrollDelay);
  } else {
    // Display the message normally if it fits within the LCD width
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(message);
  }
}
