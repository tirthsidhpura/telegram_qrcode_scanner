require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const Jimp = require('jimp');

const QrCodeReader = require('qrcode-reader');
const fs = require('fs');
const path = require('path');
// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const token = process.env.botId;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1].file_id;

    bot.getFile(photo).then((fileInfo) => {
      const file = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;

      // Download the image
      downloadImage(file, 'downloaded_image.jpg', () => {
        // Read QR code
        readQRCode('downloaded_image.jpg', (qrData) => {
          // Send the QR code data back to the user
          bot.sendMessage(chatId, `QR Code Data: ${qrData}`);
        });
      });
    });
  }
});

// Function to download the image
function downloadImage(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  const request = https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(callback);
    });
  });
}

function readQRCode(imagePath, callback) {
    fs.readFile(imagePath, (err, imageBuffer) => {
      if (err) {
        console.error(err);
        return callback('Error reading image');
      }
  
      // Read the image using Jimp
      Jimp.read(imageBuffer, (err, image) => {
        if (err) {
          console.error(err);
          return callback('Error processing image');
        }
  
        // Convert the image to grayscale
        image.greyscale();
  
        // Use qrcode-reader to decode the QR code
        const qr = new QrCodeReader();
        qr.callback = (err, value) => {
          if (err) {
            console.error(err);
            return callback('Error decoding QR code');
          }
  
          if (value) {
            callback(value.result);
          } else {
            callback('QR code not found');
          }
        };
  
        qr.decode(image.bitmap);
      });
    });
  }