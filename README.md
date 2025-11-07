# INSY7314 - International Payments Project (Part 3)

This repository contains the frontend and backend for the International Payments project. Part 3 implements an employee portal, admin management features, and *full Dockerization with security improvements requested from Part 2.
## Youtube links:
1.  [https://youtu.be/oaaIQSa7vVs] - React Application
2.  [https://youtu.be/6U7oSlcWndA] - MongoDB
## Team Members

Replace the placeholder entries below with the actual team names and student numbers for your submission.

| Member Name | Student Number | Role |
| --- | ---: | --- |
| Yanga Nogaya | st10374462 | Security Lead |
| Primrose Mutapati | ST10044840 | DevOps / Docker /Backend Lead |
| Yemvelo Sonka | ST10397913 | Frontend Lead |


## Project Overview

Assignment goal: extend the payment portal from Part 2 by adding a new employee-only portal (for approving/rejecting payments), an administrator portal for managing employee accounts, implementing any feedback from Part 2, and Dockerizing the full application (frontend + backend) so it can be launched with a single docker-compose file.

Key requirements implemented:
- Role-based portals (Admin, Employee, Regular User)
- Admin features for creating/deleting/managing employee accounts
- Employee portal to view pending payments and approve/deny them, plus a history view
- Secure authentication (tokens/cookies) and token refresh handling
- Regex whitelisting/blacklisting, input validation, and other frontend/backend protections
- SSL for frontend and backend (self-signed certs included for localhost testing)
- Docker + docker-compose integration for easy startup


## Features

Backend (server)
- REST API for authentication, user management, and transactions
- Admin endpoints for user management and transaction oversight
- Employee endpoints to fetch assigned transactions and update status
- Token handling with refresh workflow and secure cookie support
- Input validation and sanitization middleware
- Rate limiting and basic logging

Admin Portal (`/admin`)
- Login as admin
- List employees (without exposing passwords)
- Create employee accounts (admin creates employees; no public registration for employees)
- Delete employee accounts
- View transaction statistics and perform admin-level transaction actions

Employee Portal (`/employee`)
- Login as an employee
- View assigned transactions (pending/accepted/rejected)
- Filter transactions by status
- View history of processed transactions
- (Optional extension) Approve/deny transactions (this repo contains hooks and API calls to enable these actions)

User Portal (`/dashboard`)
- Register/login (public registration for normal users)
- Submit new transactions
- View own transaction history


## Security Overview

This project follows the security design laid out in Part 1 and implements protections and hardening in Parts 2 and 3. Highlights:

- Password hashing: bcrypt with a secure cost factor is used for storing passwords (hash & salt). Ensure the cost factor meets your assessment requirements.
- Authentication tokens: short-lived access tokens with refresh workflows. Refresh tokens are handled securely and are revocable.
- HTTPS / TLS: both frontend and backend are configured for HTTPS in development with provided certificates in `/certs` (use real CA-signed certs in production).
- Input validation and sanitization: validation middleware (server) and client-side validation (regex whitelist/blacklist) to reduce injection and malformed input attacks.
- Protection against common web attacks:
  - XSS: sanitize user inputs, escape outputs where appropriate, and set secure HTTP headers.
  - CSRF: use SameSite cookies and avoid exposing sensitive endpoints to cross-site requests; apply CSRF mitigations for cookie-based auth if applicable.
  - Injection (NoSQL/SQL): use parameterized queries / ORM (Mongoose) and validate inputs to avoid injection attacks.
  - Insecure Direct Object References (IDOR): enforce authorization checks on every sensitive endpoint (role checks and ownership checks).
  - Brute force: rate limiting and optional account lockouts for repeated failed login attempts.
- Secure headers and middleware: server uses security middleware (helmet-like), CORS configuration, and content security rules. See `backend/middlewares/securityMiddleware.js` and `backend/middlewares/rateLimiters.js`.
- Logging and monitoring: backend includes logging for key events and admin-only system endpoints for diagnostics.

For more technical detail, see `docs/SECURITY.md` and `Part3Considerations.md` in this repository.

## How to run (development)

Prerequisites: Node.js, npm, Docker (optional for containerized run)

1. Install frontend dependencies

```powershell
cd 'd:\GitHub Repos\INSY7314-International-Payments-Project\frontend'
npm install
npm run dev
```

2. Install backend dependencies and start backend

```powershell
cd 'd:\GitHub Repos\INSY7314-International-Payments-Project\backend'
npm install
node app.js
```

3. Visit the app in the browser (development):
- User portal: `https://localhost:5173` (or the port shown by Vite)
- Admin portal: `https://localhost:5173/admin`
- Employee portal: `https://localhost:5173/employee`

Note: self-signed certs are included in `/certs` for local HTTPS. Your browser may require accepting the certificate for localhost.


## How to run (Docker)

The project includes dockerization for each service. From the project root run:

```powershell
cd 'd:\GitHub Repos\INSY7314-International-Payments-Project'
docker-compose up --build
```

This will build and start the backend and frontend containers. Ports and other configuration may be set in the compose file.


## References & Resources

- OWASP Top Ten - https://owasp.org
- bcrypt documentation and guides
- JWT best-practices and RFCs
- React Router documentation
- Vite documentation
- Docker & docker-compose documentation
- MDN Web Docs (CORS, CSP, cookies, headers)
- Project-specific security notes: see `docs/SECURITY.md` and `Part3Considerations.md` in this repo

