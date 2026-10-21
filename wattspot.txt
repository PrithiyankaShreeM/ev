# WattStop
## Route-Based EV Home Charging Platform

### 1. Project Overview

**WattStop** is a web-based platform that connects electric vehicle (EV) owners with homeowners who have charging points available for use.

EV owners can enter their starting location and destination to discover residential charging points along or near their travel route. They can view charger details, check availability, compare pricing, and book a suitable charging time slot.

Homeowners can register and list their charging points by providing location, connector type, availability, and pricing details. They can choose to offer charging for free or at a specified price.

The main objective of WattStop is to make EV charging more convenient during journeys by connecting drivers with existing residential charging facilities.

**Key Features**
- **Route-Based Search:** Discover home charging points along or near the travel route.
- **Charger Listings:** View charger locations, connector types, and charging details.
- **Availability Management:** Check available charging points and time slots.
- **Booking System:** Reserve a suitable charging time slot.
- **Flexible Pricing:** Support both free and paid charging.
- **Map Integration:** View charger locations and navigate to the selected home.

### 2. System Architecture Diagram

```text
              ┌──────────────────────────┐
              │          USERS           │
              │                          │
              │  EV Drivers | Homeowners │
              └─────────────┬────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │        FRONTEND          │
              │      Web Interface       │
              │                          │
              │ Login and Registration   │
              │ Route Search and Maps    │
              │ Charger Listings         │
              │ Booking Interface        │
              └─────────────┬────────────┘
                            │
                      API Requests
                            │
                            ▼
              ┌──────────────────────────┐
              │         BACKEND          │
              │    Application Server    │
              │                          │
              │ Authentication           │
              │ Charger Management       │
              │ Availability Management  │
              │ Booking and Pricing Logic│
              └─────────────┬────────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
       ┌──────────────────┐  ┌──────────────────┐
       │     DATABASE     │  │     MAPS API     │
       │                  │  │                  │
       │ User Information │  │ Location Search  │
       │ Charger Details  │  │ Route Calculation│
       │ Availability     │  │ Distance and Maps│
       │ Booking Records  │  │ Navigation       │
       └──────────────────┘  └──────────────────┘
```

### 3. Architecture Description

1. **Frontend:** Provides the user interface for EV drivers and homeowners to search for chargers, manage listings, and make bookings.
2. **Backend:** Processes user requests, manages charger availability and pricing, and handles booking operations.
3. **Database:** Stores user accounts, charger information, availability schedules, and booking records.
4. **Maps API:** Supports location search, route calculation, and displaying charging points along or near the selected route.

### 4. Expected Outcome

WattStop aims to provide a convenient way for EV drivers to locate residential charging points during their journeys while allowing homeowners to make their charging facilities available to others. The platform can help improve access to charging options and encourage better utilization of existing residential charging infrastructure.

*Note: The architecture represents the proposed system design. The final technology stack and integrations will depend on the implementation.*
