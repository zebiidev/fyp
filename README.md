# RideShare FYP - Full-Stack Campus Ride-Sharing Platform

RideShare FYP is a campus ride-sharing web application with distinct Passenger, Rider, and Admin experiences. The frontend is built with React + Vite, and the backend is a Node.js/Express API with MongoDB and Socket.IO.

## Key Features

Core Platform

1. Role-based dashboards for Passenger, Rider, and Admin
2. JWT authentication with protected routes
3. Account approval flow with pending approval handling
4. Profile completion flows for passengers and riders
5. In-app notifications with unread counts and read/read-all actions

Passenger Features

1. Find rides with route, date, and area-based matching
2. Smart ride search with flexible and fuzzy location matching
3. Join/request rides and manage bookings
4. Ride history for completed and past trips
5. Live ride tracking with Google Maps for active rides
6. Riders-from-my-area discovery based on saved address matching
7. Real-time chat with riders and admins
8. SOS alert submission with ride/location context
9. Complaint submission and complaint history
10. Profile and settings management
11. Rate riders after completed rides

Rider Features

1. Offer rides with pickup, dropoff, seats, time, price, and vehicle details
2. Manage rides and incoming passenger requests
3. Accept or reject passenger ride requests
4. Vehicle profile completion and editing
5. Rider profile completion with verification documents
6. Real-time chat with passengers and admins
7. SOS and complaint tools
8. Profile and settings management
9. Live location publishing for active rides

Admin Features

1. Dashboard stats for users, rides, and complaint activity
2. System analytics for ride trends, ride status breakdown, and role distribution
3. User approval and rejection workflow
4. Rider verification workflow for submitted documents
5. User directory with pagination, role filters, and search
6. Block/unblock users and delete users
7. Registration number directory with add, search, status updates, and bulk insert support
8. Admin management with create-admin and promote-to-admin flows
9. Complaint management with status updates and admin responses
10. System settings for maintenance mode, strict verification, alerts, and service fee percent
11. Admin password update
12. Audit log viewing and PDF export
13. Analytics reset and suspended-account cleanup actions

Safety, Communication, and System Behavior

1. Real-time messaging over Socket.IO
2. Real-time ride notifications for join, accept, reject, cancel, and complete events
3. SOS alerts sent to admins through in-app notifications and Twilio SMS
4. Email notifications for account approval and rejection
5. Image uploads through ImageKit for chat/profile-related media flows

## Tech Stack

Frontend

1. React 19
2. Vite 7
3. Tailwind CSS 4
4. Redux Toolkit
5. React Router 7
6. Framer Motion
7. React Toastify
8. Socket.IO Client
9. `@react-google-maps/api`

Backend

1. Node.js
2. Express 5
3. MongoDB with Mongoose
4. Socket.IO
5. ImageKit
6. Twilio
7. PDFKit
8. Brevo Email API
9. JSON Web Tokens (`jsonwebtoken`)
10. `bcryptjs`

## Project Structure

1. `client/` - React frontend built with Vite
2. `server/` - Express API, MongoDB models, sockets, and services

## Setup

Prerequisites

1. Node.js 18+ recommended
2. MongoDB connection string
3. ImageKit credentials for uploads
4. Twilio credentials for SOS SMS support
5. Brevo credentials for approval/rejection emails
6. Google Maps API key for passenger live tracking

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
JWT_EXPIRES_IN=1d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_url

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
BREVO_SENDER_NAME=Campus Ride Admin

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_phone
TWILIO_MESSAGING_SERVICE_SID=your_service_sid
SOS_ADMIN_PHONE=admin_phone_number
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
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Run the client

```bash
npm run dev
```

## Scripts

Client

1. `npm run dev` - start the Vite dev server
2. `npm run build` - build the frontend for production
3. `npm run preview` - preview the production build
4. `npm run lint` - run ESLint

Server

1. `npm run dev` - start the backend with nodemon
2. `npm run start` - start the backend with Node.js
3. `npm test` - placeholder script, no automated backend tests are currently configured

## Notes

1. Do not commit real secrets. Rotate any credentials that may already have been exposed.
2. `CLIENT_URL` should match the frontend origin so CORS, sockets, and email links work correctly.
3. Live tracking depends on a valid Google Maps API key and active ride status.
4. SOS messaging depends on Twilio configuration and an admin phone number.
5. Approval and rejection emails depend on valid Brevo sender credentials.

## Current Status

1. Passenger live tracking is implemented
2. Notifications, ratings, area matching, and admin audit/export flows are implemented
3. The main remaining work is polishing, testing, and production hardening rather than missing core platform features
