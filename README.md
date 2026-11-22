# WattStop ⚡
## Advanced Route-Based EV Home Charging Platform with Sarvam AI Voice Assistant

[![Platform](https://img.shields.io/badge/Platform-Full--Stack%20Web-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%206%20%7C%20TailwindCSS-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-emerald.svg)]()
[![Voice AI](https://img.shields.io/badge/Voice%20AI-Sarvam%20Saaras%20%26%20Bulbul-orange.svg)]()
[![Maps](https://img.shields.io/badge/Maps-Leaflet%20%7C%20OSM%20%7C%20OSRM-success.svg)]()

---

### 1. Project Overview

**WattStop** is an advanced full-stack electric vehicle (EV) home charging network that connects EV drivers with residential homeowners offering private charging facilities.

Rather than relying solely on commercial fast-charging corridors with long queues and high peak pricing, drivers can discover verified residential wallboxes and high-capacity home chargers located directly along or in close proximity to their travel route.

The platform was engineered from the ground up using the original WattStop design system from the reference repository branch (`arena/46bcc14f-ev`), preserving its distinctive brand mark (`ϟ wattstop.`), typography (`DM Sans` + `Manrope`), and visual identity (`#252b24` slate cards, `#b9ee45` volt energy accents, and `#f8f9f6` canvas), with optional electric orange accent switching.

---

### 2. System Architecture

```text
              ┌─────────────────────────────────────────────────────┐
              │                  USERS & CLIENTS                    │
              │                                                     │
              │         EV Drivers        │       Homeowners        │
              └──────────────────────────┬──────────────────────────┘
                                         │
                                         ▼
              ┌─────────────────────────────────────────────────────┐
              │                FRONTEND WEB CLIENT                  │
              │             (React 18 + Vite 6 + Tailwind)          │
              │                                                     │
              │  • WattStop UI/UX Shell    • Interactive Leaflet Map│
              │  • Route Planner & GPS     • Charger Onboarding     │
              │  • Atomic Booking Engine   • Host Space Management  │
              │  • Sarvam Voice UI Widget  • Multilingual Controls  │
              └──────────────────────────┬──────────────────────────┘
                                         │ REST API / Multipart Audio
                                         ▼
              ┌─────────────────────────────────────────────────────┐
              │                 BACKEND APPLICATION                 │
              │              (Node.js + Express.js API)             │
              │                                                     │
              │  • JWT Auth & RBAC         • Geospatial Corridor    │
              │  • Charger Management      • Atomic Conflict Engine │
              │  • Booking State Machine   • Sarvam Saaras & Bulbul │
              └───────────────┬──────────────────────┬──────────────┘
                              │                      │
             ┌────────────────┴──────┐        ┌──────┴────────────────┐
             ▼                       ▼        ▼                       ▼
   ┌──────────────────┐    ┌────────────────────┐   ┌──────────────────┐
   │ MONGODB/MONGOOSE │    │  SARVAM AI ENGINE  │   │     MAPS API     │
   │                  │    │                    │   │                  │
   │  • User Accounts │    │  • Saaras STT      │   │ • Leaflet / OSM  │
   │  • Charger Points│    │  • Bulbul TTS      │   │ • Nominatim Geo  │
   │  • Slot Bookings │    │  • Intent Parser   │   │ • OSRM Routing   │
   │  • Voice Logs    │    │  • Tamil/Thanglish │   │ • Haversine Math │
   └──────────────────┘    └────────────────────┘   └──────────────────┘
```

---

### 3. Core Capabilities & Feature Sets

#### 🚗 Driver Dashboard
- **Live GPS & Location Detection**: Detect current location with one click via Browser Geolocation API or search any starting address.
- **Destination & Routing**: OpenStreetMap Nominatim geocoding autocomplete with instant OSRM driving route calculation, total distance in km, and estimated travel time in minutes.
- **Corridor Search**: Filters home chargers situated within a configurable 3–5 km corridor along the calculated journey path.
- **Interactive Leaflet Map**: Custom electric charger markers (`ϟ`), user GPS pulsing beacon, route polylines, and interactive click-to-book popups.
- **Comprehensive Filters**: Filter chargers by AC/DC mode, connector type (`Type 1`, `Type 2`, `CCS`, `CHAdeMO`), capacity (kW), free vs paid, max price slider, and availability.
- **Atomic Booking Engine**: Select date and time slot with real-time conflict checking that prevents double-bookings.
- **My Bookings View**: Track upcoming reservations, active charging sessions, and cancel reservations with reason logging.

#### 🏠 Homeowner Dashboard
- **Host Space Overview**: High-level metrics for active listings, pending reservations, and total earnings.
- **Interactive Map Pin Picker**: Pin exact charger coordinates independently from homeowner residential addresses.
- **Charger Specifications**: Configure AC/DC power mode, connector types, capacity in kW, connector count, driveway instructions, and photograph URLs.
- **Flexible Pricing Models**: Offer 100% free community charging or set custom rates per kWh, per hour, or per session.
- **Operating Hours & Days**: Set available days of the week and daily opening/closing windows.
- **Live Listing Management**: Toggle listings active or temporarily paused with a single click.
- **Booking Requests**: Accept or reject pending driver reservations with driver contact and vehicle info.

#### 🎙 Sarvam AI Voice Assistant
- **Microphone Capture**: Web Audio API / `MediaRecorder` audio capture with live pulsing indicator.
- **Speech-to-Text (STT)**: Integration with Sarvam Saaras API (`https://api.sarvam.ai/speech-to-text`).
- **Text-to-Speech (TTS)**: Integration with Sarvam Bulbul API (`https://api.sarvam.ai/text-to-speech`) for natural audio playback.
- **Multilingual Support**: Supports English, pure Tamil, and Thanglish (Latin-script Tamil).
- **Supported Commands**:
  - *"Enakku nearby charging station find pannu."* (Find nearby chargers)
  - *"Next charger enga irukku?"* (Find next closest charger)
  - *"Free charger book pannu."* (Search & reserve free charging spots)
  - *"Route-la charging point irukka?"* (Search chargers along route)
  - *"Show my upcoming bookings."* (View driver reservations)
  - *"Cancel my booking."* (Cancel active reservation)
- **Automatic Execution**: Performs real application operations, returns structured results, and speaks natural responses.

---

### 4. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Leaflet 1.9, Lucide React |
| **Backend** | Node.js (v18+ / v24), Express.js 4, Multer, Cors, Dotenv |
| **Database** | MongoDB 6+, Mongoose 8 (with dual-mode persistent JSON fallback) |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS password hashing, Role-based authorization |
| **Voice AI** | Sarvam AI (Saaras STT, Bulbul TTS, multilingual intent recognition) |
| **Maps & Navigation**| Leaflet, OpenStreetMap, Nominatim Geocoding, OSRM Routing Machine |

---

### 5. Getting Started & Installation

#### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm
- MongoDB (Local or MongoDB Atlas connection string)
- Sarvam AI API Key (from [sarvam.ai](https://www.sarvam.ai/))

#### 1. Clone the Repository
```bash
git clone <YOUR_NEW_REPOSITORY_URL> wattstop
cd wattstop
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Configure your `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/wattstop
JWT_SECRET=your_jwt_secret_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
```

Start the backend:
```bash
# Seed initial demo chargers and users
npm run seed

# Start server
npm run dev
```
The backend API will run on `http://localhost:5000`.

#### 3. Frontend Setup
In a new terminal window:
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```
The frontend client will run on `http://localhost:5173`.

---

### 6. Demo Accounts (Pre-Seeded)

| Account Type | Email | Password | Role |
|---|---|---|---|
| **EV Driver** | `karthik.driver@wattstop.in` | `password123` | Driver |
| **Homeowner Host** | `priya.host@wattstop.in` | `password123` | Homeowner |

You can also use the **Demo Driver** and **Demo Host** one-click sign-in buttons inside the Auth dialog.

---

### 7. End-to-End Automated Testing

Run the automated 13-point test suite covering user registration, charger publishing, geospatial queries, slot booking, double-booking prevention, cancellation, and voice commands:

```bash
cd backend
node test-e2e.js
```

---

### 8. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
