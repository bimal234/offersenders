
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
  // We accept BOTH 'message' and 'body' to be robust.
  const { to, message, body, from, apiKey, apiUrl } = request.body;

  // Check if we have at least one content field (message or body)
  if (!to || (!message && !body) || !apiKey || !apiUrl) {
    return response.status(400).json({ error: 'Missing required fields (to, message/body, apiKey, apiUrl)' });
  }

  // Construct Payload for External API
  // We send both keys if possible to ensure compatibility with SMSEveryone and generic wrappers
  const externalPayload = {
    to: to,
    from: from,
    body: body || message,      // Standard
    message: message || body    // Legacy/Specific
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
      body: JSON.stringify(externalPayload),
    });

    // 4. Return the result back to your App
    const data = await res.text();
    return response.status(res.status).send(data);

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
