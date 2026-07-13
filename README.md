# CampusOne — AI-Powered Smart Campus Super App

CampusOne is a unified platform consolidating academics, transport, placements, hostel life, library, health, and community services into a single role-based application for students, faculty, administrators, transport staff, placement officers, and club coordinators.

## Project Structure
* `backend/` — Express.js REST API with Socket.IO for real-time services.
* `frontend-web/` — React (Vite) admin web dashboard.
* `frontend-mobile/` — React Native (Expo) mobile super app.

## Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Setup Instructions

### 1. Database & Services Setup
Start the local MongoDB and Redis instances using Docker Compose:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the `backend` folder, install dependencies, configure environment, and run:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend Web Setup
Navigate to `frontend-web`, install dependencies, and run dev server:
```bash
cd frontend-web
npm install
npm run dev
```

### 4. Frontend Mobile Setup
Navigate to `frontend-mobile`, install dependencies, and start Expo:
```bash
cd frontend-mobile
npm install
npx expo start
```
