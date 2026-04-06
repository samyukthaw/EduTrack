# Student Assignment Submission System

## Overview
A full stack web app where students can view assignments, submit them, and manage groups. Admins can create/edit/delete assignments and track submissions.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

## Setup Instructions

### Database
1. Create a PostgreSQL database called `student_system`
2. Run the following SQL:
CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, student_id TEXT);
CREATE TABLE groups (id SERIAL PRIMARY KEY, name TEXT, created_by INT);
CREATE TABLE group_members (id SERIAL PRIMARY KEY, group_id INT, user_id INT);
CREATE TABLE assignments (id SERIAL PRIMARY KEY, title TEXT, description TEXT, due_date DATE, onedrive_link TEXT);
CREATE TABLE submissions (id SERIAL PRIMARY KEY, user_id INT, assignment_id INT, confirmed BOOLEAN);

### Backend
1. cd backend
2. Create .env file with: DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT
3. npm install
4. node index.js

### Frontend
1. cd frontend
2. npm install
3. npm run dev

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Register user |
| POST | /login | Login user |
| GET | /assignments | Get all assignments |
| POST | /assignments | Create assignment (admin) |
| PUT | /assignments/:id | Edit assignment (admin) |
| DELETE | /assignments/:id | Delete assignment (admin) |
| POST | /submit/:id | Submit assignment |
| GET | /submissions | View all submissions (admin) |
| GET | /groups | Get user's groups |
| POST | /groups | Create group |
| POST | /groups/:id/add-member | Add member to group |
| DELETE | /groups/:groupId/remove-member/:userId | Remove member |
| GET | /stats | Get submission stats |

## Architecture
Frontend (React/Vite :5173) → REST API → Backend (Express :5000) → PostgreSQL

## Roles
- Student: View assignments, submit, manage groups
- Admin: Create/edit/delete assignments, view analytics