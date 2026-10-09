# MedLedger — Pharmaceutical Supply Chain Intelligence

### Traceability, Quality & Compliance

[![Oracle Database](https://img.shields.io/badge/Database-Oracle%2021c%20%2F%20XE-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

> **MedLedger** is a pharmaceutical supply-chain traceability platform that connects drug, batch, package, quality-testing, shipment, recall, and dispensing records to support product tracking and database-backed verification. Built upon an enterprise Boyce–Codd Normal Form (BCNF) relational schema, 15 advanced Oracle SQL analytical queries, and real-time anti-counterfeit verification.

---

## 1. Problem Statement

Counterfeit and substandard pharmaceuticals pose a catastrophic global health crisis, responsible for over 1 million preventable deaths annually and eroding public confidence in healthcare systems. Conventional pharmaceutical supply chains suffer from:
- **Blind Spots in Custody Transfer**: Inability to verify intermediate wholesale distributors and freight carriers.
- **Delayed Recall Propagation**: Quarantined lots continue circulating at retail pharmacies for weeks following defect notices.
- **Counterfeit Infiltration**: Duplication of serial numbers and packaging without tamper-evident verification.

**MedLedger** addresses these challenges by establishing a unified, cryptographically structured relational ledger tracking pharmaceutical custody from chemical formulation and laboratory testing to pharmacy dispensing and patient handover.

---

## 2. Project Architecture & BCNF Relational Schema (13 Relations)

The relational schema implements attribute-defined, disjoint, and total specialization on the `PARTY` entity across 13 BCNF tables:

```
                          ┌────────────────────────┐
                          │         PARTY          │
                          │   (Superclass Table)   │
                          └───────────┬────────────┘
                                      │  (ISA Hierarchy)
        ┌──────────────┬──────────────┴──────────────┬──────────────┐
        ▼              ▼                             ▼              ▼
┌──────────────┐┌──────────────┐              ┌──────────────┐┌──────────────┐
│ MANUFACTURER ││ DISTRIBUTOR  │              │   PHARMACY   ││  REGULATOR   │
│  (Subclass)  ││  (Subclass)  │              │  (Subclass)  ││  (Subclass)  │
└───────┬──────┘└──────────────┘              └──────┬───────┘└──────────────┘
        │ creates                                    │ performs
        ▼                                            ▼
 ┌──────────────┐   affects   ┌──────────────┐┌──────────────┐
 │    BATCH     │◄────────────┤    RECALL    ││  DISPENSING  │
 └───┬───────▲──┘             └──────────────┘└──────┬───────┘
     │       │                                       │
     │       └──────────────┐                        │
     ▼ tested_by            ▼ packaged_as            │ dispensed_in
┌──────────────┐      ┌──────────────┐               │
│ QUALITY_TEST │      │   PACKAGE    │◄──────────────┘
└──────────────┘      └──────┬───────┘
                             │
                             │ contains (M:N)
                             ▼
                      ┌──────────────┐
                      │   CONTAINS   │ (Bridge Table)
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐  sends / receives
                      │   SHIPMENT   │◄────────────────── PARTY
                      └──────────────┘
```

### Table Specifications

| # | Relation | Primary Key | Foreign Keys | Key Attributes & Constraints |
|---|---|---|---|---|
| 1 | **PARTY** | `party_id` | — | `party_name`, `address`, `phone`, `email` |
| 2 | **MANUFACTURER** | `party_id` | `party_id → PARTY.party_id` | `manufacturing_license_no` (UNIQUE) |
| 3 | **DISTRIBUTOR** | `party_id` | `party_id → PARTY.party_id` | `distributor_license_no` (UNIQUE) |
| 4 | **PHARMACY** | `party_id` | `party_id → PARTY.party_id` | `pharmacy_license_no` (UNIQUE), `hq` |
| 5 | **REGULATOR** | `party_id` | `party_id → PARTY.party_id` | `regulator_code` (UNIQUE) |
| 6 | **DRUG** | `drug_id` | — | `drug_name`, `description`, `strength`, `dosage_form` |
| 7 | **BATCH** | `batch_id` | `drug_id → DRUG`, `manufacturer_id → MANUFACTURER`, `recall_id → RECALL` (nullable) | `batch_status`, `manufacture_date` |
| 8 | **QUALITY_TEST** | `test_id` | `batch_id → BATCH.batch_id` | `test_date`, `test_type`, `result`, `status` (`PASSED`/`FAILED`/`PENDING`) |
| 9 | **RECALL** | `recall_id` | — | `recall_date`, `status` (`ACTIVE`/`COMPLETED`), `reason` |
| 10 | **PACKAGE** | `package_id` | `batch_id → BATCH`, `dispense_id → DISPENSING` (nullable) | `package_size`, `packaged_at`, `qr_code` (UNIQUE), `status`, `quantity_total > 0` |
| 11 | **SHIPMENT** | `shipment_id` | `sender_party_id → PARTY`, `receiver_party_id → PARTY` | `shipment_date`, `status`, `mode`, `CHECK(sender != receiver)` |
| 12 | **CONTAINS** | `(package_id, shipment_id)` | `package_id → PACKAGE`, `shipment_id → SHIPMENT` | Composite PK representing M:N custody assignment |
| 13 | **DISPENSING** | `dispense_id` | `pharmacy_id → PHARMACY.party_id` | `dispensed_at`, `patient_id`, `quantity > 0`, `remarks` |

---

## 3. Phase 3: SQL Analytics Module & 15 Oracle Queries

The Analytics module provides deep supply chain visibility through 15 advanced Oracle SQL queries executed through the backend. The queries are categorized into 6 operational domains:

### Category Taxonomy & Query Index

```
Supply Chain Analytics
 ├── 1. Drug & Batch Intelligence
 │    ├── Query 1:  Drug Catalogue
 │    ├── Query 2:  Batch Traceability
 │    └── Query 11: Most Frequently Batched Drugs
 ├── 2. Package Tracking
 │    ├── Query 3:  Package Inventory
 │    └── Query 12: Undispensed Packages
 ├── 3. Shipment Analytics
 │    ├── Query 4:  Shipment Tracking
 │    ├── Query 5:  In-Transit Shipments
 │    └── Query 13: Shipment History for a Package
 ├── 4. Quality & Compliance
 │    ├── Query 6:  Failed Quality Tests
 │    └── Query 14: Pending or Failed Quality Tests
 ├── 5. Recall Management
 │    ├── Query 7:  Active Recalls
 │    └── Query 8:  Recall Impact Analysis
 └── 6. Manufacturer & Pharmacy Performance
      ├── Query 9:  Manufacturer Performance
      ├── Query 10: Pharmacy Dispensing Summary
      └── Query 15: Package Verification Audit
```

### Detailed Query Catalog & DBMS Concepts

| ID | Query Title | Category | Oracle SQL Concepts & Techniques | Objective |
|---|---|---|---|---|
| **Q1** | **Drug Catalogue** | Drug & Batch Intelligence | Projection, Ordering, NULL handling | List all registered drug formulations with names, descriptions, strengths, and dosage forms. |
| **Q2** | **Batch Traceability** | Drug & Batch Intelligence | 3-Table `INNER JOIN`, Date formatting | Trace manufacturing pedigree: drug name, licensed manufacturer name, production date, and release status. |
| **Q3** | **Package Inventory** | Package Tracking | Multi-table Joins, Status projection | Complete serialized inventory audit: package ID, QR code, parent batch, drug name, package size, and lifecycle state. |
| **Q4** | **Shipment Tracking** | Shipment Analytics | Dual `JOIN` on same superclass (`PARTY`) with distinct aliases (`sender`, `receiver`) | Resolve custody transfer parties (`sender_party_id` and `receiver_party_id`), dates, transit modes, and delivery status. |
| **Q5** | **In-Transit Shipments** | Shipment Analytics | Predicate filtering, `IN` clause | Real-time monitoring of shipments actively moving through the supply chain (`IN_TRANSIT`, `DISPATCHED`). |
| **Q6** | **Failed Quality Tests** | Quality & Compliance | 3-Table `INNER JOIN`, Predicate filtering | Identify failed laboratory assays with test dates, assay types, laboratory results, batch IDs, and drug names. |
| **Q7** | **Active Recalls** | Recall Management | 3-Table Join, Temporal filtering | Regulatory alert query listing active recall notices with reason, recall date, affected batches, and drug formulations. |
| **Q8** | **Recall Impact Analysis** | Recall Management | 4-Table Join (`RECALL → BATCH → PACKAGE → DRUG`) | Determine the operational quarantine blast radius: identify all serialized packages belonging to batches under active recall. |
| **Q9** | **Manufacturer Performance** | Manufacturer & Pharmacy | `LEFT OUTER JOIN`, `GROUP BY`, Aggregate `COUNT` | Performance accounting: count total batches produced by each manufacturer, including manufacturers with 0 batches. |
| **Q10** | **Pharmacy Dispensing Summary** | Manufacturer & Pharmacy | `LEFT OUTER JOIN`, `GROUP BY`, Aggregates (`SUM`, `COUNT`), `NVL` | Dispensing volume analytics: calculate total unit quantity and dispensing event count across registered retail pharmacies. |
| **Q11** | **Most Frequently Batched Drugs** | Drug & Batch Intelligence | `LEFT JOIN`, `GROUP BY`, Window function (`DENSE_RANK() OVER (...)`), `ORDER BY` | Volume ranking: rank pharmaceutical formulations by manufacturing lot frequency to identify top production items. |
| **Q12** | **Undispensed Packages** | Package Tracking | Negative existence test (`WHERE p.dispense_id IS NULL AND NOT EXISTS (...)`) | Accurately identify un-dispensed serialized packages remaining in warehouses, wholesale transit, or pharmacy shelves. |
| **Q13** | **Shipment History for a Package** | Shipment Analytics | Parameterized Bind (`:p_pkg_id`, `:p_qr`), 4-Table Join (`CONTAINS → SHIPMENT → PARTY x 2`) | Given a package ID or QR code, display the full chronological custody trail, senders, receivers, dates, and modes. |
| **Q14** | **Pending or Failed Quality Tests** | Quality & Compliance | 3-Table Join, `IN ('FAILED', 'PENDING')`, `ORDER BY CASE` | Laboratory compliance backlog: list batches with unresolved or failed quality assays prioritized by severity. |
| **Q15** | **Package Verification Audit** | Manufacturer & Pharmacy | Safe Parameterized Binds, Scalar Subqueries, 360° Data Aggregation | Full anti-counterfeit record audit for an identifier: drug, batch, manufacturer, lab tests summary, recall status, and dispensing record. |

---

## 4. Anti-Counterfeit Package Verification Workflow

The Package Verification feature provides a database-backed verification panel accessible at `/verify` or via Query 15.

### Priority Verdict Hierarchy

When a user submits a **Package ID** or **QR Code**, the engine performs multi-table relational analysis and applies strict priority ordering:

```
                      [ User Inputs QR Code / ID ]
                                   │
                                   ▼
                       Does package record exist?
                                ├── No ──► [ NOT FOUND ]
                                │
                               Yes
                                │
                                ▼
                   Is associated batch under ACTIVE recall?
                                ├── Yes ─► [ RECALL ALERT ]  (Priority 1)
                                │
                                No
                                │
                                ▼
               Did batch fail lab quality tests or marked TAMPERED?
                                ├── Yes ─► [ QUALITY WARNING ]  (Priority 2)
                                │
                                No
                                │
                                ▼
                   [ VERIFIED / VERIFIED (DISPENSED) ]  (Priority 3)
```

1. **`RECALL ALERT` (Highest Priority)**: Triggered if the associated batch has an `ACTIVE` recall or status `RECALLED`. Prevents dispensing even if lab tests passed.
2. **`QUALITY WARNING`**: Triggered if any laboratory quality tests `FAILED` or the package status is `TAMPERED`.
3. **`VERIFIED`**: Product record is valid and registered with passed tests and no active recall notices. (Sub-state `VERIFIED (DISPENSED)` indicates the item was already safely dispensed).
4. **`NOT FOUND`**: Identifier does not exist in the database (unregistered or invalid QR code).

> [!IMPORTANT]
> **Database Verification Disclaimer**: A database record match confirms that an authentic serialized unit was registered in the MedLedger system. In accordance with pharmaceutical integrity guidelines, database verification does not cryptographically or physically guarantee that a physical package was not duplicated in the physical world without physical security seals.

---

## 5. Dual-Mode Database Architecture

MedLedger features a resilient **Dual-Mode Engine** engineered to guarantee 100% functionality in both development and production Oracle installations:

```
┌────────────────────────────────────────────────────────┐
│                   MedLedger Backend                    │
│            (Node.js / Express Architecture)            │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │      ORACLE MODE      │ │   SIMULATION MODE     │
   │   (Live Oracle 21c)   │ │  (In-Memory Fallback) │
   │                       │ │                       │
   │ • Thin Mode (port 1521│ │ • Complete 13 tables  │
   │ • Native SQL execution│ │ • Relational join algs│
   │ • Live PL/SQL routines│ │ • Instant evaluation  │
   └───────────────────────┘ └───────────────────────┘
```

1. **Live Oracle Mode**:
   - Uses the official `oracledb` thin client connecting to Oracle XE or Oracle 21c.
   - Executes the authoritative SQL scripts from `database/04_queries.sql`.
   - Uses bind variables (`:ident`, `:param`) to prevent SQL injection.
2. **Simulation Fallback Mode**:
   - When the Oracle listener on port 1521 is unreachable (`ECONNREFUSED`), the backend automatically activates the in-memory simulation engine.
   - Seeded with the exact synthetic dataset from `database/04_insert_data.sql` (16 Parties, 12 Drugs, 18 Batches, 33 Packages, 16 Shipments, 4 Recalls, 12 Dispensings).
   - Implements full relational query logic matching Oracle results row-for-row.
   - **Transparency**: Clearly displayed in `/api/health`, on the Analytics page, and in the SQL Demo panel.

---

## 6. SQL Scripts & Database Execution Order

Authoritative SQL scripts located in `database/`:

```
database/
├── 00_run_all.sql         # Master batch execution runner (SQL*Plus)
├── 01_drop_tables.sql     # Safe dependency-cascade drop sequence
├── 02_create_tables.sql   # DDL for all 13 tables & sequences
├── 03_constraints.sql     # Foreign keys, uniqueness, & check constraints
├── 04_insert_data.sql     # Realistic synthetic pharmaceutical dataset
├── 04_queries.sql         # The 15 Oracle SQL Queries (Primary authoritative file)
├── 05_queries.sql         # Reference query catalogue
├── 06_plsql.sql           # Stored procedures, functions, triggers, & packages
├── 07_demo.sql            # Interactive test demonstration script
└── setup_db.js            # Node-based automated runner
```

### Running in Oracle SQL Developer / SQL\*Plus:

```sql
-- Connect to Oracle instance
CONN medledger/medledger_pass@localhost:1521/XEPDB1;

-- Run entire script sequence:
@database/00_run_all.sql;

-- Or run queries individually:
@database/04_queries.sql;
```

---

## 7. Backend API Reference

### Analytics Endpoints (`/api/analytics`)

| Method | Endpoint | Query ID | Description |
|---|---|---|---|
| `GET` | `/api/analytics` | Metadata | Returns catalogue metadata of all 15 queries with SQL text |
| `GET` | `/api/analytics/drug-catalogue` | Q1 | Formulations, dosage forms, strengths |
| `GET` | `/api/analytics/batch-traceability` | Q2 | Batches with drug, manufacturer, and status |
| `GET` | `/api/analytics/package-inventory` | Q3 | Serialized packages and lifecycle states |
| `GET` | `/api/analytics/shipment-tracking` | Q4 | Custody transfers with resolved sender/receiver |
| `GET` | `/api/analytics/in-transit-shipments` | Q5 | Shipments currently in transit |
| `GET` | `/api/analytics/failed-quality-tests` | Q6 | Laboratory assays that failed quality standards |
| `GET` | `/api/analytics/active-recalls` | Q7 | Active product recalls with affected formulations |
| `GET` | `/api/analytics/recall-impact` | Q8 | Serialized packages quarantined under active recalls |
| `GET` | `/api/analytics/manufacturer-performance` | Q9 | Batch manufacturing volume by licensed producer |
| `GET` | `/api/analytics/pharmacy-dispensing` | Q10 | Dispensed quantities aggregated by pharmacy |
| `GET` | `/api/analytics/top-drugs` | Q11 | Ranking drugs by manufacturing batch frequency |
| `GET` | `/api/analytics/undispensed-packages` | Q12 | Packages remaining un-dispensed in supply chain |
| `GET` | `/api/analytics/package-shipment-history/:packageId` | Q13 | Chronological transit history for a specific package/QR |
| `GET` | `/api/analytics/pending-quality-tests` | Q14 | Lab assays requiring review or marked failed |
| `GET` | `/api/analytics/verify-package?identifier=...` | Q15 | Comprehensive 360-degree verification audit |
| `GET` | `/api/analytics/:queryId` | Q1–Q15 | Dynamic runner endpoint with query parameters |

### Core CRUD & Verification Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and active database engine mode |
| `GET` | `/api/dashboard` | Aggregated supply chain KPIs and recent activities |
| `GET` | `/api/packages/verify/:identifier` | Core anti-counterfeit verification route with verdict |
| `GET`/`POST` | `/api/drugs` | Drug catalogue CRUD |
| `GET`/`POST` | `/api/batches` | Batch registry CRUD (calls `register_batch`) |
| `GET`/`POST` | `/api/packages` | Serialized package inventory CRUD |
| `GET`/`POST` | `/api/shipments` | Custody shipment dispatch and tracking |
| `GET`/`POST` | `/api/recalls` | Regulatory recall notice management |
| `GET`/`POST` | `/api/dispensings` | Patient counter dispensing records |

---

## 8. Installation & Startup Instructions

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- Optional: Oracle Database 21c XE running on port 1521

### Step 1: Environment Configuration
Create or inspect `backend/.env`:
```ini
PORT=5000
NODE_ENV=development

# Oracle Database Configuration
DB_USER=medledger
DB_PASSWORD=medledger_pass
DB_CONNECT_STRING=localhost:1521/XEPDB1
```

### Step 2: Start Backend Server (Terminal 1)
```bash
cd backend
npm install
node server.js
```
*The server starts on `http://localhost:5000`.*  
*Health Check API: `http://localhost:5000/api/health`*  
*If Oracle is offline, the backend outputs a diagnostic notice and activates the in-memory fallback.*

### Step 3: Start Frontend Application (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*The web client starts on `http://localhost:5173`.*

> **Alternative (Single-command from project root)**:  
> You can also launch either service directly from the root repository folder:  
> `npm run dev` — Launches the frontend (`npm --prefix frontend run dev`)  
> `npm run backend` — Launches the backend (`npm --prefix backend start`)

### Step 4: Run Automated Analytics & Verification Test Suite
```bash
cd backend
node test_analytics.js
```
*Executes all 28 automated assertions covering Q1–Q15, verification scenarios, and CRUD integrity.*

---

## 9. System Demonstration & Verification Walkthrough

Follow these steps to demonstrate and verify the pharmaceutical supply chain platform:

### Step 1: Supply Chain Analytics (`/analytics`)
1. Navigate to **Supply Chain Analytics** via the sidebar.
2. Observe the 6 category tabs:
   - **Drug & Batch Intelligence** (Queries 1, 2, 11)
   - **Package Tracking** (Queries 3, 12)
   - **Shipment Analytics** (Queries 4, 5, 13)
   - **Quality & Compliance** (Queries 6, 14)
   - **Recall Management** (Queries 7, 8)
   - **Manufacturer & Pharmacy Performance** (Queries 9, 10, 15)
3. Click **Query 1: Drug Catalogue** -> Table displays all 12 drugs with dosage form and strength.
4. Click **Query 8: Recall Impact Analysis** -> Shows all 6 packages quarantined under active recalls.
5. Click **Query 13: Shipment History for a Package**:
   - Use the Quick Sample button `QR-MED-208-01-G1`.
   - Click **Run Query** -> Table displays custody hops from Pfizer to McKesson and Apollo.
6. Open the **Oracle SQL Architecture & Query Inspector Panel** at the bottom:
   - Inspect the Oracle SQL syntax for the active query.
   - Click **Copy Oracle SQL** to copy code for SQL Developer testing.
   - Expand the full 15-query catalog to review all SQL statements.

### Step 2: Package Verification (`/verify`)
1. Navigate to **Verify Package** via the sidebar.
2. Observe the prominent **Database Verification Disclaimer**.
3. **Scenario A — Legitimate Package**:
   - Enter `QR-MED-208-01-G1` and click **VERIFY PACKAGE**.
   - Result: Green badge `VERIFIED (DISPENSED)` with full lineage (Paxlovid, Pfizer, McKesson shipment).
4. **Scenario B — Quarantined Lot (Recall Alert)**:
   - Enter `QR-MED-201-01-A1` and click **VERIFY PACKAGE**.
   - Result: Red banner `RECALL ALERT: Associated batch is under an active regulatory recall (Microscopic glass particulate delamination)`.
5. **Scenario C — Quality Failure (Quality Warning)**:
   - Enter `QR-MED-209-01-N1` and click **VERIFY PACKAGE**.
   - Result: Amber banner `QUALITY WARNING: Associated batch failed 1 laboratory quality assurance test(s) (Thermal Stability Audit)`.
6. **Scenario D — Counterfeit / Unregistered**:
   - Enter `QR-COUNTERFEIT-FAKE-999` and click **VERIFY PACKAGE**.
   - Result: `NOT FOUND: No matching serialized package record found`.

### Step 3: CRUD Regression Verification
1. Navigate to **Drugs Catalog** (`/drugs`) -> Click **Add Drug**, enter new formulation, and verify it updates table.
2. Navigate to **Batches** (`/batches`) -> View existing batches and register a new batch.
3. Confirm dashboard KPIs at `/` accurately reflect all entities.

---

## 10. Status & Limitations

### Implemented & Tested in Phase 3
- [x] 15 Oracle SQL Queries adhering to exact MedLedger BCNF schema.
- [x] Backend Express routes for all 15 queries with parameterized bind safety.
- [x] Full Anti-Counterfeit Verification engine with 4-tier priority verdicts.
- [x] Responsive React Analytics interface with 6 category tabs, search filters, and badges.
- [x] Oracle SQL Architecture & Query Inspector Panel with live code inspection and SQL copy.
- [x] Dual-Mode architecture with automatic fallback and transparent mode reporting.
- [x] Automated test suite with 28 passing assertions (`test_analytics.js`).
- [x] Production Vite build with zero compile errors.

### Current Environmental Limitations
- **Local Oracle DB Status**: When Oracle Database 21c/XE listener is not running locally on port 1521, the backend operates in **Simulation Storage Mode**. The simulation engine maintains the exact 13-table schema in memory, executing identical relational joins and aggregations.
- **Physical vs Database Verification**: As documented in the verification interface, database record verification confirms provenance records in MedLedger, but cannot cryptographically prevent physical container cloning without physical anti-tamper seals.

### Planned for Future Phases (Out of Scope for Phase 3)
- Hyperledger Fabric smart contract chaincode (Layer 2).
- Neo4j graph database provenance visualization (Layer 3).
- IoT cold-chain temperature telemetry streaming via MQTT.

---

## 11. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
