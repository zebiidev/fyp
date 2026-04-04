# RideShare FYP - Full-Stack Campus Ride-Sharing Platform

This repository contains a full-stack ride-sharing web application with distinct Passenger, Rider, and Admin experiences. The frontend is built with React + Vite, and the backend is a Node.js/Express API with MongoDB.

## Key Features

Core Experiences
1. Role-based dashboards for Passenger, Rider, and Admin
2. Ride discovery, requests, and management
3. Secure authentication and profile completion flows

Shared Safety & Communication
1. In-app messaging for passenger-rider communication (real-time via Socket.IO)
2. SOS alerts for emergency situations (Twilio messaging)
3. Complaints workflow for issue reporting and resolution

Passenger
1. Find rides, request/join rides
2. Bookings and ride history
3. Google Maps live ride tracking (passenger view)
4. Profile and settings

Rider
1. Offer rides, manage active rides
2. Vehicle management
3. Profile and settings

Admin
1. Dashboard stats and system analytics
2. User approvals and rider verification
3. User directory and admin management
4. Complaints management
5. System settings + audit log export

## Tech Stack

Frontend
1. React 19, Vite 7, Tailwind CSS 4
2. Redux Toolkit, React Router 7
3. Framer Motion, React Toastify, Socket.IO client

Backend
1. Node.js, Express 5
2. MongoDB with Mongoose
3. Socket.IO for realtime messaging
4. ImageKit for uploads
5. Nodemailer for email
6. Twilio for SOS alerts
7. PDFKit for audit export

## Project Structure

1. `client/` - React frontend (Vite)
2. `server/` - Express API + MongoDB

## Setup

Prerequisites
1. Node.js 18+ recommended
2. MongoDB connection string
3. ImageKit, Twilio, and email credentials (for full feature support)

Backend
1. Install dependencies

```bash
cd server
npm install
```

2. Create `server/.env` with your environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development

IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_url

EMAIL_USER=your_email
EMAIL_PASS=your_app_password

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_phone
TWILIO_MESSAGING_SERVICE_SID=your_service_sid
SOS_ADMIN_PHONE=your_phone
```

3. Run the server

```bash
npm run dev
```

Frontend
1. Install dependencies

```bash
cd client
npm install
```

2. Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DISABLE_ROUTE_GUARDS=false
```

3. Run the client

```bash
npm run dev
```

## Scripts

Client
1. `npm run dev` - start Vite dev server
2. `npm run build` - production build
3. `npm run preview` - preview build
4. `npm run lint` - lint

Server
1. `npm run dev` - start with nodemon
2. `npm run start` - start server

## Notes

1. Do not commit real secrets. Rotate any credentials that may already be in your `.env` files.
2. For production, configure environment variables securely and update CORS settings as needed.

## Roadmap

1. Passenger live tracking with Google Maps (in progress)
