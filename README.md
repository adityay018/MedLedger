# MedLedger — A Blockchain-Based Anti-Counterfeit Pharmaceutical Supply Chain

[![Oracle Database](https://img.shields.io/badge/Database-Oracle%2021c%20%2F%20XE-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

> **Academic Coursework Project**: Database Management Systems (DA2)  
> **Source of Truth**: EER Model, Generalization/Specialization Hierarchy, and Boyce–Codd Normal Form (BCNF) Relational Mapping from DA1.

---

## 1. Problem Statement

Counterfeit and substandard pharmaceuticals pose a catastrophic global health crisis, responsible for over 1 million preventable deaths annually and eroding public confidence in healthcare systems. Conventional pharmaceutical supply chains rely on fragmented legacy databases and paper manifests, resulting in:
- **Blind Spots in Custody Transfer**: Inability to verify intermediate wholesale distributors and freight carriers.
- **Delayed Recall Propagation**: Quarantined lots continue circulating at retail pharmacies for weeks following defect notices.
- **Counterfeit Infiltration**: Counterfeiters duplicate packaging and packaging labels without tamper-evident serial verification.

**MedLedger** addresses these challenges by establishing a unified, cryptographically verified relational ledger tracking pharmaceutical custody from chemical formulation and batch testing to pharmacy dispensing.

---

## 2. Project Objectives (DA2 Scope)

1. **Relational Schema Integrity**: Implement the exact 13 BCNF relations derived in DA1 without schema degradation or ad-hoc column alterations.
2. **Oracle 21c Compatibility**: Strictly adhere to Oracle SQL and PL/SQL syntactical standards (sequences, check constraints, foreign keys, triggers, stored procedures).
3. **Database Programming with PL/SQL**:
   - `PROCEDURE register_batch`: Validates licensed manufacturer status prior to batch generation.
   - `PROCEDURE process_recall`: Cascades active recall notices across all child packages and batches.
   - `FUNCTION verify_package`: Multi-stage anti-counterfeit verification evaluating status, test compliance, and recall flags.
   - `FUNCTION recall_impact`: Computes the aggregate blast radius (quarantined packages and unit count).
   - `TRIGGER trg_check_package_qty`: Enforces positive package volume constraints.
   - `TRIGGER trg_batch_recall_cascade`: Automatically marks child packages as `RECALLED` upon batch status transition.
4. **12 Analytical SQL Queries (Q1–Q12)**: Demonstrating advanced multi-table joins, self-joins on ISA superclasses, aggregations, `GROUP BY`, `HAVING`, and `EXISTS` subqueries.
5. **Full-Stack Application**: Node.js + Express backend connecting via the official `oracledb` Thin Driver to a modern React 19 + Tailwind CSS pharmaceutical dashboard with full INSERT, UPDATE, and DELETE capabilities.
6. **Dual-Mode Engine**: Operates seamlessly with live Oracle 21c/XE databases, with an automatic, resilient in-memory simulation fallback for instant evaluation.

---

## 3. Database Architecture & BCNF Schema (13 Relations)

The relational schema implements attribute-defined, disjoint, and total specialization on the `PARTY` entity:

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

## 4. SQL Scripts Catalogue (`database/`)

The SQL scripts are designed to execute directly in **Oracle SQL Developer** or **SQL\*Plus**:

```
database/
├── 00_run_all.sql         # Master batch execution runner
├── 01_drop_tables.sql     # Safe dependency-cascade drop sequence
├── 02_create_tables.sql   # DDL for all 13 tables & sequences
├── 03_constraints.sql     # Foreign keys, uniqueness, & check constraints
├── 04_insert_data.sql     # Realistic synthetic pharmaceutical dataset
├── 05_queries.sql         # 12 Advanced analytical SQL queries (Q1–Q12)
├── 06_plsql.sql           # Procedures, functions, triggers, & packages
└── 07_demo.sql            # Interactive test demonstration script
```

### Execution Order in SQL\*Plus / SQL Developer:

```sql
-- Connect as your medledger user or system
CONN medledger/medledger_pass@localhost:1521/XEPDB1;

-- Run all scripts automatically:
@database/00_run_all.sql;
```

---

## 5. SQL Query Catalogue (Q1 to Q12)

Every query demonstrates fundamental and advanced DBMS concepts:

| ID | Title | DBMS Concept | Objective |
|---|---|---|---|
| **Q1** | Drugs with Manufactured Batches | 3-Table `INNER JOIN`, `ORDER BY` | Identifies lot numbers and manufacture dates for every formulated drug. |
| **Q2** | Manufacturer-wise Batch Summary | `INNER JOIN`, `GROUP BY`, Aggregates (`COUNT`, `MAX`, `MIN`) | Regulatory oversight on manufacturer batch volumes and release status. |
| **Q3** | Packages Currently in Transit | 5-Table Join, Complex Predicate Filtering | Real-time visibility into custody and physical location of transit cargo. |
| **Q4** | Custody Shipments with Resolved Names | Dual joins on the same superclass table (`PARTY`) with aliases | Resolves origin and destination without exposing surrogate IDs. |
| **Q5** | Quality Test Audit for Specific Batches | Parameterized Lookup, `JOIN`, In-list filter | Audits HPLC assay, sterility, and dissolution profiles for specific lots. |
| **Q6** | Recalled Batches and Affected Formulations | 4-Table Join, Temporal & Status Filtering | Rapid recall visibility for regulatory inspectors. |
| **Q7** | Pharmacies Actively Dispensing | Subquery with `EXISTS` clause, Distinct Extraction | Differentiates active dispensing centers from idle retail nodes. |
| **Q8** | Multi-hop Packages (Shipped > 1 Time) | Bridge table aggregation, `GROUP BY`, `HAVING COUNT(*) > 1` | Detects multi-leg logistics transfer through intermediary distributors. |
| **Q9** | Drugs with Failed Quality Tests | Correlated Subquery / `IN` clause, Aggregation | Identifies high-risk chemical formulations requiring investigation. |
| **Q10** | Cargo Manifest Package Count per Shipment | `LEFT OUTER JOIN`, `GROUP BY`, Aggregate `COUNT` | Manifest package verification for freight haulers. |
| **Q11** | Most Frequently Dispensed Drugs | 4-Table Join, `GROUP BY`, `SUM` Aggregate, `ORDER BY DESC` | High-turnover drug consumption analytics for hospital demand planning. |
| **Q12** | Serialized Packages Affected by Recall | Hierarchical Multi-Table Join (`RECALL → BATCH → PACKAGE`) | Instant quarantine list of serialized QR codes across the network. |

---

## 6. PL/SQL Database Programming

### 1. `PROCEDURE register_batch`
Safely registers a manufactured batch after validating that both the manufacturer and the drug formulation exist in the system.
```sql
register_batch(
    p_drug_id          => 101,
    p_manufacturer_id  => 1,
    p_manufacture_date => SYSDATE,
    p_batch_status     => 'RELEASED',
    p_new_batch_id     => v_new_id
);
```

### 2. `PROCEDURE process_recall`
Propagates a regulatory recall notice across the entire supply chain: updates affected `BATCH` records to `RECALLED` and flags all associated `PACKAGE` units as `RECALLED` to prevent retail dispensing.
```sql
process_recall(p_recall_id => 501);
```

### 3. `FUNCTION verify_package`
Core Anti-Counterfeit Verification logic. Accepts either a `package_id` or `qr_code`. Evaluates package state, batch quarantine status, and lab test failures to return:
`AUTHENTIC`, `RECALLED`, `TAMPERED`, `FAILED_TEST`, or `INVALID`.
```sql
SELECT verify_package('QR-MED-208-01-G1') FROM dual;
```

### 4. `FUNCTION recall_impact`
Computes the blast radius of a recall notice (total batches affected, total quarantined packages, and total unit quantity).
```sql
SELECT recall_impact(501) FROM dual;
```

### 5. `TRIGGER trg_check_package_qty`
Enforces the domain constraint that package `quantity_total` must be strictly positive before INSERT or UPDATE.

### 6. `TRIGGER trg_batch_recall_cascade`
Automatically cascades recall status to all related packages whenever a batch's status transitions to `RECALLED`.

---

## 7. Technology Stack

- **Relational DBMS**: Oracle Database 21c Express Edition (Oracle XE) / Oracle Autonomous DB
- **Backend**: Node.js v24+, Express v4.21, `oracledb` v6.10 (Thin Mode, connection pooling)
- **Frontend**: React 19, Vite 8, Tailwind CSS 3.4, Lucide React
- **Design System**: Forest-green & clinical white healthcare identity (`#14532d`, `#166534`, `#f0fdf4`)

---

## 8. Installation & Setup Guide

### Prerequisites
- Node.js v18+ and npm installed
- (Optional for live DB) Oracle Database 21c XE installed and running on port 1521

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/medledger.git
cd medledger
```

### Step 2: Configure Oracle Database (If Running Local Oracle)
In SQL\*Plus as `SYSDBA`:
```sql
ALTER SESSION SET CONTAINER = XEPDB1;
CREATE USER medledger IDENTIFIED BY medledger_pass;
GRANT CONNECT, RESOURCE, DBA TO medledger;
GRANT UNLIMITED TABLESPACE TO medledger;
```

Then initialize the tables and data:
```bash
cd database
node setup_db.js
```
*(Or execute `@database/00_run_all.sql` directly in Oracle SQL Developer).*

### Step 3: Start the Backend Server
```bash
cd backend
npm install
node server.js
```
*The backend starts at `http://localhost:5000`.*  
*If Oracle is offline, the backend automatically enables the in-memory simulation engine seeded with the exact 13-table dataset!*

### Step 4: Start the Frontend Application
```bash
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```
*The web interface starts at `http://localhost:5173`.*

---

## 9. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and database engine status |
| `GET` | `/api/dashboard` | Aggregated KPIs, distributions, and recent events |
| `GET` | `/api/parties` | List parties (filterable by `?role=...`) |
| `POST` | `/api/parties` | Create new Party & subclass relation |
| `PUT` | `/api/parties/:id` | Update existing Party details |
| `DELETE` | `/api/parties/:id` | Delete Party (cascades in DB) |
| `GET` | `/api/drugs` | List drugs catalog (searchable by `?search=...`) |
| `POST` | `/api/drugs` | Add new drug formulation |
| `PUT` | `/api/drugs/:id` | Update drug details |
| `DELETE` | `/api/drugs/:id` | Delete drug |
| `GET` | `/api/batches` | List batches (filterable by `?status=...`) |
| `POST` | `/api/batches` | Register batch via PL/SQL `register_batch` |
| `GET` | `/api/packages` | List serialized units (search by `?qr=...`) |
| `POST` | `/api/packages` | Serialize new package unit |
| `GET` | `/api/packages/verify/:identifier` | Anti-counterfeit verification via PL/SQL `verify_package` |
| `GET` | `/api/shipments` | List custody shipments with party names |
| `POST` | `/api/shipments` | Dispatch shipment and map `CONTAINS` bridge |
| `GET` | `/api/recalls` | List recall notices and impact summaries |
| `POST` | `/api/recalls/:id/process` | Execute PL/SQL `process_recall` |
| `GET` | `/api/recalls/:id/impact` | Call PL/SQL `recall_impact` |
| `GET` | `/api/dispensings` | List retail counter dispensing events |
| `POST` | `/api/dispensings` | Record patient dispensing event |
| `GET` | `/api/analytics` | List 12 SQL queries in catalogue |
| `GET` | `/api/analytics/:queryId` | Execute query (Q1–Q12) and return results |

---

## 10. Demonstration Walkthrough (For University Review)

1. **Dashboard (`/`)**: Show live metrics from Oracle (16 Parties, 12 Drugs, 18 Batches, 32 Packages, 16 Shipments, 4 Recalls).
2. **Anti-Counterfeit Verification (`/verify`)**:
   - Enter `QR-MED-208-01-G1`: Shows **AUTHENTIC** with Paxlovid lineage and manufacturer details.
   - Enter `QR-MED-201-01-A1`: Shows **RECALLED** due to glass particulate contamination.
   - Enter `QR-COUNTERFEIT-FAKE-999`: Shows **INVALID** anti-counterfeit alert.
3. **PL/SQL Procedure Demonstration (`/batches` & `/recalls`)**:
   - Register a new batch to invoke `register_batch` and observe OUT parameter generation.
   - Trigger **Process Recall** on Recall #501 to demonstrate automated cascading updates to batches and packages.
4. **SQL Analytics Engine (`/analytics`)**:
   - Step through Queries **Q1 to Q12**, inspect the syntax explanation, click **Run Query**, and observe tabular output.
5. **Frontend CRUD (`/drugs` or `/parties`)**:
   - Perform an **INSERT** (Add Drug), **UPDATE** (Edit Drug), and **DELETE** (Delete Drug) to confirm live data synchronization.

---

## 11. Project Directory Structure

```
MedLedger DBMS/
├── backend/
│   ├── config/
│   │   └── db.js                 # Dual-mode OracleDB connection pool
│   ├── controllers/              # RESTful API controllers
│   ├── middleware/               # Global error handling
│   ├── routes/                   # Modular Express routes
│   ├── services/                 # Simulation service & fallback
│   ├── .env.example              # Environment template
│   ├── package.json
│   └── server.js                 # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/           # Sidebar, Navbar, Modal, Badges, Toast
│   │   ├── pages/                # 11 Dedicated views
│   │   ├── services/             # API HTTP client
│   │   ├── App.jsx               # Application root
│   │   ├── index.css             # Tailwind base & custom medical styles
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── 00_run_all.sql            # Master runner
│   ├── 01_drop_tables.sql
│   ├── 02_create_tables.sql
│   ├── 03_constraints.sql
│   ├── 04_insert_data.sql
│   ├── 05_queries.sql            # Q1–Q12 Catalogue
│   ├── 06_plsql.sql              # Stored procedures & triggers
│   ├── 07_demo.sql               # Viva verification script
│   └── setup_db.js               # Node-based Oracle runner
├── .gitignore
├── LICENSE
└── README.md
```

---

## 12. Future Scope

- **Layer 2 — Hyperledger Fabric Smart Contracts**: Deploy chaincode to anchor custody transfers into an immutable permissioned ledger.
- **Layer 3 — Neo4j Provenance Graph**: Visualize high-dimension supply chain graph topologies and shortest-path trace analysis.
- **IoT Cold-Chain Telemetry**: Ingest real-time temperature and GPS alerts directly via MQTT brokers.

---

## 13. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
