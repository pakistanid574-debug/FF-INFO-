const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Meta API par message bhejne ke liye

const app = express();
app.use(bodyParser.json());

// London Postcodes ka data
const londonPostcodes = {
  "SW": "South West London (e.g., Chelsea, Westminster, Kensington) - Premium chauffeur service available.",
  "W": "West London (e.g., Mayfair, Soho, Paddington) - Luxury airport and city transfers.",
  "NW": "North West London (e.g., Camden, Hampstead, Baker Street) - Comfortable rides ready.",
  "E": "East London (e.g., Shoreditch, Canary Wharf, Stratford) - Corporate and private travel.",
  "SE": "South East London (e.g., Greenwich, Bermondsey, London Bridge) - On-time pickup guaranteed.",
  "WC": "Central London (e.g., Covent Garden, Holborn) - Fast inner-city transit.",
  "EC": "Central London Financial District (e.g., Bank, St. Paul's) - Executive business travel."
};

// 1. Webhook Verification (Meta jab URL verify karega)
app.get('/api/webhook', (req, res) => {
  const VERBOSE_TOKEN = "my_secure_token"; // Wahi token jo aap Meta Dashboard mein dalenge
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token === VERBOSE_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Messages Receive aur Reply karne ke liye (POST request)
app.post('/api/webhook', async (req, res) => {
  let body = req.body;

  if (body.object) {
    try {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        let changeValue = body.entry[0].changes[0].value;
        let phoneNumberId = changeValue.metadata.phone_number_id;
        let messageObj = changeValue.messages[0];
        let fromNumber = messageObj.from; // User ka WhatsApp number
        let userMessage = messageObj.text ? messageObj.text.body.toUpperCase().trim() : "";

        console.log(`Message mila: ${userMessage} from ${fromNumber}`);

        // Default response agar koi postcode match na ho
        let responseText = "Hello! Welcome to Private Driver London. Kripya koi valid London postcode area bhejein (jaise SW, W, E, NW, SE, WC, EC) taaki hum aapko details de sakein.";

        // Postcode check karein
        for (let code in londonPostcodes) {
          if (userMessage.includes(code)) {
            responseText = `🚗 *Private Driver London*\n\n*London ${code} Area Details:*\n${londonPostcodes[code]}\n\nKya aap yahan ke liye ride book karna chahte hain?`;
            break;
          }
        }

        // WhatsApp Cloud API ke zariye user ko wapas message bhejna
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN; // Aapki token key yahan aayegi
        
        if (accessToken && phoneNumberId) {
          await axios.post(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to: fromNumber,
              text: { body: responseText },
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

module.exports = app;
            
