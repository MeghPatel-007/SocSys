import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, getDBPool, getDBState } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const IS_VERCEL = Boolean(process.env.VERCEL);

const COMPLAINT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS Complaint (
    ComplaintID SERIAL PRIMARY KEY,
    Complainant VARCHAR(100) NOT NULL,
    Type VARCHAR(60) NOT NULL,
    House VARCHAR(255),
    Description TEXT NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    Date DATE NOT NULL DEFAULT CURRENT_DATE
  )
`;

const BUYER_PROFILE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS buyerprofile (
    buyerid SERIAL PRIMARY KEY,
    google_email VARCHAR(120) UNIQUE NOT NULL,
    full_name VARCHAR(120),
    phone VARCHAR(20),
    password_hash TEXT,
    password_salt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const ADMIN_ACCOUNT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS adminaccount (
    adminid SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    full_name VARCHAR(120),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const SOCSYS_ACCOUNT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS socsysaccount (
    accountid SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('tenant', 'owner', 'admin', 'buyer')),
    linked_email VARCHAR(120) NOT NULL,
    personal_email VARCHAR(180) UNIQUE NOT NULL,
    google_email VARCHAR(120),
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (linked_email, role)
  )
`;

const RESET_OTP_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS passwordresetotp (
    otpid SERIAL PRIMARY KEY,
    accountid INTEGER NOT NULL REFERENCES socsysaccount(accountid) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const OWNER_SALE_LISTING_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ownersalelisting (
    listingid SERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    address VARCHAR(255) NOT NULL,
    bhk VARCHAR(30),
    area NUMERIC(12,2),
    price NUMERIC(14,2) NOT NULL,
    owner_name VARCHAR(120) NOT NULL,
    owner_email VARCHAR(160) NOT NULL,
    owner_phone VARCHAR(30),
    description TEXT,
    image TEXT,
    images JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const PROPERTY_OFFER_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS propertyoffer (
    offerid SERIAL PRIMARY KEY,
    listing_type VARCHAR(20) NOT NULL,
    house_name VARCHAR(180),
    house_address VARCHAR(255),
    owner_name VARCHAR(120),
    owner_email VARCHAR(160),
    owner_phone VARCHAR(30),
    buyer_name VARCHAR(120) NOT NULL,
    buyer_email VARCHAR(160) NOT NULL,
    buyer_phone VARCHAR(30),
    offer_type VARCHAR(20) NOT NULL,
    offer_amount NUMERIC(14,2) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'New',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const allowedOrigins = Array.from(
  new Set(
    String(FRONTEND_ORIGIN || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));

function ensureDatabaseConnected(res) {
  const db = getDBState();

  if (!db.connected) {
    res.status(503).json({
      status: "error",
      message: "PostgreSQL is not connected",
      database: db,
    });
    return false;
  }

  return true;
}

function normalizeDbError(error, fallbackMessage) {
  if (error?.code === "23505") {
    return {
      status: 409,
      message: "Duplicate value found. Please use a unique value.",
      details: error.detail || error.message,
    };
  }

  if (error?.code === "23503") {
    return {
      status: 400,
      message: "Referenced record was not found.",
      details: error.detail || error.message,
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
    details: error?.message || "Unknown database error",
  };
}

async function ensureAuxiliaryTables() {
  const pool = getDBPool();
  await pool.query(COMPLAINT_TABLE_SQL);
  await pool.query(BUYER_PROFILE_TABLE_SQL);
  await pool.query(ADMIN_ACCOUNT_TABLE_SQL);
  await pool.query(SOCSYS_ACCOUNT_TABLE_SQL);
  await pool.query(`
    ALTER TABLE socsysaccount
    DROP CONSTRAINT IF EXISTS socsysaccount_role_check
  `);
  await pool.query(`
    ALTER TABLE socsysaccount
    ADD CONSTRAINT socsysaccount_role_check
    CHECK (role IN ('tenant', 'owner', 'admin', 'buyer'))
  `);
  await pool.query(RESET_OTP_TABLE_SQL);
  await pool.query(OWNER_SALE_LISTING_TABLE_SQL);
  await pool.query(PROPERTY_OFFER_TABLE_SQL);
  await pool.query(`
    ALTER TABLE IF EXISTS house
    ADD COLUMN IF NOT EXISTS image_url TEXT
  `);
  await pool.query(`
    ALTER TABLE IF EXISTS owner
    ADD COLUMN IF NOT EXISTS idproof_image TEXT
  `);
  await pool.query(`
    ALTER TABLE IF EXISTS tenant
    ADD COLUMN IF NOT EXISTS idproof_image TEXT
  `);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

async function ensureRequesterRole(req, res, allowedRoles) {
  const requesterEmail = normalizeEmail(req.headers["x-user-email"]);
  const requesterRole = String(req.headers["x-user-role"] || "")
    .trim()
    .toLowerCase();

  if (!requesterEmail || !requesterRole) {
    res.status(401).json({
      status: "error",
      message: "x-user-email and x-user-role headers are required",
    });
    return null;
  }

  if (!allowedRoles.includes(requesterRole)) {
    res.status(403).json({
      status: "error",
      message: "You are not allowed to perform this action",
    });
    return null;
  }

  if (requesterRole === "admin") {
    const adminEmails = new Set(
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((value) => normalizeEmail(value))
        .filter(Boolean),
    );

    if (adminEmails.has(requesterEmail)) {
      return { email: requesterEmail, role: requesterRole };
    }
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        SELECT accountid
        FROM socsysaccount
        WHERE role = $1
          AND is_active = TRUE
          AND (
            LOWER(personal_email) = $2
            OR LOWER(linked_email) = $2
            OR LOWER(COALESCE(google_email, '')) = $2
          )
        LIMIT 1
      `,
      [requesterRole, requesterEmail],
    );

    if (result.rowCount === 0) {
      res.status(403).json({
        status: "error",
        message: "Account is not authorized for this role",
      });
      return null;
    }

    return { email: requesterEmail, role: requesterRole };
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to validate requester");
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, hash) {
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function sanitizeForLocalPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

function displayNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "user";
  return localPart
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 100);
}

async function makeUniqueRoleIdProof(client, tableName, prefix) {
  for (let i = 0; i < 50; i += 1) {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    const candidate = `${prefix}-${randomPart}`;

    const exists = await client.query(
      `SELECT 1 FROM ${tableName} WHERE idproof = $1 LIMIT 1`,
      [candidate],
    );

    if (exists.rowCount === 0) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique id proof");
}

async function makeUniquePersonalEmail(client, baseLocalPart) {
  for (let i = 0; i < 100; i += 1) {
    const candidate =
      i === 0
        ? `${baseLocalPart}@socsys.com`
        : `${baseLocalPart}${i + 1}@socsys.com`;

    const exists = await client.query(
      `SELECT 1 FROM socsysaccount WHERE personal_email = $1 LIMIT 1`,
      [candidate],
    );

    if (exists.rowCount === 0) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique personal email");
}

app.get("/api/health", (_req, res) => {
  const db = getDBState();

  res.status(200).json({
    status: "ok",
    service: "socsys-express-api",
    database: db,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/authorize-user", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { email, role } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      status: "error",
      message: "email is required",
    });
  }

  if (!role || typeof role !== "string") {
    return res.status(400).json({
      status: "error",
      message: "role is required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const requestedRole = role.trim().toLowerCase();
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM owner o
            WHERE LOWER(o.email) = $1
          ) AS "isOwner",
          EXISTS (
            SELECT 1
            FROM tenant t
            WHERE LOWER(t.email) = $1
          ) AS "isTenant",
          EXISTS (
            SELECT 1
            FROM buyerprofile b
            WHERE LOWER(b.google_email) = $1
          ) AS "isBuyer"
      `,
      [normalizedEmail],
    );

    const row = result.rows?.[0] || {};
    const isOwner = Boolean(row.isOwner);
    const isTenant = Boolean(row.isTenant);
    let isBuyer = Boolean(row.isBuyer);
    const isAdmin = adminEmails.has(normalizedEmail);

    if (!isBuyer && requestedRole === "buyer") {
      await pool.query(
        `
          INSERT INTO buyerprofile (google_email)
          VALUES ($1)
          ON CONFLICT (google_email) DO NOTHING
        `,
        [normalizedEmail],
      );
      isBuyer = true;
    }

    const allowedRoles = [];

    if (isTenant) {
      allowedRoles.push("tenant");
    }

    if (isOwner) {
      allowedRoles.push("owner");
    }

    if (isOwner || isTenant || isBuyer) {
      allowedRoles.push("buyer");
    }

    if (isAdmin) {
      allowedRoles.push("admin");
    }

    if (allowedRoles.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "This email is not registered in SocSys",
      });
    }

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(403).json({
        status: "error",
        message: "This email is not allowed for the selected role",
        allowedRoles,
      });
    }

    return res.status(200).json({
      status: "ok",
      allowedRoles,
      role: requestedRole,
      profile: {
        isOwner,
        isTenant,
        isBuyer,
        isAdmin,
      },
    });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to authorize user");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/auth/personal-account/provision", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const adminEmail = normalizeEmail(req.headers["x-admin-email"]);
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => normalizeEmail(value))
      .filter(Boolean),
  );

  if (adminEmails.size === 0) {
    return res.status(500).json({
      status: "error",
      message: "ADMIN_EMAILS is not configured in Backend/.env",
    });
  }

  if (!adminEmails.has(adminEmail)) {
    return res.status(403).json({
      status: "error",
      message: "Only listed admins can provision personal accounts.",
    });
  }

  const { linkedEmail, role, password, phone, googleEmail } = req.body || {};
  const normalizedLinkedEmail = normalizeEmail(linkedEmail);
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  if (!normalizedLinkedEmail || !password || !normalizedRole) {
    return res.status(400).json({
      status: "error",
      message: "linkedEmail, role and password are required",
    });
  }

  if (!["tenant", "owner", "admin"].includes(normalizedRole)) {
    return res.status(400).json({
      status: "error",
      message: "role must be tenant, owner or admin",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (normalizedRole === "tenant") {
      const check = await client.query(
        `SELECT 1 FROM tenant WHERE LOWER(email) = $1 LIMIT 1`,
        [normalizedLinkedEmail],
      );
      if (check.rowCount === 0) {
        const idProof = await makeUniqueRoleIdProof(client, "tenant", "TEN");
        await client.query(
          `
            INSERT INTO tenant (name, email, idproof, contact)
            VALUES ($1, $2, $3, $4)
          `,
          [
            displayNameFromEmail(normalizedLinkedEmail) || "Tenant User",
            normalizedLinkedEmail,
            idProof,
            phone || null,
          ],
        );
      }
    }

    if (normalizedRole === "owner") {
      const check = await client.query(
        `SELECT 1 FROM owner WHERE LOWER(email) = $1 LIMIT 1`,
        [normalizedLinkedEmail],
      );
      if (check.rowCount === 0) {
        const idProof = await makeUniqueRoleIdProof(client, "owner", "OWN");
        await client.query(
          `
            INSERT INTO owner (name, email, idproof, contact)
            VALUES ($1, $2, $3, $4)
          `,
          [
            displayNameFromEmail(normalizedLinkedEmail) || "Owner User",
            normalizedLinkedEmail,
            idProof,
            phone || null,
          ],
        );
      }
    }

    const existing = await client.query(
      `
        SELECT accountid, personal_email
        FROM socsysaccount
        WHERE linked_email = $1 AND role = $2
        LIMIT 1
      `,
      [normalizedLinkedEmail, normalizedRole],
    );

    const { hash, salt } = hashPassword(String(password));
    let personalEmail;

    if (existing.rowCount > 0) {
      personalEmail = existing.rows[0].personal_email;
      await client.query(
        `
          UPDATE socsysaccount
          SET
            phone = $1,
            google_email = COALESCE($2, google_email),
            password_hash = $3,
            password_salt = $4,
            is_active = TRUE
          WHERE accountid = $5
        `,
        [
          phone || null,
          normalizeEmail(googleEmail) || null,
          hash,
          salt,
          existing.rows[0].accountid,
        ],
      );
    } else {
      const localPartBase = `${sanitizeForLocalPart(normalizedLinkedEmail.split("@")[0])}_${normalizedRole}`;
      personalEmail = await makeUniquePersonalEmail(client, localPartBase);

      await client.query(
        `
          INSERT INTO socsysaccount (
            role,
            linked_email,
            personal_email,
            google_email,
            phone,
            password_hash,
            password_salt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          normalizedRole,
          normalizedLinkedEmail,
          personalEmail,
          normalizeEmail(googleEmail) || null,
          phone || null,
          hash,
          salt,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      status: "ok",
      role: normalizedRole,
      personalEmail,
      message: "Personal account provisioned",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const normalized = normalizeDbError(
      error,
      "Failed to provision personal account",
    );
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  } finally {
    client.release();
  }
});

app.post("/api/auth/personal-account/register-self", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { linkedEmail, role, password, phone, googleEmail, fullName } =
    req.body || {};
  const normalizedLinkedEmail = normalizeEmail(linkedEmail);
  const normalizedGoogleEmail = normalizeEmail(googleEmail || linkedEmail);
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  if (!normalizedLinkedEmail || !normalizedRole || !password) {
    return res.status(400).json({
      status: "error",
      message: "linkedEmail, role and password are required",
    });
  }

  if (!["tenant", "owner", "buyer"].includes(normalizedRole)) {
    return res.status(400).json({
      status: "error",
      message: "role must be tenant, owner or buyer",
    });
  }

  if (normalizedGoogleEmail !== normalizedLinkedEmail) {
    return res.status(400).json({
      status: "error",
      message: "Google email must match your registered role email",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (["tenant", "owner"].includes(normalizedRole)) {
      const roleTable = normalizedRole === "tenant" ? "tenant" : "owner";
      const roleCheck = await client.query(
        `SELECT 1 FROM ${roleTable} WHERE LOWER(email) = $1 LIMIT 1`,
        [normalizedLinkedEmail],
      );

      if (roleCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          status: "error",
          message: `Your email is not registered as ${normalizedRole}`,
        });
      }
    }

    if (normalizedRole === "buyer") {
      await client.query(
        `
          INSERT INTO buyerprofile (google_email, full_name, phone)
          VALUES ($1, $2, $3)
          ON CONFLICT (google_email)
          DO UPDATE SET
            full_name = COALESCE(EXCLUDED.full_name, buyerprofile.full_name),
            phone = COALESCE(EXCLUDED.phone, buyerprofile.phone)
        `,
        [
          normalizedLinkedEmail,
          String(fullName || "").trim() || null,
          phone || null,
        ],
      );
    }

    const existing = await client.query(
      `
        SELECT accountid, personal_email
        FROM socsysaccount
        WHERE linked_email = $1 AND role = $2
        LIMIT 1
      `,
      [normalizedLinkedEmail, normalizedRole],
    );

    const { hash, salt } = hashPassword(String(password));
    let personalEmail;

    if (existing.rowCount > 0) {
      personalEmail = existing.rows[0].personal_email;

      await client.query(
        `
          UPDATE socsysaccount
          SET
            phone = COALESCE($1, phone),
            google_email = $2,
            password_hash = $3,
            password_salt = $4,
            is_active = TRUE
          WHERE accountid = $5
        `,
        [
          phone || null,
          normalizedGoogleEmail,
          hash,
          salt,
          existing.rows[0].accountid,
        ],
      );
    } else {
      const localPartBase = `${sanitizeForLocalPart(normalizedLinkedEmail.split("@")[0])}_${normalizedRole}`;
      personalEmail = await makeUniquePersonalEmail(client, localPartBase);

      await client.query(
        `
          INSERT INTO socsysaccount (
            role,
            linked_email,
            personal_email,
            google_email,
            phone,
            password_hash,
            password_salt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          normalizedRole,
          normalizedLinkedEmail,
          personalEmail,
          normalizedGoogleEmail,
          phone || null,
          hash,
          salt,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      status: "ok",
      role: normalizedRole,
      personalEmail,
      message: "Personal account created. Use it for dashboard login.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const normalized = normalizeDbError(
      error,
      "Failed to register personal account",
    );
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  } finally {
    client.release();
  }
});

app.post("/api/auth/personal-login", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password || "");

  if (!normalizedEmail || !plainPassword) {
    return res.status(400).json({
      status: "error",
      message: "email and password are required",
    });
  }

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => normalizeEmail(value))
      .filter(Boolean),
  );

  if (
    adminEmails.has(normalizedEmail) &&
    process.env.ADMIN_PASSWORD &&
    plainPassword === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({
      status: "ok",
      user: {
        email: normalizedEmail,
        role: "admin",
        provider: "socsys-local",
      },
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        SELECT
          accountid,
          role,
          linked_email,
          personal_email,
          phone,
          google_email,
          password_hash,
          password_salt,
          is_active
        FROM socsysaccount
        WHERE LOWER(personal_email) = $1
        LIMIT 1
      `,
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const account = result.rows[0];

    if (!account.is_active) {
      return res.status(403).json({
        status: "error",
        message: "Account is inactive",
      });
    }

    const passwordValid = verifyPassword(
      plainPassword,
      account.password_salt,
      account.password_hash,
    );

    if (!passwordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      status: "ok",
      user: {
        accountId: account.accountid,
        role: account.role,
        email: account.personal_email,
        linkedEmail: account.linked_email,
        provider: "socsys-local",
      },
    });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to login");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/auth/forgot-password/request", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { identifier } = req.body || {};
  const normalizedIdentifier = normalizeEmail(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({
      status: "error",
      message: "identifier is required",
    });
  }

  try {
    const pool = getDBPool();
    const accountResult = await pool.query(
      `
        SELECT accountid, personal_email, linked_email, phone, google_email
        FROM socsysaccount
        WHERE LOWER(personal_email) = $1
           OR LOWER(linked_email) = $1
           OR LOWER(COALESCE(google_email, '')) = $1
        LIMIT 1
      `,
      [normalizedIdentifier],
    );

    if (accountResult.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "No account found for this identifier",
      });
    }

    const account = accountResult.rows[0];
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    await pool.query(
      `
        INSERT INTO passwordresetotp (accountid, otp_code, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      `,
      [account.accountid, otpCode],
    );

    const response = {
      status: "ok",
      message: "OTP generated. Integrate SMS/Email provider to deliver it.",
      deliveryHint: {
        phone: account.phone || null,
        email: account.google_email || account.linked_email,
      },
    };

    if (process.env.NODE_ENV !== "production") {
      response.devOtp = otpCode;
    }

    return res.status(200).json(response);
  } catch (error) {
    const normalized = normalizeDbError(
      error,
      "Failed to create password reset OTP",
    );
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/auth/forgot-password/verify", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { identifier, otp, newPassword } = req.body || {};
  const normalizedIdentifier = normalizeEmail(identifier);

  if (!normalizedIdentifier || !otp || !newPassword) {
    return res.status(400).json({
      status: "error",
      message: "identifier, otp and newPassword are required",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const accountResult = await client.query(
      `
        SELECT accountid
        FROM socsysaccount
        WHERE LOWER(personal_email) = $1
           OR LOWER(linked_email) = $1
           OR LOWER(COALESCE(google_email, '')) = $1
        LIMIT 1
      `,
      [normalizedIdentifier],
    );

    if (accountResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "No account found for this identifier",
      });
    }

    const accountId = accountResult.rows[0].accountid;
    const otpResult = await client.query(
      `
        SELECT otpid
        FROM passwordresetotp
        WHERE accountid = $1
          AND otp_code = $2
          AND consumed = FALSE
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [accountId, String(otp)],
    );

    if (otpResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP",
      });
    }

    const { hash, salt } = hashPassword(String(newPassword));

    await client.query(
      `
        UPDATE socsysaccount
        SET password_hash = $1, password_salt = $2
        WHERE accountid = $3
      `,
      [hash, salt, accountId],
    );

    await client.query(
      `
        UPDATE passwordresetotp
        SET consumed = TRUE
        WHERE accountid = $1
      `,
      [accountId],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      status: "ok",
      message: "Password updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const normalized = normalizeDbError(error, "Failed to reset password");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  } finally {
    client.release();
  }
});

app.get("/api/dashboard-summary", (_req, res) => {
  const db = getDBState();

  res.status(200).json({
    houses: 10,
    owners: 4,
    tenants: 7,
    pendingComplaints: 2,
    message:
      db.status === "connected"
        ? "Express API and PostgreSQL are connected"
        : "Express API is running; PostgreSQL is not connected yet",
  });
});

app.get("/api/debug/db-status", (_req, res) => {
  const db = getDBState();
  const envCheck = {
    SUPABASE_POOLER_URL: process.env.SUPABASE_POOLER_URL ? "SET" : "NOT SET",
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? "SET" : "NOT SET",
    POSTGRES_SSL: process.env.POSTGRES_SSL,
    VERCEL: process.env.VERCEL ? "true" : "false",
  };

  res.status(200).json({
    dbState: db,
    envCheck: envCheck,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/admin/houses", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        h.houseid AS id,
        h.address,
        COALESCE(h.size, 'N/A') AS type,
        h.block,
        h.status,
        h.currentownerid_fk AS "ownerId",
        h.image_url AS "imageUrl"
      FROM house h
      ORDER BY h.houseid DESC
    `);

    const houses = result.rows.map((house) => ({
      ...house,
      units: 1,
    }));

    res.status(200).json({ status: "ok", houses });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to fetch houses");
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/admin/houses", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { status, type, block, address, ownerId, imageUrl } = req.body || {};
  const normalizedStatusMap = {
    vacant: "Empty",
    empty: "Empty",
    occupied: "Occupied",
    rented: "Rented",
    sold: "Sold",
  };
  const normalizedStatus =
    normalizedStatusMap[
      String(status || "")
        .trim()
        .toLowerCase()
    ] || null;

  if (!normalizedStatus || !block || !address) {
    return res.status(400).json({
      status: "error",
      message:
        "status, block and address are required (status: Empty/Occupied/Rented/Sold)",
    });
  }

  const ownerIdNumber =
    ownerId === "" || ownerId === null || ownerId === undefined
      ? null
      : Number(ownerId);

  if (ownerIdNumber !== null && Number.isNaN(ownerIdNumber)) {
    return res.status(400).json({
      status: "error",
      message: "ownerId must be a valid number",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        INSERT INTO house (status, size, block, address, currentownerid_fk, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          houseid AS id,
          address,
          COALESCE(size, 'N/A') AS type,
          block,
          status,
          currentownerid_fk AS "ownerId",
          image_url AS "imageUrl"
      `,
      [
        normalizedStatus,
        type || null,
        block,
        address,
        ownerIdNumber,
        String(imageUrl || "").trim() || null,
      ],
    );

    const house = {
      ...result.rows[0],
      units: 1,
    };

    return res.status(201).json({ status: "ok", house });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to create house");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.get("/api/admin/owners", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        o.ownerid AS id,
        o.name,
        o.email,
        COALESCE(o.contact, '-') AS phone,
        COALESCE(array_remove(array_agg(h.address ORDER BY h.houseid), NULL), '{}') AS properties
      FROM owner o
      LEFT JOIN house h ON h.currentownerid_fk = o.ownerid
      GROUP BY o.ownerid, o.name, o.email, o.contact
      ORDER BY o.ownerid DESC
    `);

    res.status(200).json({ status: "ok", owners: result.rows });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to fetch owners");
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/admin/owners", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const {
    name,
    contact,
    address,
    street,
    city,
    email,
    idProof,
    idProofImage,
    accountPassword,
  } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !idProof || !accountPassword) {
    return res.status(400).json({
      status: "error",
      message: "name, email, idProof and accountPassword are required",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO owner (
          name,
          contact,
          address,
          street,
          city,
          email,
          idproof,
          idproof_image
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          ownerid AS id,
          name,
          email,
          COALESCE(contact, '-') AS phone
      `,
      [
        name,
        contact || null,
        address || null,
        street || null,
        city || null,
        normalizedEmail,
        idProof,
        String(idProofImage || "").trim() || null,
      ],
    );

    const localPartBase = `${sanitizeForLocalPart(normalizedEmail.split("@")[0])}_owner`;
    const personalEmail = await makeUniquePersonalEmail(client, localPartBase);
    const { hash, salt } = hashPassword(String(accountPassword));

    await client.query(
      `
          INSERT INTO socsysaccount (
            role,
            linked_email,
            personal_email,
            google_email,
            phone,
            password_hash,
            password_salt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (linked_email, role)
          DO UPDATE SET
            phone = COALESCE(EXCLUDED.phone, socsysaccount.phone),
            password_hash = EXCLUDED.password_hash,
            password_salt = EXCLUDED.password_salt,
            is_active = TRUE
        `,
      [
        "owner",
        normalizedEmail,
        personalEmail,
        normalizedEmail,
        contact || null,
        hash,
        salt,
      ],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      status: "ok",
      owner: {
        ...result.rows[0],
        properties: [],
      },
      personalEmail,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const normalized = normalizeDbError(error, "Failed to create owner");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  } finally {
    client.release();
  }
});

app.get("/api/admin/tenants", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        t.tenantid AS id,
        t.name,
        t.email,
        COALESCE(t.contact, '-') AS phone,
        COALESCE(h.address, '-') AS house,
        COALESCE(TO_CHAR(r.startdate, 'YYYY-MM-DD'), '-') AS "moveInDate",
        CASE
          WHEN r.rentalid IS NULL THEN 'Inactive'
          WHEN r.enddate IS NULL OR r.enddate >= CURRENT_DATE THEN 'Active'
          ELSE 'Inactive'
        END AS status
      FROM tenant t
      LEFT JOIN LATERAL (
        SELECT rentalid, houseid_fk, startdate, enddate
        FROM rental
        WHERE tenantid_fk = t.tenantid
        ORDER BY startdate DESC
        LIMIT 1
      ) r ON TRUE
      LEFT JOIN house h ON h.houseid = r.houseid_fk
      ORDER BY t.tenantid DESC
    `);

    res.status(200).json({ status: "ok", tenants: result.rows });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to fetch tenants");
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/admin/tenants", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const {
    name,
    contact,
    address,
    street,
    city,
    email,
    idProof,
    idProofImage,
    accountPassword,
    houseId,
    rentAmount,
    startDate,
    endDate,
  } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !idProof || !accountPassword) {
    return res.status(400).json({
      status: "error",
      message: "name, email, idProof and accountPassword are required",
    });
  }

  const normalizedHouseId = String(houseId || "").trim();
  const normalizedRentAmount = String(rentAmount || "").trim();
  const normalizedStartDate = String(startDate || "").trim();

  const hasAnyRentalField =
    Boolean(normalizedHouseId) ||
    Boolean(normalizedRentAmount) ||
    Boolean(normalizedStartDate);

  if (
    hasAnyRentalField &&
    (!normalizedHouseId || !normalizedRentAmount || !normalizedStartDate)
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "houseId, rentAmount and startDate are all required for rental assignment",
    });
  }

  const houseIdNumber = normalizedHouseId ? Number(normalizedHouseId) : null;
  const rentAmountNumber = normalizedRentAmount
    ? Number(normalizedRentAmount)
    : null;

  if (houseIdNumber !== null && Number.isNaN(houseIdNumber)) {
    return res.status(400).json({
      status: "error",
      message: "houseId must be a valid number",
    });
  }

  if (rentAmountNumber !== null && Number.isNaN(rentAmountNumber)) {
    return res.status(400).json({
      status: "error",
      message: "rentAmount must be a valid number",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tenantResult = await client.query(
      `
        INSERT INTO tenant (
          name,
          contact,
          address,
          street,
          city,
          email,
          idproof,
          idproof_image
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          tenantid AS id,
          name,
          email,
          COALESCE(contact, '-') AS phone
      `,
      [
        name,
        contact || null,
        address || null,
        street || null,
        city || null,
        normalizedEmail,
        idProof,
        String(idProofImage || "").trim() || null,
      ],
    );

    const tenant = tenantResult.rows[0];

    const localPartBase = `${sanitizeForLocalPart(normalizedEmail.split("@")[0])}_tenant`;
    const personalEmail = await makeUniquePersonalEmail(client, localPartBase);
    const { hash, salt } = hashPassword(String(accountPassword));

    await client.query(
      `
        INSERT INTO socsysaccount (
          role,
          linked_email,
          personal_email,
          google_email,
          phone,
          password_hash,
          password_salt
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (linked_email, role)
        DO UPDATE SET
          phone = COALESCE(EXCLUDED.phone, socsysaccount.phone),
          password_hash = EXCLUDED.password_hash,
          password_salt = EXCLUDED.password_salt,
          is_active = TRUE
      `,
      [
        "tenant",
        normalizedEmail,
        personalEmail,
        normalizedEmail,
        contact || null,
        hash,
        salt,
      ],
    );

    if (hasAnyRentalField) {
      await client.query(
        `
          INSERT INTO rental (houseid_fk, tenantid_fk, rentamount, startdate, enddate)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          houseIdNumber,
          tenant.id,
          rentAmountNumber,
          startDate,
          endDate || null,
        ],
      );

      await client.query(
        `
          UPDATE house
          SET status = 'Rented'
          WHERE houseid = $1
        `,
        [houseIdNumber],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      status: "ok",
      tenant: {
        ...tenant,
        house: hasAnyRentalField ? `House #${houseIdNumber}` : "-",
        moveInDate: hasAnyRentalField ? startDate : "-",
        status: hasAnyRentalField ? "Active" : "Inactive",
      },
      personalEmail,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const normalized = normalizeDbError(error, "Failed to create tenant");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  } finally {
    client.release();
  }
});

app.get("/api/admin/complaints", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        complaintid AS id,
        complainant,
        type,
        COALESCE(house, '-') AS house,
        description,
        status,
        TO_CHAR(date, 'YYYY-MM-DD') AS date
      FROM complaint
      ORDER BY complaintid DESC
    `);

    res.status(200).json({ status: "ok", complaints: result.rows });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to fetch complaints");
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/admin/complaints", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { complainant, type, house, description, status, date } =
    req.body || {};

  if (!complainant || !type || !description) {
    return res.status(400).json({
      status: "error",
      message: "complainant, type and description are required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        INSERT INTO complaint (complainant, type, house, description, status, date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          complaintid AS id,
          complainant,
          type,
          COALESCE(house, '-') AS house,
          description,
          status,
          TO_CHAR(date, 'YYYY-MM-DD') AS date
      `,
      [
        complainant,
        type,
        house || null,
        description,
        status || "Pending",
        date || new Date().toISOString().slice(0, 10),
      ],
    );

    return res.status(201).json({ status: "ok", complaint: result.rows[0] });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to create complaint");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.patch("/api/admin/complaints/:id/review", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  if (!(await ensureRequesterRole(req, res, ["admin"]))) {
    return;
  }

  const complaintId = Number(req.params.id);
  if (!complaintId || Number.isNaN(complaintId)) {
    return res.status(400).json({
      status: "error",
      message: "Valid complaint id is required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        UPDATE complaint
        SET status = CASE
          WHEN LOWER(COALESCE(status, '')) = 'resolved' THEN 'Resolved'
          ELSE 'In Progress'
        END
        WHERE complaintid = $1
        RETURNING
          complaintid AS id,
          complainant,
          type,
          COALESCE(house, '-') AS house,
          description,
          status,
          TO_CHAR(date, 'YYYY-MM-DD') AS date
      `,
      [complaintId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      status: "ok",
      complaint: result.rows[0],
      message: "Complaint marked as reviewed",
    });
  } catch (error) {
    const normalized = normalizeDbError(error, "Failed to review complaint");
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.get("/api/admin/maintenance-bills", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        mb.billid AS id,
        h.address AS house,
        mb.amount,
        TO_CHAR(mb.duedate, 'YYYY-MM-DD') AS "dueDate",
        mb.status,
        TO_CHAR(p.datepaid, 'YYYY-MM-DD') AS "paidDate",
        p.mode AS "paymentMethod"
      FROM maintenancebill mb
      JOIN house h ON h.houseid = mb.houseid_fk
      LEFT JOIN LATERAL (
        SELECT p1.datepaid, p1.mode
        FROM payment p1
        WHERE p1.billid_fk = mb.billid
        ORDER BY p1.datepaid DESC, p1.paymentid DESC
        LIMIT 1
      ) p ON TRUE
      ORDER BY mb.billid DESC
    `);

    res.status(200).json({ status: "ok", maintenanceBills: result.rows });
  } catch (error) {
    const normalized = normalizeDbError(
      error,
      "Failed to fetch maintenance bills",
    );
    res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

app.post("/api/admin/maintenance-bills", async (req, res) => {
  if (!ensureDatabaseConnected(res)) {
    return;
  }

  const { houseId, amount, billDate, dueDate, status } = req.body || {};

  if (!houseId || !amount || !dueDate) {
    return res.status(400).json({
      status: "error",
      message: "houseId, amount and dueDate are required",
    });
  }

  const houseIdNumber = Number(houseId);
  const amountNumber = Number(amount);

  if (Number.isNaN(houseIdNumber) || Number.isNaN(amountNumber)) {
    return res.status(400).json({
      status: "error",
      message: "houseId and amount must be valid numbers",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        INSERT INTO maintenancebill (houseid_fk, amount, billdate, duedate, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          billid AS id,
          amount,
          TO_CHAR(duedate, 'YYYY-MM-DD') AS "dueDate",
          status
      `,
      [
        houseIdNumber,
        amountNumber,
        billDate || new Date().toISOString().slice(0, 10),
        dueDate,
        status || "Pending",
      ],
    );

    return res
      .status(201)
      .json({ status: "ok", maintenanceBill: result.rows[0] });
  } catch (error) {
    const normalized = normalizeDbError(
      error,
      "Failed to create maintenance bill",
    );
    return res.status(normalized.status).json({
      status: "error",
      message: normalized.message,
      details: normalized.details,
    });
  }
});

// -----------------------------------------------
// Owner endpoints
// -----------------------------------------------
app.get("/api/owner/houses", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        h.houseid AS id,
        h.address,
        COALESCE(h.size, 'N/A') AS type,
        h.block,
        h.status,
        t.name AS tenant,
        r.rentamount::float AS "rentAmount",
        TO_CHAR(r.enddate, 'YYYY-MM-DD') AS "rentDueDate"
      FROM house h
      LEFT JOIN LATERAL (
        SELECT tenantid_fk, rentamount, enddate
        FROM rental
        WHERE houseid_fk = h.houseid
        ORDER BY startdate DESC
        LIMIT 1
      ) r ON TRUE
      LEFT JOIN tenant t ON t.tenantid = r.tenantid_fk
      ORDER BY h.houseid
    `);
    res.status(200).json({ status: "ok", houses: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch houses");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/owner/tenants", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        t.tenantid AS id,
        t.name,
        t.email,
        COALESCE(t.contact, '-') AS phone,
        COALESCE(h.address, '-') AS house,
        COALESCE(TO_CHAR(r.startdate, 'YYYY-MM-DD'), '-') AS "moveInDate",
        CASE
          WHEN r.rentalid IS NULL THEN 'Inactive'
          WHEN r.enddate IS NULL OR r.enddate >= CURRENT_DATE THEN 'Active'
          ELSE 'Inactive'
        END AS status
      FROM tenant t
      LEFT JOIN LATERAL (
        SELECT rentalid, houseid_fk, startdate, enddate
        FROM rental
        WHERE tenantid_fk = t.tenantid
        ORDER BY startdate DESC
        LIMIT 1
      ) r ON TRUE
      LEFT JOIN house h ON h.houseid = r.houseid_fk
      ORDER BY t.tenantid
    `);
    res.status(200).json({ status: "ok", tenants: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch tenants");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/owner/rent-payments", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        mb.billid AS id,
        h.address AS house,
        COALESCE(t.name, '-') AS tenant,
        mb.amount::float AS amount,
        TO_CHAR(mb.duedate, 'YYYY-MM-DD') AS "dueDate",
        mb.status,
        TO_CHAR(p.datepaid, 'YYYY-MM-DD') AS "paidDate",
        p.mode AS method
      FROM maintenancebill mb
      JOIN house h ON h.houseid = mb.houseid_fk
      LEFT JOIN LATERAL (
        SELECT tenantid_fk
        FROM rental
        WHERE houseid_fk = mb.houseid_fk
          AND (enddate IS NULL OR enddate >= mb.duedate)
        ORDER BY startdate DESC
        LIMIT 1
      ) r ON TRUE
      LEFT JOIN tenant t ON t.tenantid = r.tenantid_fk
      LEFT JOIN LATERAL (
        SELECT datepaid, mode
        FROM payment
        WHERE billid_fk = mb.billid
        ORDER BY datepaid DESC
        LIMIT 1
      ) p ON TRUE
      ORDER BY mb.billid DESC
    `);
    res.status(200).json({ status: "ok", rentPayments: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch rent payments");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/owner/sale-listings", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        listingid AS id,
        title,
        address,
        COALESCE(bhk, 'N/A') AS bhk,
        COALESCE(area::float, 0) AS area,
        COALESCE(price::float, 0) AS price,
        COALESCE(owner_name, 'N/A') AS owner,
        COALESCE(owner_phone, '-') AS phone,
        COALESCE(owner_email, '-') AS email,
        COALESCE(description, '') AS description,
        COALESCE(image, '🏠') AS image,
        COALESCE(images, '[]'::jsonb) AS images,
        created_at AS "createdAt"
      FROM ownersalelisting
      ORDER BY listingid DESC
    `);
    return res.status(200).json({ status: "ok", listings: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch owner sale listings");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.post("/api/owner/sale-listings", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const {
    title,
    address,
    bhk,
    area,
    price,
    owner,
    email,
    phone,
    description,
    image,
    images,
  } = req.body || {};

  if (!title || !address || !price || !owner || !email) {
    return res.status(400).json({
      status: "error",
      message: "title, address, price, owner and email are required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        INSERT INTO ownersalelisting (
          title, address, bhk, area, price,
          owner_name, owner_email, owner_phone,
          description, image, images
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
        RETURNING
          listingid AS id,
          title,
          address,
          COALESCE(bhk, 'N/A') AS bhk,
          COALESCE(area::float, 0) AS area,
          COALESCE(price::float, 0) AS price,
          COALESCE(owner_name, 'N/A') AS owner,
          COALESCE(owner_phone, '-') AS phone,
          COALESCE(owner_email, '-') AS email,
          COALESCE(description, '') AS description,
          COALESCE(image, '🏠') AS image,
          COALESCE(images, '[]'::jsonb) AS images,
          created_at AS "createdAt"
      `,
      [
        title,
        address,
        bhk || null,
        area ? Number(area) : null,
        Number(price),
        owner,
        email,
        phone || null,
        description || null,
        image || null,
        JSON.stringify(Array.isArray(images) ? images : []),
      ],
    );

    return res.status(201).json({ status: "ok", listing: result.rows[0] });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to create owner sale listing");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.delete("/api/owner/sale-listings/:id", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  const listingId = Number(req.params.id);
  if (!listingId || Number.isNaN(listingId)) {
    return res.status(400).json({
      status: "error",
      message: "Valid listing id is required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `DELETE FROM ownersalelisting WHERE listingid = $1 RETURNING listingid AS id`,
      [listingId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Listing not found" });
    }

    return res.status(200).json({ status: "ok", deletedId: listingId });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to delete owner sale listing");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/owner/notifications", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT * FROM (
        SELECT
          CONCAT('offer-', po.offerid) AS id,
          CONCAT(COALESCE(po.offer_type, 'Property'), ' Offer') AS type,
          COALESCE(po.buyer_name, 'Unknown') AS "from",
          COALESCE(po.house_address, '-') AS house,
          CONCAT(
            'Offering ₹', COALESCE(po.offer_amount::text, '0'),
            CASE
              WHEN LOWER(COALESCE(po.offer_type, '')) = 'rent' THEN '/month'
              ELSE ''
            END,
            CASE
              WHEN COALESCE(po.description, '') <> '' THEN CONCAT(' - "', po.description, '"')
              ELSE ''
            END
          ) AS message,
          TO_CHAR(po.created_at::date, 'YYYY-MM-DD') AS date,
          COALESCE(po.status, 'New') AS status,
          po.created_at AS sort_date
        FROM propertyoffer po

        UNION ALL

        SELECT
          CONCAT('complaint-', c.complaintid) AS id,
          'Complaint' AS type,
          COALESCE(c.complainant, 'Unknown') AS "from",
          COALESCE(c.house, '-') AS house,
          CONCAT('[', COALESCE(c.type, 'General'), '] ', COALESCE(c.description, '')) AS message,
          TO_CHAR(c.date, 'YYYY-MM-DD') AS date,
          CASE
            WHEN LOWER(COALESCE(c.status, '')) IN ('new', 'pending') THEN 'New'
            ELSE 'Viewed'
          END AS status,
          c.date::timestamp AS sort_date
        FROM complaint c
      ) n
      ORDER BY n.sort_date DESC, n.id DESC
    `);

    return res.status(200).json({ status: "ok", notifications: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch owner notifications");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.patch("/api/owner/notifications/review", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  if (!(await ensureRequesterRole(req, res, ["owner"]))) {
    return;
  }

  const notificationId = String(req.body?.id || "").trim();
  const [kind, idPart] = notificationId.split("-");
  const numericId = Number(idPart);

  if (!notificationId || !kind || Number.isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({
      status: "error",
      message: "Valid notification id is required",
    });
  }

  try {
    const pool = getDBPool();

    if (kind === "offer") {
      const result = await pool.query(
        `
          UPDATE propertyoffer
          SET status = 'Viewed'
          WHERE offerid = $1
          RETURNING offerid AS id, status
        `,
        [numericId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: "error",
          message: "Offer notification not found",
        });
      }

      return res.status(200).json({
        status: "ok",
        message: "Notification reviewed",
        notification: {
          id: notificationId,
          status: result.rows[0].status,
        },
      });
    }

    if (kind === "complaint") {
      const result = await pool.query(
        `
          UPDATE complaint
          SET status = CASE
            WHEN LOWER(COALESCE(status, '')) = 'resolved' THEN 'Resolved'
            ELSE 'In Progress'
          END
          WHERE complaintid = $1
          RETURNING complaintid AS id, status
        `,
        [numericId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: "error",
          message: "Complaint notification not found",
        });
      }

      return res.status(200).json({
        status: "ok",
        message: "Notification reviewed",
        notification: {
          id: notificationId,
          status: "Viewed",
        },
      });
    }

    return res.status(400).json({
      status: "error",
      message: "Unsupported notification type",
    });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to review notification");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

// -----------------------------------------------
// Tenant endpoints
// -----------------------------------------------
app.get("/api/tenant/profile", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const requestedEmail = normalizeEmail(
    req.query.email || req.headers["x-user-email"],
  );

  if (!requestedEmail) {
    return res.status(400).json({
      status: "error",
      message: "email query param or x-user-email header is required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        WITH resolved AS (
          SELECT COALESCE(
            (
              SELECT linked_email
              FROM socsysaccount
              WHERE role = 'tenant'
                AND (
                  LOWER(personal_email) = $1
                  OR LOWER(linked_email) = $1
                )
              LIMIT 1
            ),
            $1
          ) AS linked_email
        )
        SELECT
          t.tenantid AS id,
          t.name,
          t.email,
          COALESCE(t.contact, '-') AS phone,
          COALESCE(h.address, '-') AS house,
          COALESCE(TO_CHAR(r.startdate, 'YYYY-MM-DD'), '-') AS "moveInDate",
          COALESCE(r.rentamount::float, 0) AS "rentAmount",
          CASE
            WHEN r.rentalid IS NULL THEN 'Inactive'
            WHEN r.enddate IS NULL OR r.enddate >= CURRENT_DATE THEN 'Active'
            ELSE 'Inactive'
          END AS status
        FROM tenant t
        LEFT JOIN LATERAL (
          SELECT rentalid, houseid_fk, startdate, enddate, rentamount
          FROM rental
          WHERE tenantid_fk = t.tenantid
          ORDER BY startdate DESC
          LIMIT 1
        ) r ON TRUE
        LEFT JOIN house h ON h.houseid = r.houseid_fk
        WHERE LOWER(t.email) = (SELECT linked_email FROM resolved)
        LIMIT 1
      `,
      [requestedEmail],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tenant profile not found",
      });
    }

    const profile = {
      ...result.rows[0],
      rentDueDate: "As per agreement",
      emergencyContact: "-",
      occupation: "-",
    };

    return res.status(200).json({ status: "ok", profile });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch tenant profile");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/tenant/maintenance-bills", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        mb.billid AS id,
        TO_CHAR(mb.billdate, 'Month YYYY') AS month,
        mb.amount::float AS amount,
        TO_CHAR(mb.duedate, 'YYYY-MM-DD') AS "dueDate",
        mb.status,
        TO_CHAR(p.datepaid, 'YYYY-MM-DD') AS "paidDate",
        COALESCE(p.mode, '-') AS method
      FROM maintenancebill mb
      LEFT JOIN LATERAL (
        SELECT datepaid, mode
        FROM payment
        WHERE billid_fk = mb.billid
        ORDER BY datepaid DESC
        LIMIT 1
      ) p ON TRUE
      ORDER BY mb.billid DESC
    `);
    res.status(200).json({ status: "ok", maintenanceBills: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch maintenance bills");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/tenant/complaints", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        complaintid AS id,
        complainant,
        type,
        COALESCE(house, '-') AS house,
        description,
        status,
        TO_CHAR(date, 'YYYY-MM-DD') AS date
      FROM complaint
      ORDER BY complaintid DESC
    `);
    res.status(200).json({ status: "ok", complaints: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch complaints");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.post("/api/tenant/maintenance-bills/pay", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const { billId, method } = req.body || {};
  const billIdNumber = Number(billId);
  const paymentMethod = String(method || "Online").trim() || "Online";

  if (!billId || Number.isNaN(billIdNumber)) {
    return res.status(400).json({
      status: "error",
      message: "billId is required and must be a valid number",
    });
  }

  const pool = getDBPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const billResult = await client.query(
      `
        SELECT billid, amount, status
        FROM maintenancebill
        WHERE billid = $1
        LIMIT 1
      `,
      [billIdNumber],
    );

    if (billResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "Maintenance bill not found",
      });
    }

    const bill = billResult.rows[0];

    if (String(bill.status).toLowerCase() === "paid") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "error",
        message: "This maintenance bill is already paid",
      });
    }

    await client.query(
      `
        INSERT INTO payment (billid_fk, amountpaid, datepaid, mode)
        VALUES ($1, $2, CURRENT_DATE, $3)
      `,
      [billIdNumber, bill.amount, paymentMethod],
    );

    await client.query(
      `
        UPDATE maintenancebill
        SET status = 'Paid'
        WHERE billid = $1
      `,
      [billIdNumber],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      status: "ok",
      message: `Payment successful via ${paymentMethod}`,
      billId: billIdNumber,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const e = normalizeDbError(error, "Failed to process payment");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  } finally {
    client.release();
  }
});

app.post("/api/tenant/complaints", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  const { complainant, type, house, description } = req.body || {};
  if (!complainant || !type || !description) {
    return res.status(400).json({
      status: "error",
      message: "complainant, type and description are required",
    });
  }
  try {
    const pool = getDBPool();
    const result = await pool.query(
      `INSERT INTO complaint (complainant, type, house, description)
       VALUES ($1, $2, $3, $4)
       RETURNING
         complaintid AS id, complainant, type,
         COALESCE(house, '-') AS house,
         description, status, TO_CHAR(date, 'YYYY-MM-DD') AS date`,
      [complainant, type, house || null, description],
    );
    return res.status(201).json({ status: "ok", complaint: result.rows[0] });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to create complaint");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.patch("/api/tenant/complaints/:id/review", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  if (!(await ensureRequesterRole(req, res, ["tenant"]))) {
    return;
  }

  const complaintId = Number(req.params.id);
  if (!complaintId || Number.isNaN(complaintId)) {
    return res.status(400).json({
      status: "error",
      message: "Valid complaint id is required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        UPDATE complaint
        SET status = CASE
          WHEN LOWER(COALESCE(status, '')) = 'resolved' THEN 'Resolved'
          ELSE 'In Progress'
        END
        WHERE complaintid = $1
        RETURNING
          complaintid AS id,
          complainant,
          type,
          COALESCE(house, '-') AS house,
          description,
          status,
          TO_CHAR(date, 'YYYY-MM-DD') AS date
      `,
      [complaintId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      status: "ok",
      complaint: result.rows[0],
      message: "Complaint marked as reviewed",
    });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to review complaint");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

// -----------------------------------------------
// User / marketplace endpoints
// -----------------------------------------------
app.get("/api/user/houses-for-sale", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT * FROM (
        SELECT
          CONCAT('sale-', s.saleid) AS id,
          COALESCE(h.address, 'Property') AS title,
          COALESCE(h.address, '-') AS address,
          COALESCE(h.size, 'N/A') AS bhk,
          COALESCE(NULLIF(regexp_replace(COALESCE(h.size, ''), '[^0-9.]', '', 'g'), '')::float, 0) AS area,
          s.saleprice::float AS price,
          COALESCE(o.name, 'N/A') AS owner,
          COALESCE(o.contact, '-') AS phone,
          COALESCE(o.email, '-') AS email,
          '🏠' AS image,
          '' AS description,
          s.saleid AS sort_id
        FROM sale s
        JOIN house h ON h.houseid = s.houseid_fk
        LEFT JOIN owner o ON o.ownerid = h.currentownerid_fk

        UNION ALL

        SELECT
          CONCAT('owner-', osl.listingid) AS id,
          COALESCE(osl.title, 'Property') AS title,
          COALESCE(osl.address, '-') AS address,
          COALESCE(osl.bhk, 'N/A') AS bhk,
          COALESCE(osl.area::float, 0) AS area,
          COALESCE(osl.price::float, 0) AS price,
          COALESCE(osl.owner_name, 'N/A') AS owner,
          COALESCE(osl.owner_phone, '-') AS phone,
          COALESCE(osl.owner_email, '-') AS email,
          COALESCE(osl.image, '🏠') AS image,
          COALESCE(osl.description, '') AS description,
          osl.listingid AS sort_id
        FROM ownersalelisting osl
      ) x
      ORDER BY x.sort_id DESC
    `);
    res.status(200).json({ status: "ok", houses: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch houses for sale");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.post("/api/user/property-offers", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const {
    listingType,
    houseName,
    houseAddress,
    ownerName,
    ownerEmail,
    ownerPhone,
    buyerName,
    buyerEmail,
    buyerPhone,
    offerType,
    offerAmount,
    description,
  } = req.body || {};

  if (!buyerName || !buyerEmail || !offerType || !offerAmount) {
    return res.status(400).json({
      status: "error",
      message: "buyerName, buyerEmail, offerType and offerAmount are required",
    });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        INSERT INTO propertyoffer (
          listing_type, house_name, house_address,
          owner_name, owner_email, owner_phone,
          buyer_name, buyer_email, buyer_phone,
          offer_type, offer_amount, description, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'New')
        RETURNING
          offerid AS id,
          listing_type AS "listingType",
          house_name AS "houseName",
          house_address AS "houseAddress",
          owner_name AS "ownerName",
          owner_email AS "ownerEmail",
          owner_phone AS "ownerPhone",
          buyer_name AS "buyerName",
          buyer_email AS "buyerEmail",
          buyer_phone AS "buyerPhone",
          offer_type AS "offerType",
          offer_amount::float AS "offerAmount",
          COALESCE(description, '') AS description,
          status,
          TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date
      `,
      [
        listingType || null,
        houseName || null,
        houseAddress || null,
        ownerName || null,
        ownerEmail || null,
        ownerPhone || null,
        buyerName,
        buyerEmail,
        buyerPhone || null,
        offerType,
        Number(offerAmount),
        description || null,
      ],
    );

    return res.status(201).json({ status: "ok", offer: result.rows[0] });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to create property offer");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/user/online-status", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const rawEmails = String(req.query?.emails || "").trim();
  const requestedEmails = rawEmails
    ? rawEmails
        .split(",")
        .map((email) => normalizeEmail(email))
        .filter(Boolean)
    : [];

  try {
    const pool = getDBPool();

    const queryWithFilter = `
      SELECT
        a.accountid AS "accountId",
        COALESCE(o.name, display_name.name_guess, 'Owner') AS name,
        LOWER(COALESCE(o.email, a.linked_email, a.personal_email)) AS email,
        COALESCE(o.contact, a.phone, '-') AS phone,
        a.is_active AS "isOnline"
      FROM socsysaccount a
      LEFT JOIN owner o ON LOWER(o.email) = LOWER(a.linked_email)
      LEFT JOIN LATERAL (
        SELECT INITCAP(REPLACE(SPLIT_PART(COALESCE(a.linked_email, a.personal_email), '@', 1), '.', ' ')) AS name_guess
      ) display_name ON TRUE
      WHERE a.role = 'owner'
        AND LOWER(COALESCE(o.email, a.linked_email, a.personal_email)) = ANY($1)
      ORDER BY a.is_active DESC, a.accountid DESC
    `;

    const queryAll = `
      SELECT
        a.accountid AS "accountId",
        COALESCE(o.name, display_name.name_guess, 'Owner') AS name,
        LOWER(COALESCE(o.email, a.linked_email, a.personal_email)) AS email,
        COALESCE(o.contact, a.phone, '-') AS phone,
        a.is_active AS "isOnline"
      FROM socsysaccount a
      LEFT JOIN owner o ON LOWER(o.email) = LOWER(a.linked_email)
      LEFT JOIN LATERAL (
        SELECT INITCAP(REPLACE(SPLIT_PART(COALESCE(a.linked_email, a.personal_email), '@', 1), '.', ' ')) AS name_guess
      ) display_name ON TRUE
      WHERE a.role = 'owner'
      ORDER BY a.is_active DESC, a.accountid DESC
      LIMIT 200
    `;

    const result =
      requestedEmails.length > 0
        ? await pool.query(queryWithFilter, [requestedEmails])
        : await pool.query(queryAll);

    return res.status(200).json({
      status: "ok",
      users: result.rows,
    });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch online status");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.get("/api/user/houses-for-rent", async (_req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  try {
    const pool = getDBPool();
    const result = await pool.query(`
      SELECT
        h.houseid AS id,
        COALESCE(h.address, 'Property') AS title,
        COALESCE(h.address, '-') AS address,
        COALESCE(h.size, 'N/A') AS bhk,
        COALESCE(r.rentamount::float, 0) AS price,
        COALESCE(o.name, 'N/A') AS owner,
        COALESCE(o.contact, '-') AS phone,
        COALESCE(o.email, '-') AS email,
        '🏠' AS image
      FROM house h
      LEFT JOIN owner o ON o.ownerid = h.currentownerid_fk
      LEFT JOIN LATERAL (
        SELECT rentamount FROM rental
        WHERE houseid_fk = h.houseid
        ORDER BY startdate DESC
        LIMIT 1
      ) r ON TRUE
      WHERE h.status NOT IN ('Sold')
      ORDER BY h.houseid
    `);
    res.status(200).json({ status: "ok", houses: result.rows });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch houses for rent");
    res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

// -----------------------------------------------
// Profile update endpoints
// -----------------------------------------------
app.get("/api/owner/profile", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;

  const requestedEmail = normalizeEmail(req.query?.email);
  if (!requestedEmail) {
    return res
      .status(400)
      .json({ status: "error", message: "email query parameter is required" });
  }

  try {
    const pool = getDBPool();
    const result = await pool.query(
      `
        WITH resolved AS (
          SELECT COALESCE(
            (
              SELECT linked_email
              FROM socsysaccount
              WHERE LOWER(personal_email) = $1
                 OR LOWER(linked_email) = $1
                 OR LOWER(COALESCE(google_email, '')) = $1
              ORDER BY accountid DESC
              LIMIT 1
            ),
            $1
          ) AS linked_email
        )
        SELECT
          o.ownerid AS id,
          o.name,
          o.email,
          COALESCE(o.contact, '-') AS phone,
          COALESCE(o.address, '-') AS address,
          COALESCE(COUNT(h.houseid), 0)::int AS "totalProperties"
        FROM owner o
        LEFT JOIN house h ON h.currentownerid_fk = o.ownerid
        WHERE LOWER(o.email) = (SELECT linked_email FROM resolved)
        GROUP BY o.ownerid, o.name, o.email, o.contact, o.address
        LIMIT 1
      `,
      [requestedEmail],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Owner profile not found" });
    }

    return res.status(200).json({ status: "ok", profile: result.rows[0] });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to fetch owner profile");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.put("/api/owner/profile/:id", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  const id = parseInt(req.params.id, 10);
  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ status: "error", message: "Valid owner id is required" });
  }
  const { name, email, phone, address, bankAccount } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ status: "error", message: "name and email are required" });
  }
  try {
    const pool = getDBPool();
    const result = await pool.query(
      `UPDATE owner
       SET name = $1, email = $2, contact = $3, address = $4
       WHERE ownerid = $5
       RETURNING ownerid AS id, name, email, COALESCE(contact,'-') AS phone, address`,
      [name, email, phone || null, address || null, id],
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Owner not found" });
    }
    return res.status(200).json({
      status: "ok",
      owner: { ...result.rows[0], bankAccount: bankAccount || null },
    });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to update owner profile");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

app.put("/api/tenant/profile/:id", async (req, res) => {
  if (!ensureDatabaseConnected(res)) return;
  const id = parseInt(req.params.id, 10);
  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ status: "error", message: "Valid tenant id is required" });
  }
  const { name, email, phone } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ status: "error", message: "name and email are required" });
  }
  try {
    const pool = getDBPool();
    const result = await pool.query(
      `UPDATE tenant
       SET name = $1, email = $2, contact = $3
       WHERE tenantid = $4
       RETURNING tenantid AS id, name, email, COALESCE(contact,'-') AS phone`,
      [name, email, phone || null, id],
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Tenant not found" });
    }
    return res.status(200).json({ status: "ok", tenant: result.rows[0] });
  } catch (error) {
    const e = normalizeDbError(error, "Failed to update tenant profile");
    return res
      .status(e.status)
      .json({ status: "error", message: e.message, details: e.details });
  }
});

let appInitializationPromise;

async function initializeApp() {
  if (appInitializationPromise) {
    return appInitializationPromise;
  }

  appInitializationPromise = (async () => {
    try {
      await connectDB();

      if (getDBState().connected) {
        await ensureAuxiliaryTables();
      }
    } catch (error) {
      console.error(`PostgreSQL connection failed: ${error.message}`);
    }
  })();

  return appInitializationPromise;
}

async function startServer() {
  try {
    await initializeApp();

    app.listen(PORT, () => {
      console.log(`Express API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start local server: ${error.message}`);
  }
}

export default async function handler(req, res) {
  await initializeApp();
  return app(req, res);
}

if (!IS_VERCEL) {
  startServer();
}
