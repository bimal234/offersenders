
export default async function handler(request, response) {
  // 1. Enable CORS so your website can talk to this function
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle pre-flight check
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. Get data from the App
  // SMSEveryone API format: Message, Originator, Destinations (array), Action
  const { phone, message, apiKey, apiUrl, originator } = request.body;

  // Check if we have required fields
  if (!phone || !message || !apiKey || !apiUrl) {
    return response.status(400).json({ error: 'Missing required fields (phone, message, apiKey, apiUrl)' });
  }

  // Format phone number - ensure it's in international format
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  // If starts with 0, replace with country code (assuming NZ = 64)
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '64' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('64') && !formattedPhone.startsWith('61')) {
    // If no country code, assume NZ (64)
    formattedPhone = '64' + formattedPhone;
  }

  // Construct SMSEveryone API payload format
  const smsPayload = {
    Message: message,
    Originator: originator || '3247', // Default sender number
    Destinations: [formattedPhone],
    Action: 'create'
  };

  try {
    // 3. Send the request to SMSEveryone from the SERVER (no CORS issues here)
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(smsPayload),
    });

    // 4. Return the result back to your App
    const data = await res.text();
    
    // Preserve the status code and response from SMSEveryone API
    return response.status(res.status).send(data);

  } catch (error) {
    console.error('SMS API Error:', error);
    return response.status(500).json({ 
      error: error.message || 'Failed to send SMS',
      Code: -1,
      Message: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
}
