# VaultViewer Backend API

A secure Express.js and Firebase backend for VaultViewer – an app to organize physical storage using bins and QR-coded item tracking.

## Features
- **User Auth**: Firebase Admin SDK for secure token validation.
- **Bin Routes**: Full CRUD for user-owned bins.
- **Item Routes**: Full CRUD for items in each bin.
- **Modular API Design**: Routers for bins, items, and authentication.
- **Structured Error Handling**: Enum-based error/success messaging.
- **Secure Access**: Firestore security rules enforced at backend and Firebase level.

## Technologies Used
- **Node.js + Express**
- **Firebase Admin SDK**
- **Firestore**
- **TypeScript**
- **CORS & dotenv**

## Developer Notes
- This server runs on `localhost:5000` by default.
- Firebase Admin Auth token used to write therefore cloning repository would result in errors.

## Status
- Production-ready for secure testing and usage with Firebase.
- Designed for clean integration with React Native frontend via RESTful API.