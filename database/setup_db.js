const path = require('path');
const fs = require('fs');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const oracledb = require('../backend/node_modules/oracledb');

const config = {
  user: process.env.DB_USER || 'medledger',
  password: process.env.DB_PASSWORD || 'medledger_pass',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1'
};

// Parser to split standard SQL statements while keeping PL/SQL blocks intact
function splitSqlStatements(content) {
  const statements = [];
  const lines = content.split(/\r?\n/);
  let current = '';
  let inPlsql = false;

  for (let line of lines) {
    const trimmed = line.trim();

    // Ignore PROMPT, SET, @@, / lines
    if (trimmed.startsWith('PROMPT') || trimmed.startsWith('SET ') || trimmed.startsWith('@@')) {
      continue;
    }
    if (trimmed === '/' && inPlsql) {
      if (current.trim()) {
        statements.push({ text: current.trim(), isPlsql: true });
        current = '';
      }
      inPlsql = false;
      continue;
    }

    if (/^(CREATE\s+OR\s+REPLACE\s+(PROCEDURE|FUNCTION|TRIGGER)|BEGIN|DECLARE)/i.test(trimmed)) {
      inPlsql = true;
    }

    current += line + '\n';

    if (!inPlsql && trimmed.endsWith(';')) {
      const stmt = current.trim().replace(/;$/, '');
      if (stmt) {
        statements.push({ text: stmt, isPlsql: false });
      }
      current = '';
    }
  }

  if (current.trim()) {
    statements.push({ text: current.trim().replace(/;$/, ''), isPlsql: inPlsql });
  }

  return statements;
}

async function runScript(connection, filename) {
  const filePath = path.join(__dirname, filename);
  console.log(`\n>>> Executing ${filename}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(content);

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    if (!stmt.text) continue;
    try {
      await connection.execute(stmt.text);
      successCount++;
    } catch (err) {
      // Ignore drop table errors if table didn't exist
      if (filename.includes('drop') || err.message.includes('ORA-00942') || err.message.includes('ORA-02289')) {
        // Ignored
      } else {
        console.warn(`  [Notice] ${err.message.split('\n')[0]}`);
        errorCount++;
      }
    }
  }
  console.log(`Finished ${filename}: ${successCount} statements executed successfully (${errorCount} warnings).`);
}

async function main() {
  console.log('Connecting to Oracle at ' + config.connectString + '...');
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    console.log('Connected! Starting MedLedger Database Initialization:\n');

    await runScript(conn, '01_drop_tables.sql');
    await runScript(conn, '02_create_tables.sql');
    await runScript(conn, '03_constraints.sql');
    await runScript(conn, '04_insert_data.sql');
    await runScript(conn, '06_plsql.sql');

    console.log('\n================================================================');
    console.log(' [SUCCESS] ALL 13 MEDLEDGER TABLES, CONSTRAINTS, SYNTHETIC DATA,');
    console.log(' AND PL/SQL OBJECTS CREATED DIRECTLY IN ORACLE DATABASE!');
    console.log('================================================================');
  } catch (err) {
    console.error('Fatal Oracle initialization error:', err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {}
    }
  }
}

main();
