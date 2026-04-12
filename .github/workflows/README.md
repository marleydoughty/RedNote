# RedNote

A full-stack TypeScript app for tracking period days, notes, and cycle predictions in a clean, mobile-friendly interface.

## Getting Started

---

### Clone the repository

1. From your GitHub repository, click the green `<> Code` button
1. Copy the **HTTPS** URL
1. Open your terminal and run:

   ```sh
   git clone https://github.com/marleydoughty/rednote.git
   cd rednote
   ```

---

### Install dependencies

1. Install all project dependencies from the root directory:

   ```sh
   npm install
   ```

---

### Set up environment variables

1. Create your local environment file:

   ```sh
   cp backend/server/.env.example backend/server/.env
   ```

1. Open `backend/server/.env` and update the values as needed:

   ```env
   DATABASE_URL=postgres://dev:dev@localhost/rednote
   TOKEN_SECRET=your-development-secret
   ```

1. Make the same updates in `backend/server/.env.example` so the expected variables are documented for future use.

---

### Create the database

1. Start PostgreSQL:

   ```sh
   sudo service postgresql start
   ```

1. Create the database:

   ```sh
   createdb rednote
   ```

1. Make sure the `DATABASE_URL` in `backend/server/.env` matches the database name you created.

---

### Import the database schema and seed data

1. Run the database import script:

   ```sh
   npm run db:import
   ```

1. This will apply the files in:

   - `backend/database/schema.sql`
   - `backend/database/data.sql`

1. Any time you update either of those files, run `npm run db:import` again.

---

### Start the development servers

1. Start the app locally:

   ```sh
   npm run dev
   ```

1. To stop the development servers later, press `Ctrl-C` in the terminal.

---

### Verify the app

1. Open the app in your browser
1. Confirm the frontend loads successfully
1. Confirm the server is running properly
1. Confirm the database is connected if your app depends on saved data

## Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Express
- PostgreSQL
- SCSS

## Available `npm` Commands

1. `npm run dev`

   - Starts the development servers.

1. `npm run build`

   - Builds the frontend for production.

1. `npm run start`

   - Starts the backend in production mode.

1. `npm run db:import`

   - Imports the database schema and seed data.

1. `npm run lint`

   - Runs ESLint across the project.

1. `npm run tsc`
   - Runs TypeScript type checking.

## Notes

- Make sure PostgreSQL is running before importing the database
- Keep `.env` out of version control
- Update `.env.example` whenever environment variables change
