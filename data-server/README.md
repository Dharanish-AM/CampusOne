# CampusOne Data Server (Neo4j Graph Database Backend)

Express.js REST API service powered by **Neo4j Graph Database** for relational graph modeling across students, faculty, departments, courses, batches, sections, timetables, examinations, and results.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Neo4j](https://neo4j.com/) (v5.x Community or Enterprise / Docker / Neo4j Desktop)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your Neo4j credentials:

```bash
cp .env.example .env
```

Default connection parameters:
```env
PORT=3000
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Migrations & Database Validation

```bash
# Run graph migrations
npm run db:migrate

# Validate schema and queries
npm run db:validate
```

### 4. Start Server

```bash
# Development mode with Nodemon
npm run dev

# Production start
npm start
```

## Graph Schema & Documentation

Detailed graph specifications and Cypher query patterns can be found in:
- `docs/graph-model.md` — Node labels, properties, and relationship directions
- `docs/relationships.md` — Semantic relationships reference
- `docs/constraints-and-indexes.md` — Unique constraints and performance indexes
- `docs/query-examples.md` — Cypher traversal examples
