## 1. Our planned project architecture

We'll have three application components and three infrastructure services.

## AI Recruitment System

Frontend

React + Vite + Nginx

Dockerfile: frontend/Dockerfile

Backend API

Node.js + Express

Dockerfile: backend/Dockerfile

RabbitMQ

Message queue for CV processing jobs

Background Worker

Node.js / AI processing

Dockerfile: worker/Dockerfile

Infrastructure

PostgreSQL

Redis

Adminer

## 2. Recommended folder structure

Eventually, our project should look something like this:

```
ai-recruitment-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── worker/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
```

## 3. How we'll develop it

I recommend this implementation order:

| Step | What we'll implement             |
| ---- | -------------------------------- |
| 1    | Frontend and backend Dockerfiles |
| 2    | Worker setup and Dockerfile      |
| 3    | Docker Compose                   |
| 4    | PostgreSQL + Adminer             |
| 5    | RabbitMQ integration             |
| 6    | Redis integration                |
| 7    | Database schema and migrations   |
| 8    | Job criteria APIs                |
| 9    | CV upload and cloud storage      |
| 10   | AI CV analysis and scoring       |
| 11   | RabbitMQ background processing   |
| 12   | Candidate ranking dashboard      |
| 13   | Gmail OAuth and monitoring       |

We'll understand every technology as we implement it, rather than just copying commands.

## 4. One important rule

We won't put everything inside Express.

- Express receives requests and manages business logic.
- RabbitMQ distributes background jobs.
- Worker consumes jobs and performs CV analysis.
- PostgreSQL stores structured data.
- Redis handles caching and temporary data.
- Nginx serves the React frontend.

Docker Compose will eventually start and connect all these services.

Let's continue from your actual progress.

Can you share your current project folder structure (a screenshot or terminal output of `tree /F` on Windows)?

I'll align the next commands with your existing folders instead of making you recreate anything.