import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const schemaArg = process.argv.find((arg) => arg.startsWith("--schemas="));
const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const schemas = (schemaArg?.slice("--schemas=".length) || "public")
  .split(",")
  .map((schema) => schema.trim())
  .filter(Boolean);
const outDir = outArg?.slice("--out=".length) || "prisma/dump";

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
    ? undefined
    : { rejectUnauthorized: false },
});

const qn = (name) => `"${String(name).replaceAll('"', '""')}"`;
const qualified = (schema, name) => `${qn(schema)}.${qn(name)}`;
const sqlString = (value) => {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
};

const header = (title) => [
  "-- =====================================================================",
  `-- ${title}`,
  `-- Generated at ${new Date().toISOString()}`,
  `-- Schemas: ${schemas.join(", ")}`,
  "-- =====================================================================",
  "",
].join("\n");

async function rows(sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function dumpExtensions() {
  const installed = await rows(
    `
    SELECT extname
    FROM pg_extension
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname
    `,
  );

  return installed
    .map((extension) => `CREATE EXTENSION IF NOT EXISTS ${qn(extension.extname)};`)
    .join("\n");
}

async function dumpSchemas() {
  return schemas
    .filter((schema) => schema !== "public")
    .map((schema) => `CREATE SCHEMA IF NOT EXISTS ${qn(schema)};`)
    .join("\n");
}

async function dumpTypes() {
  const enumRows = await rows(
    `
    SELECT n.nspname AS schema_name, t.typname AS type_name,
           json_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE n.nspname = ANY($1)
    GROUP BY n.nspname, t.typname
    ORDER BY n.nspname, t.typname
    `,
    [schemas],
  );

  const domains = await rows(
    `
    SELECT n.nspname AS schema_name,
           t.typname AS type_name,
           pg_catalog.format_type(t.typbasetype, t.typtypmod) AS base_type,
           t.typnotnull AS not_null,
           t.typdefault AS default_value
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = ANY($1)
      AND t.typtype = 'd'
    ORDER BY n.nspname, t.typname
    `,
    [schemas],
  );

  const enumSql = enumRows.map((row) => {
    const labels = row.labels.map(sqlString).join(", ");
    return [
      `DO $$ BEGIN`,
      `    CREATE TYPE ${qualified(row.schema_name, row.type_name)} AS ENUM (${labels});`,
      `EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ].join("\n");
  });

  const domainSql = domains.map((row) => {
    const parts = [
      `CREATE DOMAIN ${qualified(row.schema_name, row.type_name)} AS ${row.base_type}`,
    ];
    if (row.not_null) parts.push("NOT NULL");
    if (row.default_value) parts.push(`DEFAULT ${row.default_value}`);
    return `${parts.join(" ")};`;
  });

  return [...enumSql, ...domainSql].join("\n\n");
}

async function dumpSequences() {
  const sequences = await rows(
    `
    SELECT schemaname AS schema_name,
           sequencename AS sequence_name,
           data_type,
           start_value,
           min_value,
           max_value,
           increment_by,
           cycle,
           cache_size
    FROM pg_sequences
    WHERE schemaname = ANY($1)
    ORDER BY schemaname, sequencename
    `,
    [schemas],
  );

  return sequences
    .map((sequence) => {
      const parts = [
        `CREATE SEQUENCE IF NOT EXISTS ${qualified(sequence.schema_name, sequence.sequence_name)}`,
        `AS ${sequence.data_type}`,
        `INCREMENT BY ${sequence.increment_by}`,
        `MINVALUE ${sequence.min_value}`,
        `MAXVALUE ${sequence.max_value}`,
        `START WITH ${sequence.start_value}`,
        `CACHE ${sequence.cache_size}`,
      ];
      if (sequence.cycle) parts.push("CYCLE");
      return `${parts.join("\n    ")};`;
    })
    .join("\n\n");
}

async function dumpSequenceOwnership() {
  const ownership = await rows(
    `
    SELECT seq_ns.nspname AS sequence_schema,
           seq.relname AS sequence_name,
           table_ns.nspname AS table_schema,
           tbl.relname AS table_name,
           att.attname AS column_name
    FROM pg_class seq
    JOIN pg_namespace seq_ns ON seq_ns.oid = seq.relnamespace
    JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
    JOIN pg_class tbl ON tbl.oid = dep.refobjid
    JOIN pg_namespace table_ns ON table_ns.oid = tbl.relnamespace
    JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = dep.refobjsubid
    WHERE seq.relkind = 'S'
      AND seq_ns.nspname = ANY($1)
      AND table_ns.nspname = ANY($1)
    ORDER BY seq_ns.nspname, seq.relname
    `,
    [schemas],
  );

  return ownership
    .map(
      (item) =>
        `ALTER SEQUENCE ${qualified(item.sequence_schema, item.sequence_name)} OWNED BY ${qualified(item.table_schema, item.table_name)}.${qn(item.column_name)};`,
    )
    .join("\n");
}

async function getTables() {
  return rows(
    `
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           c.relkind,
           obj_description(c.oid, 'pg_class') AS comment
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY($1)
      AND c.relkind IN ('r', 'p')
    ORDER BY n.nspname, c.relname
    `,
    [schemas],
  );
}

async function dumpTables(tables) {
  const statements = [];

  for (const table of tables) {
    const columns = await rows(
      `
      SELECT a.attname AS column_name,
             pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
             a.attnotnull AS not_null,
             a.attidentity AS identity_kind,
             a.attgenerated AS generated_kind,
             pg_get_expr(d.adbin, d.adrelid) AS default_value,
             col_description(a.attrelid, a.attnum) AS comment
      FROM pg_attribute a
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = $1::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
      `,
      [qualified(table.schema_name, table.table_name)],
    );

    const columnSql = columns.map((column) => {
      const parts = [`    ${qn(column.column_name)} ${column.data_type}`];
      if (column.identity_kind) {
        parts.push(
          column.identity_kind === "a"
            ? "GENERATED ALWAYS AS IDENTITY"
            : "GENERATED BY DEFAULT AS IDENTITY",
        );
      } else if (column.generated_kind === "s") {
        parts.push(`GENERATED ALWAYS AS (${column.default_value}) STORED`);
      } else if (column.default_value) {
        parts.push(`DEFAULT ${column.default_value}`);
      }
      if (column.not_null) parts.push("NOT NULL");
      return parts.join(" ");
    });

    const partition = table.relkind === "p" ? " PARTITION BY LIST ()" : "";
    statements.push(
      `CREATE TABLE IF NOT EXISTS ${qualified(table.schema_name, table.table_name)}${partition} (\n${columnSql.join(",\n")}\n);`,
    );

    const comments = columns
      .filter((column) => column.comment)
      .map(
        (column) =>
          `COMMENT ON COLUMN ${qualified(table.schema_name, table.table_name)}.${qn(column.column_name)} IS ${sqlString(column.comment)};`,
      );
    if (table.comment) {
      comments.unshift(
        `COMMENT ON TABLE ${qualified(table.schema_name, table.table_name)} IS ${sqlString(table.comment)};`,
      );
    }
    if (comments.length) statements.push(comments.join("\n"));
  }

  return statements.join("\n\n");
}

async function dumpConstraints() {
  const constraints = await rows(
    `
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           con.conname AS constraint_name,
           con.contype AS constraint_type,
           pg_get_constraintdef(con.oid, true) AS constraint_def
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY($1)
    ORDER BY
      CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 WHEN 'f' THEN 4 ELSE 5 END,
      n.nspname,
      c.relname,
      con.conname
    `,
    [schemas],
  );

  return constraints
    .map(
      (constraint) =>
        `ALTER TABLE ONLY ${qualified(constraint.schema_name, constraint.table_name)} ADD CONSTRAINT ${qn(constraint.constraint_name)} ${constraint.constraint_def};`,
    )
    .join("\n");
}

async function dumpIndexes() {
  const indexes = await rows(
    `
    SELECT n.nspname AS schema_name,
           cls.relname AS table_name,
           idx.relname AS index_name,
           pg_get_indexdef(idx.oid) AS index_def
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_class cls ON cls.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    LEFT JOIN pg_constraint con ON con.conindid = idx.oid
    WHERE n.nspname = ANY($1)
      AND con.oid IS NULL
    ORDER BY n.nspname, cls.relname, idx.relname
    `,
    [schemas],
  );

  return indexes
    .map((index) => `${index.index_def.replace(/^CREATE INDEX /, "CREATE INDEX IF NOT EXISTS ")};`)
    .join("\n");
}

async function dumpViews() {
  const views = await rows(
    `
    SELECT n.nspname AS schema_name,
           c.relname AS view_name,
           c.relkind,
           pg_get_viewdef(c.oid, true) AS view_def
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY($1)
      AND c.relkind IN ('v', 'm')
    ORDER BY n.nspname, c.relname
    `,
    [schemas],
  );

  return views
    .map((view) => {
      const kind = view.relkind === "m" ? "MATERIALIZED VIEW" : "VIEW";
      return `CREATE ${kind} ${qualified(view.schema_name, view.view_name)} AS\n${view.view_def};`;
    })
    .join("\n\n");
}

async function dumpFunctions() {
  const functions = await rows(
    `
    SELECT pg_get_functiondef(p.oid) AS function_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = ANY($1)
    ORDER BY n.nspname, p.proname, p.oid
    `,
    [schemas],
  );

  return functions.map((fn) => `${fn.function_def};`).join("\n\n");
}

async function dumpTriggers() {
  const triggers = await rows(
    `
    SELECT pg_get_triggerdef(t.oid, true) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY($1)
      AND NOT t.tgisinternal
    ORDER BY n.nspname, c.relname, t.tgname
    `,
    [schemas],
  );

  return triggers.map((trigger) => `${trigger.trigger_def};`).join("\n");
}

async function dumpPolicies() {
  const rlsTables = await rows(
    `
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           c.relrowsecurity,
           c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ANY($1)
      AND c.relkind IN ('r', 'p')
      AND (c.relrowsecurity OR c.relforcerowsecurity)
    ORDER BY n.nspname, c.relname
    `,
    [schemas],
  );

  const policies = await rows(
    `
    SELECT schemaname AS schema_name,
           tablename AS table_name,
           policyname AS policy_name,
           permissive,
           roles,
           cmd,
           qual,
           with_check
    FROM pg_policies
    WHERE schemaname = ANY($1)
    ORDER BY schemaname, tablename, policyname
    `,
    [schemas],
  );

  const statements = [];
  for (const table of rlsTables) {
    if (table.relrowsecurity) {
      statements.push(`ALTER TABLE ${qualified(table.schema_name, table.table_name)} ENABLE ROW LEVEL SECURITY;`);
    }
    if (table.relforcerowsecurity) {
      statements.push(`ALTER TABLE ${qualified(table.schema_name, table.table_name)} FORCE ROW LEVEL SECURITY;`);
    }
  }
  for (const policy of policies) {
    const roles = policy.roles?.length ? ` TO ${policy.roles.map(qn).join(", ")}` : "";
    const using = policy.qual ? ` USING (${policy.qual})` : "";
    const check = policy.with_check ? ` WITH CHECK (${policy.with_check})` : "";
    statements.push(
      `CREATE POLICY ${qn(policy.policy_name)} ON ${qualified(policy.schema_name, policy.table_name)} AS ${policy.permissive} FOR ${policy.cmd}${roles}${using}${check};`,
    );
  }

  return statements.join("\n");
}

async function getColumnsForData(table) {
  return rows(
    `
    SELECT a.attname AS column_name
    FROM pg_attribute a
    WHERE a.attrelid = $1::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.attgenerated = ''
    ORDER BY a.attnum
    `,
    [qualified(table.schema_name, table.table_name)],
  );
}

async function sortedTables(tables) {
  const tableNames = new Set(tables.map((table) => `${table.schema_name}.${table.table_name}`));
  const dependencies = await rows(
    `
    SELECT src_n.nspname AS src_schema,
           src.relname AS src_table,
           dst_n.nspname AS dst_schema,
           dst.relname AS dst_table
    FROM pg_constraint con
    JOIN pg_class src ON src.oid = con.conrelid
    JOIN pg_namespace src_n ON src_n.oid = src.relnamespace
    JOIN pg_class dst ON dst.oid = con.confrelid
    JOIN pg_namespace dst_n ON dst_n.oid = dst.relnamespace
    WHERE con.contype = 'f'
      AND src_n.nspname = ANY($1)
      AND dst_n.nspname = ANY($1)
    `,
    [schemas],
  );

  const depsByTable = new Map(tables.map((table) => [`${table.schema_name}.${table.table_name}`, new Set()]));
  for (const dep of dependencies) {
    const source = `${dep.src_schema}.${dep.src_table}`;
    const target = `${dep.dst_schema}.${dep.dst_table}`;
    if (source !== target && tableNames.has(source) && tableNames.has(target)) {
      depsByTable.get(source)?.add(target);
    }
  }

  const sorted = [];
  const pending = new Set(tableNames);
  while (pending.size > 0) {
    const ready = [...pending].filter((name) => {
      const deps = depsByTable.get(name) || new Set();
      return [...deps].every((dep) => !pending.has(dep));
    });
    if (!ready.length) break;
    ready.sort();
    for (const name of ready) {
      sorted.push(name);
      pending.delete(name);
    }
  }

  const byName = new Map(tables.map((table) => [`${table.schema_name}.${table.table_name}`, table]));
  return [...sorted, ...[...pending].sort()].map((name) => byName.get(name));
}

async function dumpData(tables) {
  const statements = [
    "BEGIN;",
    "SET CONSTRAINTS ALL DEFERRED;",
    "",
  ];

  for (const table of await sortedTables(tables)) {
    const columns = await getColumnsForData(table);
    if (!columns.length) continue;

    const rowCount = await rows(`SELECT COUNT(*)::bigint AS count FROM ${qualified(table.schema_name, table.table_name)}`);
    if (rowCount[0].count === "0") continue;

    const columnExpression = columns
      .map((column) => {
        const quoted = qn(column.column_name);
        return `CASE WHEN ${quoted} IS NULL THEN 'NULL' ELSE quote_literal(${quoted}::text) END`;
      })
      .join(" || ', ' || ");
    const valueRows = await rows(
      `SELECT '(' || ${columnExpression} || ')' AS value_sql FROM ${qualified(table.schema_name, table.table_name)}`,
    );

    const columnList = columns.map((column) => qn(column.column_name)).join(", ");
    for (let i = 0; i < valueRows.length; i += 100) {
      const batch = valueRows.slice(i, i + 100);
      statements.push(
        `INSERT INTO ${qualified(table.schema_name, table.table_name)} (${columnList}) VALUES\n${batch
          .map((row) => row.value_sql)
          .join(",\n")}\nON CONFLICT DO NOTHING;`,
        "",
      );
    }
  }

  const sequences = await rows(
    `
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = ANY($1)
    ORDER BY sequence_schema, sequence_name
    `,
    [schemas],
  );

  for (const sequence of sequences) {
    const sequenceName = qualified(sequence.sequence_schema, sequence.sequence_name);
    const value = await rows(`SELECT last_value, is_called FROM ${sequenceName}`);
    statements.push(
      `SELECT pg_catalog.setval('${sequenceName.replaceAll("'", "''")}', ${value[0].last_value}, ${value[0].is_called});`,
    );
  }

  statements.push("", "COMMIT;", "");
  return statements.join("\n");
}

async function main() {
  await client.connect();

  const serverInfo = await rows("SELECT version() AS version, current_database() AS database_name");
  const tables = await getTables();

  const preDataDdlSections = [
    header(`DocuNova PostgreSQL DDL dump for ${serverInfo[0].database_name}`),
    "-- Server",
    `-- ${serverInfo[0].version}`,
    "",
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    await dumpExtensions(),
    await dumpSchemas(),
    await dumpTypes(),
    await dumpSequences(),
    await dumpFunctions(),
    await dumpTables(tables),
    await dumpSequenceOwnership(),
    "",
  ].filter(Boolean);

  const postDataDdlSections = [
    await dumpViews(),
    await dumpConstraints(),
    await dumpIndexes(),
    await dumpTriggers(),
    await dumpPolicies(),
    "",
  ].filter(Boolean);

  const dataSql = [
    header(`DocuNova PostgreSQL data dump for ${serverInfo[0].database_name}`),
    await dumpData(tables),
  ].join("\n");
  const preDataDdlSql = preDataDdlSections.join("\n\n");
  const postDataDdlSql = postDataDdlSections.join("\n\n");
  const ddlSql = `${preDataDdlSql}\n\n${postDataDdlSql}`;

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "ddl.sql"), ddlSql);
  await fs.writeFile(path.join(outDir, "data.sql"), dataSql);
  await fs.writeFile(path.join(outDir, "full.sql"), `${preDataDdlSql}\n\n${dataSql}\n\n${postDataDdlSql}`);

  console.log(`Dumped ${tables.length} tables from schemas ${schemas.join(", ")} to ${outDir}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
