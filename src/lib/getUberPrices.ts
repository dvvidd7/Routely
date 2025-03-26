var request = require('request');

// Set the API endpoint and request options
var options = {
  method: 'POST',
  url: 'https://auth.uber.com/oauth/v2/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  form: {
    client_id: '<CLIENT_ID>', // Replace with your actual Client ID
    client_secret: '<CLIENT_SECRET>', // Replace with your actual Client Secret
    grant_type: 'client_credentials',
    scope: 'eats.deliveries', // The scope of access required
  },
};

// Send the request to Authorization API
request(options, function (error: string, response: { body: any; }) {
  if (error) throw new Error(error);
  console.log(response.body); // Print the response body containing the access token
});