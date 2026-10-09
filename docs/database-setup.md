# MedLedger DBMS — Database Architecture & Setup Guide

This guide details the database architecture, schema specification, foreign key dependencies, and the exact execution order for the Oracle SQL and PL/SQL scripts in **MedLedger**.

---

## 1. Relational Architecture (13 Relations)

MedLedger models a tamper-resistant pharmaceutical supply chain across 13 relations normalized to Boyce-Codd Normal Form (BCNF):

```
                                +------------------+
                                |      PARTY       | (Superclass)
                                +--------+---------+
                                         |
            +----------------+-----------+-----------+----------------+
            |                |                       |                |
   +--------v-------+ +------v--------+     +--------v-------+ +------v-------+
   |  MANUFACTURER  | |  DISTRIBUTOR  |     |    PHARMACY    | |   REGULATOR   |
   +--------+-------+ +---------------+     +--------+-------+ +--------------+
            |                                        |
            | 1:N                                    | 1:N
            v                                        v
   +----------------+                       +----------------+
   |     BATCH      |<--+ 1:N               |   DISPENSING   |
   +--------+-------+   |                   +--------+-------+
     |      | 1:N       |                            |
 1:N |      v           | (recall_id)                | 1:1 (nullable)
     |   +----------+   |                            |
     |   | Q_TEST   |   |                            v
     |   +----------+   +-------------------+  +-------------+
     |                                      |  |   PACKAGE   |
     +---------------------------------------->+------+------+
                                                      |
                                                      | M:N via CONTAINS
                                                      v
                                               +-------------+
                                               |  SHIPMENT   |
                                               +-------------+
```

### Table Definitions & Roles

| # | Relation | Primary Key | Foreign Keys / References | Description |
|---|----------|-------------|---------------------------|-------------|
| 1 | `PARTY` | `party_id` | *None* | Root superclass for all licensed organizations |
| 2 | `MANUFACTURER` | `party_id` | `party_id -> PARTY(party_id)` | Licensed drug manufacturers |
| 3 | `DISTRIBUTOR` | `party_id` | `party_id -> PARTY(party_id)` | Wholesale logistics distributors |
| 4 | `PHARMACY` | `party_id` | `party_id -> PARTY(party_id)` | Licensed dispensing pharmacies |
| 5 | `REGULATOR` | `party_id` | `party_id -> PARTY(party_id)` | Health authorities (FDA, EMA, CDSCO) |
| 6 | `DRUG` | `drug_id` | *None* | Approved pharmaceutical formulations |
| 7 | `RECALL` | `recall_id` | *None* | Regulatory and manufacturer recall notices |
| 8 | `BATCH` | `batch_id` | `drug_id -> DRUG`<br>`manufacturer_id -> MANUFACTURER`<br>`recall_id -> RECALL (nullable)` | Manufactured production lots |
| 9 | `QUALITY_TEST` | `test_id` | `batch_id -> BATCH` | Lab assays (purity, dissolution, sterility) |
| 10 | `DISPENSING` | `dispense_id` | `pharmacy_id -> PHARMACY` | Counter dispensing events to patients |
| 11 | `PACKAGE` | `package_id` | `batch_id -> BATCH`<br>`dispense_id -> DISPENSING (nullable)` | Serialized retail units with QR codes |
| 12 | `SHIPMENT` | `shipment_id` | `sender_party_id -> PARTY`<br>`receiver_party_id -> PARTY` | Custody transfers between parties |
| 13 | `CONTAINS` | `(package_id, shipment_id)` | `package_id -> PACKAGE`<br>`shipment_id -> SHIPMENT` | M:N bridge mapping packages to shipments |

---

## 2. Handling Circular Foreign-Key Dependencies

MedLedger contains two apparent circularities in its lifecycle model that are resolved through strict nullability and phased constraint application:

1. **`PACKAGE` and `DISPENSING`**:
   - A `DISPENSING` record represents a pharmacy counter transaction.
   - A `PACKAGE` references `dispense_id` once the unit is handed to a patient.
   - **Resolution**: `PACKAGE.dispense_id` is defined as **nullable**. Packages are created upon manufacturing with `dispense_id IS NULL`. When dispensing occurs, the `DISPENSING` event is inserted first, and `PACKAGE.dispense_id` is updated with foreign-key referential integrity intact.

2. **`BATCH` and `RECALL`**:
   - A `RECALL` targets one or more batches.
   - `BATCH` contains `recall_id` to enable fast index scans for quarantine checks.
   - **Resolution**: `BATCH.recall_id` is **nullable**. Batches operate normally with `recall_id IS NULL`. When a recall notice is published, `RECALL` is inserted first, followed by updating `BATCH.recall_id` and executing `process_recall` to quarantine child packages.

---

## 3. Exact SQL Script Execution Order

When initializing the database in Oracle SQL*Plus, Oracle SQL Developer, or Oracle Cloud Infrastructure, the scripts must be run in the following exact sequence:

```
[Step 1] database/01_drop_tables.sql
         ↓ Drops dependent bridges, tables & sequences in reverse dependency order
[Step 2] database/02_create_tables.sql
         ↓ Creates the 13 base relations and sequences
[Step 3] database/03_constraints.sql
         ↓ Applies Foreign Keys, CHECK constraints, and domain validations
[Step 4] database/04_insert_data.sql
         ↓ Inserts realistic synthetic data in strict referential order
[Step 5] database/04_queries.sql (or 05_queries.sql)
         ↓ Verifies all 15 analytical SQL queries
[Step 6] database/06_plsql.sql
         ↓ Compiles Stored Procedures, Functions, and Triggers
[Step 7] database/07_demo.sql
         ↓ Executes live PL/SQL demonstration and verification suite
```

### Master Execution Script

A master automation script is provided:

```sql
-- In SQL*Plus or Oracle SQL Developer:
@database/00_run_all.sql;
```

---

## 4. Execution Methods

### Option A: Oracle SQL*Plus (Terminal)

```powershell
# Open terminal and connect to your Oracle instance
sqlplus medledger/medledger_pass@localhost:1521/XEPDB1

# Execute master initialization script
SQL> @database/00_run_all.sql
```

### Option B: Oracle SQL Developer (GUI)

1. Connect to your Oracle database connection (`medledger`).
2. Open `database/00_run_all.sql`.
3. Click **Run Script (F5)**.
4. Verify output in the **Script Output** console.

### Option C: Automated Node.js Setup Script

```powershell
# From the repository root:
node database/setup_db.js
```

---

## 5. Configuration & Environment Variables

The backend and database setup scripts read credentials from `backend/.env`:

```env
# Oracle Database Credentials
DB_USER=medledger
DB_PASSWORD=medledger_pass
DB_CONNECT_STRING=localhost:1521/XEPDB1

# Server Port
PORT=5000

# Explicit Mock Override (true/false)
USE_MOCK_DB=false
```

> **Note on Connectivity**:
> - If Oracle is reachable on port 1521, MedLedger automatically connects and operates in persistent `ORACLE_21C_LIVE` mode.
> - If Oracle is offline (`ECONNREFUSED`), MedLedger safely activates its in-memory `SIMULATION_STORAGE` fallback without crashing, truthfully reporting its database mode via `/api/health`.
