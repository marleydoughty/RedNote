### RedNote

A full-stack TypeScript app for tracking period days, notes, and cycle predictions in a clean, mobile-friendly interface.

### Preview



https://github.com/user-attachments/assets/8183dd34-5245-4485-be71-7a614eafae46



### Clone the repository

   ```sh
   git clone https://github.com/marleydoughty/rednote.git
   cd rednote
   ```

### Install dependencies

   ```sh
   npm install
   ```

### Set up environment variables

   ```sh
   cp backend/server/.env.example backend/server/.env
   ```

Open `backend/server/.env` and update the values as needed:

   ```env
   DATABASE_URL=postgres://dev:dev@localhost/rednote
   TOKEN_SECRET=your-development-secret
   ```

### Create the database

Start PostgreSQL:

   ```sh
   sudo service postgresql start
   ```

Create the database:

   ```sh
   createdb rednote
   ```

Make sure the `DATABASE_URL` in `backend/server/.env` matches the database name you created.

### Import the database schema and seed data

Run the database import script:

   ```sh
   npm run db:import
   ```
This will apply the files in:

   - `backend/database/schema.sql`
   - `backend/database/data.sql`

Any time you update either of those files, run `npm run db:import` again.

### Start the development servers

Start the app locally:

   ```sh
   npm run dev
   ```

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

## Notes

- Make sure PostgreSQL is running before importing the database
- Keep `.env` out of version control
- Update `.env.example` whenever environment variables change
