import crypto from "node:crypto";
import fs from "node:fs/promises";
import process from "node:process";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const email = (process.env.SUPERADMIN_EMAIL || "superadmin@example.com").toLowerCase();
const fullName = process.env.SUPERADMIN_FULL_NAME || "Super Admin";
const password = process.env.SUPERADMIN_PASSWORD || crypto.randomBytes(24).toString("base64url");

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (password === "ChangeMe!12345") {
  console.error("Refusing to create a superadmin with the default password.");
  process.exit(1);
}

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
    ? undefined
    : { rejectUnauthorized: false },
});

let sql = await fs.readFile("prisma/create-superadmin.sql", "utf8");
sql = sql
  .replace("lower('superadmin@example.com')", `lower(${sqlString(email)})`)
  .replace("crypt('ChangeMe!12345', gen_salt('bf', 12))", `crypt(${sqlString(password)}, gen_salt('bf', 12))`)
  .replace("'Super Admin',", `${sqlString(fullName)},`);

await client.connect();

try {
  await client.query(sql);

  const result = await client.query(
    `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.status::text AS user_status,
      o.slug AS organization_slug,
      r.code AS role_code,
      om.status::text AS member_status
    FROM users u
    JOIN organizations o ON o.id = u.organization_id
    JOIN organization_members om ON om.user_id = u.id AND om.organization_id = o.id
    LEFT JOIN roles r ON r.id = om.role_id
    WHERE u.email = lower($1)
    ORDER BY u.id DESC
    LIMIT 1
    `,
    [email],
  );

  if (!result.rows.length) {
    throw new Error("Superadmin creation ran, but verification query did not find the user.");
  }

  const user = result.rows[0];
  console.log(`created_or_updated=true`);
  console.log(`email=${user.email}`);
  console.log(`temporary_password=${password}`);
  console.log(`user_id=${user.id}`);
  console.log(`full_name=${user.full_name}`);
  console.log(`user_status=${user.user_status}`);
  console.log(`organization_slug=${user.organization_slug}`);
  console.log(`role_code=${user.role_code}`);
  console.log(`member_status=${user.member_status}`);
} finally {
  await client.end();
}
