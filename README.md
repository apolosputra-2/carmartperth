# CARMART Perth — Broker Portal

## Getting Started (Local Development)

This guide explains how to run the CARMART Perth project, including the Broker Portal, on your computer.

### 1. Download and extract the project

1. Download the project **ZIP** file from the project owner or approved repository.
2. Right-click the ZIP and choose **Extract All** (Windows), or use your computer's extraction tool.
3. Open the extracted **project root** in **Visual Studio Code**. The project root is the folder containing `package.json`.

> Do not run the project from inside the ZIP file.

### 2. Install prerequisites

Make sure you have:

- **Node.js and npm** installed (use the version required by the project, if specified in `package.json` or `.nvmrc`).
- **Visual Studio Code** or another code editor.
- Access to the project's configured **PostgreSQL** database and required environment variables.

To check Node.js and npm, open a terminal in VS Code (**Terminal → New Terminal**) and run:

```powershell
node -v
npm -v
```

### 3. Install project dependencies

In the terminal, ensure you are in the folder containing `package.json`, then run:

```powershell
npm install
```

If the ZIP includes a valid `package-lock.json` and you want a reproducible install, you can use `npm ci` instead.

### 4. Configure the environment

Obtain the approved development environment configuration from the project administrator. Create or populate `.env` / `.env.local` **as required by the project's configuration**.

The application uses PostgreSQL (via Prisma), authentication, and SMS services. Some features require additional settings, such as database credentials, authentication secrets, Twilio settings, and the public `APP_URL` used by SMS links.

**Never put real passwords, API tokens, or production `.env` files into the ZIP, README, or Git repository.** Ask the administrator for access through an approved secure channel.

> For local testing, use development credentials and a development database. A successful `npm run dev` does not mean all integrations are configured.

### 5. Prepare Prisma (if needed)

After the database configuration is available, generate the Prisma client:

```powershell
npx prisma generate
```

For a **new or uninitialized development database**, ask the project maintainer which migration workflow is approved before applying schema changes. **Do not** run `prisma migrate reset`, `prisma db push`, or other schema-altering commands against a shared or production database without authorization.

If the maintainer confirms existing committed migrations should be applied to the selected database, they may instruct you to run:

```powershell
npx prisma migrate deploy
```


### 6. Create Portal Accounts and Configure Passwords

The Broker Portal uses database-backed accounts with three roles:

- **STAFF** — Manages customer applications and broker assignments.
- **BOSS** — Has broader administrative visibility and staff-level operations.
- **BROKER** — Reviews assigned applications and updates finance statuses.

Account passwords are stored as bcrypt hashes in PostgreSQL.

#### 6.1 Create the default portal accounts

From the project root, run:

```powershell
node scripts/seed-portal-users.cjs
```

This script creates the predefined Staff, Boss, and Broker accounts.

If an account with the same name and role already exists, it is skipped.

**Important:** This script does not assign email addresses or passwords.

#### 6.2 Assign an email address

Each account must have an email address before its password can be configured.

Open Prisma Studio:

```powershell
npx prisma studio
```

1. Open the `PortalUser` table.
2. Find the account you want to configure.
3. Enter its email address in the `email` field.
4. Confirm `isActive` is `true`.
5. Save the record.

Each email address must be unique.

#### 6.3 Set or reset an account password

From the project root, run:

```powershell
node scripts/set-portal-password.cjs
```

The script will prompt for:

1. **Account email** — The email associated with the existing account.
2. **Temporary test password** — Minimum 12 characters.
3. **Confirm test password** — Re-enter the same password.

If successful, the terminal displays:

`Password configured for [account name].`

The password is hashed using bcrypt with a cost factor of 12 before being stored in the `PortalUser` table.

**Security warning:** The current script displays password input in the terminal. Run it privately, do not record the password in documentation or terminal logs, and use securely generated temporary credentials.

#### 6.4 Verify login

Start the development server:

```powershell
npm run dev
```

Open:

http://localhost:3000/login

Sign in with the configured account credentials.

Verify that the account can access only the features permitted by its role.

#### 6.5 Resetting an existing password

Run the same command again:

```powershell
node scripts/set-portal-password.cjs
```

Enter the existing account email and a new password.

The script replaces the previously stored password hash.

This procedure requires authorized access to the application database and must only be performed by an approved administrator.

### 7. Start the program

Run:

```powershell
npm run dev
```

Open the local address shown in your terminal. By default, this is usually:

**http://localhost:3000**

Useful routes (subject to your account permissions):

| URL | Purpose |
| --- | --- |
| `http://localhost:3000/` | Public Carmart Perth website |
| `http://localhost:3000/login` | Portal login |
| `http://localhost:3000/broker` | Broker Portal dashboard |
| `http://localhost:3000/finance/apply` | Customer finance application |

Keep the terminal running while using the application. Press **Ctrl + C** to stop the development server.

### 7. Quick troubleshooting

| Problem | What to check |
| --- | --- |
| `npm` or `node` not recognized | Install Node.js and restart the terminal. |
| `package.json` not found | Open the correct extracted project root. |
| Missing module / dependency | Run `npm install` in the project root. |
| Database or Prisma error | Check the approved database configuration and run `npx prisma generate`; ask the maintainer before changing the database schema. |
| Login fails | Confirm the environment configuration and that your account is provisioned. |
| Port 3000 already in use | Stop the other server, or use the alternate local URL printed in the terminal. |
| SMS links don't work | SMS requires the relevant provider configuration and, for externally accessible consent links, a public HTTPS `APP_URL`. `localhost` is not publicly accessible. |
| Uploaded files are missing | Current development document storage uses `private-uploads/` on the server running the app; the database alone does not contain the file bytes. |

## Important Notes

- **Development only:** `npm run dev` starts the local development server; it is **not** a production deployment command.
- **Sensitive data:** Do not use live customer data unless access, security controls, retention, and operating procedures have been approved.
- **File storage:** Existing invoice and document uploads depend on the server's private filesystem. Production hosting needs durable private storage and a verified backup/recovery plan.
- **Project scope:** The repository also contains legacy CRM pages and public website components. The Broker Portal is available under `/broker`.

For implementation details, refer to **CARMART Broker Portal — Technical Handover v1.0** and contact the project administrator for credentials, database access, and approved deployment procedures.
