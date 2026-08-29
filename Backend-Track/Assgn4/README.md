docker run --name taskdb -e @Dev123=dev -e POSTGRES_DB=tasks -p 5432:5432 -v taskdata:/var/lib/postgresql/data -d postgres

# Task API

A RESTful Task Management API built with Node.js, Express and PostgreSQL.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- Docker Compose

## Project Structure

```text
task-api/
├── src/
│   ├── server.js
│   └── db.js
├── .env.example
├── .gitignore
├── Dockerfile
├── compose.yaml
├── package.json
└── README.md