
# OfferSender - SaaS SMS Platform

## Features
- **Bulk SMS Sending** (Integrated with SMSEveryone)
- Customer Management
- Campaign Scheduling

## 🚀 How to Run Locally (Recommended for Non-Technical Users)
Running locally resolves "Network Blocked" or "Proxy Locked" errors seen in cloud preview environments.

1. **Download & Install Node.js**
   - Go to [nodejs.org](https://nodejs.org/) and download the "LTS" version. Install it.

2. **Run the App**
   - Download this code to your computer.
   - Open the folder in **VS Code** (or any folder).
   - Open the terminal/command prompt in that folder.
   - Type: `npm install` (Press Enter) - Wait for it to finish.
   - Type: `npm run dev` (Press Enter).

3. **Open in Browser**
   - You will see a link like `http://localhost:5173`. Click it.
   - Login and send! The Local Proxy is pre-configured and will work instantly.

## API Configuration
The app targets `https://smseveryone.com/api/campaign`.
It requires a Basic Auth header (Base64 encoded Username:Password).
