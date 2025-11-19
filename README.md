🚀 WebChat — Real-Time Chat App (NestJS + React + PostgreSQL)



A clean, modern full-stack chat application featuring:



🔐 JWT Authentication (Sign up + Login)



💬 Real-Time Messaging via WebSockets (Socket.IO)



👤 Direct Messages (DMs)



🏠 Public Rooms (e.g., general, dev, random)



📝 Typing Indicators



🗃️ Message Persistence using PostgreSQL + TypeORM



🎨 Dark, Minimal UI built with React + Vite



📂 Project Structure

webchat/

│

├── backend/        # NestJS API + WebSocket Gateway + PostgreSQL

└── frontend/       # React + Vite client application



🧩 Tech Stack

Backend



NestJS 10



WebSockets (Socket.IO)



JWT Authentication (@nestjs/jwt)



Guards + Strategies (passport-jwt)



TypeORM + PostgreSQL



Bcrypt password hashing



Frontend



React 18



Vite



Socket.IO Client



Clean custom CSS (dark mode)



⚙️ 1. Backend Setup

📦 Install dependencies

cd backend

npm install



🔧 Environment Variables



Create a .env file:



PORT=3000

FRONTEND\_URL=http://localhost:5173



\# JWT

JWT\_SECRET=super\_secret\_jwt\_key

JWT\_EXPIRES\_IN=1h



\# PostgreSQL

DB\_HOST=localhost

DB\_PORT=5432

DB\_USER=postgres

DB\_PASS=password

DB\_NAME=jwt\_chat





(You also have backend/.env.example included.)



🛠️ Run the backend

npm run start:dev





NestJS will start at:



👉 http://localhost:3000



WebSocket server is powered by Socket.IO (same origin).



🎨 2. Frontend Setup

📦 Install

cd frontend

npm install



▶️ Run Vite dev server

npm run dev





Default URL:



👉 http://localhost:5173



💡 3. How to Use



Open the frontend in your browser.



Enter a username and password.



Select Sign up → click button.



Switch to Login if needed.



After login:



Join a public room (e.g., general)



Or start a direct message with another username.



Open a second browser tab with another user to chat in real time.



Messages persist in PostgreSQL. DMs are private. Typing status updates appear in real time.



🌐 4. API Overview

Authentication



POST /auth/signup



POST /auth/login



WebSockets



Events include:



Event	Direction	Purpose

join	client → server	join a room

leave	client → server	leave a room

history	client → server	fetch room history

message	server ↔ client	send and receive messages

typing	client → server	typing indicator

system	server → client	join/leave notifications

📤 5. Push to GitHub



From project root:



git init

git add .

git commit -m "Initial commit: WebChat full project"

git branch -M main

git remote add origin https://github.com/<your-username>/<repo>.git

git push -u origin main



🐳 6. Deployment Notes

Backend (NestJS)



Deploy on:



Render



Railway



Heroku



Docker



VPS



Make sure to set environment variables for:



PostgreSQL



JWT\_SECRET



CORS FRONTEND\_URL



Frontend (React + Vite)



Deploy on:



Vercel



Netlify



GitHub Pages (with adapter)



Update API URL in environment config if backend is hosted remotely.



📸 7. Screenshots



(Add your screenshots here)



frontend/public/screenshot1.png

frontend/public/screenshot2.png



⭐ 8. If you like this project…



Give it a star ⭐ on GitHub!

It helps motivate continued improvements \& new features.

