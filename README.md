# Price-My-Gem

An AI-powered gemstone identification, authenticity verification, and market valuation platform consisting of a React Native (Expo) mobile application, a React + Vite web admin dashboard, a Node.js + Express + MySQL backend API, and a FastAPI + TensorFlow Lite gemstone classification service.

## Project Structure

- `mobile-app/` — React Native (Expo) Android/iOS mobile app for gemstone scanning, history, and market price browsing.
- `frontend/` — React + Vite + Tailwind CSS Admin Dashboard for user management, reports, notifications, and gemstone catalog management.
- `backend/` — Node.js + Express + MySQL (`pricemygem_db`) REST API.
- `ai-model/` — Python FastAPI inference service (`gemstone_final_model.tflite` + semantic out-of-distribution verification across 88 gemstone classes).

## Setup Overview

1. **AI Service (`ai-model/`)**
   - Copy `ai-model/.env.example` to `ai-model/.env`, activate a Python virtual environment, install `requirements.txt`, and run:
     ```bash
     uvicorn main:app --host 0.0.0.0 --port 8000
     ```
2. **Backend API (`backend/`)**
   - Copy `backend/.env.example` to `backend/.env`, configure MySQL credentials, initialize & seed `pricemygem_db`, and run:
     ```bash
     npm install
     node src/config/initDatabase.js
     npm run seed
     node src/server.js
     ```
3. **Admin Dashboard (`frontend/`)**
   ```bash
   npm install
   npm run dev -- --port 5173
   ```
4. **Mobile App (`mobile-app/`)**
   ```bash
   npm install
   npx expo start
   ```
