const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const accountSid = 'AC48e87b1287b47b9ec606929601ee4ab8';
const authToken = '6b3fab6e2ca0d5ab507b5f5d505e4487';
const client = twilio(accountSid, authToken);

// Twilio webhook endpoint
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body.trim();
  const from = req.body.From;

  // Expecting "Origin, Destination"
  const [origin, destination] = incomingMsg.split(',').map(s => s.trim());

  if (!origin || !destination) {
    res.set('Content-Type', 'text/xml');
    return res.send(`<Response><Message>Please send: Origin, Destination</Message></Response>`);
  }

  try {
    const encodedOrigin = encodeURIComponent(origin);
    const encodedDestination = encodeURIComponent(destination);

    const routeRes = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&mode=transit&key=AIzaSyDe5nUC7KKAhkysUfBB9ofQ2FKRM9rE_Qc`
    );
    const data = routeRes.data;

    let reply = `🚌 Route from ${origin} to ${destination}:\n`;

    if (
      data.routes &&
      data.routes.length > 0 &&
      data.routes[0].legs &&
      data.routes[0].legs.length > 0
    ) {
      const leg = data.routes[0].legs[0];
      const steps = leg.steps.filter(step => step.travel_mode === "TRANSIT");
      if (steps.length > 0) {
        steps.forEach((step, idx) => {
          const transit = step.transit_details;
          reply += `\n${idx + 1}. ${transit.departure_stop.name} ➡️ ${transit.arrival_stop.name} (${transit.line.short_name || transit.line.name}, ${transit.line.vehicle.type})`;
        });
        reply += `\n\nEstimated time: ${leg.duration.text}.`;
      } else {
        reply += `No transit route found.`;
      }
    } else {
      reply += `No route found.`;
    }

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (e) {
    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>Sorry, could not fetch route info.</Message></Response>`);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WhatsApp bot running on port ${PORT}`));