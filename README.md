# EduTrack – Assignment Management System

##  Overview

EduTrack is a full-stack web application designed to streamline assignment management for students and professors. It provides role-based access, enabling professors to create and track assignments while allowing students to submit and monitor their progress.

---

## Features

### Authentication

* JWT-based login and registration
* Role-based access (Student / Professor)
* Secure password handling using bcrypt

---

### Student Features

* View enrolled courses
* Enroll in available courses
* View assignments with deadlines and details
* Submit assignments (individual & group)
* Track submission status with progress indicators
* Create and manage groups
* Group leader acknowledgment system

---

### Professor Features

* Create and manage courses
* Create, edit, and delete assignments
* View all student submissions
* Track submission progress
* Monitor acknowledgment status

---

### UI/UX

* Responsive design using Tailwind CSS
* Interactive dashboards with progress bars
* Clean and intuitive interface

---

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

---

## Project Structure

```
EduTrack/
├── backend/
│   ├── models/
│   ├── index.js
│
├── frontend/
│   ├── src/
│   ├── pages/
│
└── README.md
```

---

## ⚙️ Setup (Quick)

### Backend
cd backend  
npm install  
node index.js  

### Frontend
cd frontend  
npm install  
npm run dev  

## Live Demo
Frontend: https://edu-track-lilac.vercel.app/
## Demo Video
https://youtu.be/HPClovKQsqw

---

## 👤 Author
Samyuktha
