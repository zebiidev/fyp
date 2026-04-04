# RideShare FYP — Full‑Stack Campus Ride‑Sharing Platform

This repository contains a full‑stack ride‑sharing web application with distinct Passenger, Rider, and Admin experiences. The frontend is built with React + Vite, and the backend is a Node.js/Express API with MongoDB.

## Key Features

Core Experiences
1. Role‑based dashboards for Passenger, Rider, and Admin
2. Ride discovery, requests, and management
3. Secure authentication and profile completion flows

Shared Safety & Communication
1. In‑app messaging for passenger–rider communication (real‑time via Socket.IO)
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

1. `client/` — React frontend (Vite)
2. `server/` — Express API + MongoDB

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
