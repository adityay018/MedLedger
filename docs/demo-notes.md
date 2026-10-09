# MedLedger DBMS — Live Demonstration Script & Walkthrough Notes

This document provides a step-by-step demonstration sequence for presenting the **MedLedger Pharmaceutical Supply Chain Intelligence** platform to evaluators, stakeholders, or examiners.

---

## Startup Instructions

### 1. Start the Express Backend

In a dedicated terminal:

```powershell
cd backend
node server.js
```

- Server URL: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`
- Expected Output:
  ```
  ================================================================
   MEDLEDGER SUPPLY CHAIN INTELLIGENCE — BACKEND SERVER
  ================================================================
   Server Listening on : http://localhost:5000
   Health Endpoint     : http://localhost:5000/api/health
   Storage Engine      : In-Memory Volatile (Development Fallback) / Oracle 21c
  ```

### 2. Start the React Frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

- Web Application URL: `http://localhost:5173`

---

## Live Demonstration Sequence (13 Steps)

### Step 1: Open the Dashboard
- **Action**: Navigate to `http://localhost:5173` in your browser.
- **What to show**:
  - The clean **MedLedger** header and emerald-green pharmaceutical branding.
  - Live metric KPI cards:
    - **Registered Drugs**
    - **Active Batches**
    - **Serialized Packages**
    - **Active Shipments**
    - **Recall Notices**
  - Supply Chain Custody overview and recent transfer feed.

---

### Step 2: Show the System Status & Health Telemetry
- **Action**: Point out the **System Status Badge** in the header or visit `http://localhost:5000/api/health`.
- **Key Talking Points**:
  - MedLedger features a **truthful operational health check**.
  - If Oracle is connected, it displays `ORACLE_21C_LIVE` with persistent storage.
  - If Oracle is unreachable (e.g. port 1521 offline), it displays `SIMULATION_STORAGE` with in-memory fallback.
  - **Explain honestly**: The backend never crashes when the database listener is offline, and simulated data is clearly identified as volatile fallback rather than persistent Oracle data.

---

### Step 3: Create a Drug
- **Action**: Navigate to **Drugs Catalogue** (`/drugs`). Click **"+ Register New Drug"**.
- **Input**:
  - Drug Name: `Azithromycin Dihydrate`
  - Strength: `500 mg`
  - Dosage Form: `Film-Coated Tablet`
  - Description: `Macrolide antibiotic used for respiratory and skin infections`
- **Result**: Drug is registered with auto-generated ID (e.g., `#111`).
- **Talking Point**: Parameterized insertion prevents SQL injection; fields validate formulation strength and dosage.

---

### Step 4: Update the Drug
- **Action**: Click the **Edit** icon next to `Azithromycin Dihydrate`.
- **Input**: Change strength to `250 mg` or update dosage form to `Oral Suspension`.
- **Result**: Record updates instantly in the catalogue table.

---

### Step 5: Delete the Drug (When Permitted vs Blocked by FK)
- **Part A (Permitted)**: Delete the newly created `Azithromycin Dihydrate` (since no batches reference it yet).
  - Result: Deletion succeeds cleanly with a confirmation alert.
- **Part B (Referential Integrity Guard)**: Try to delete `Paxlovid` (`Drug #108`) or `Remdesivir` (`Drug #101`).
  - Result: The system blocks deletion with a `409 Conflict` error explaining that manufactured batches exist in the `BATCH` relation, demonstrating strict referential integrity.

---

### Step 6: Create or Inspect a Batch
- **Action**: Navigate to **Batches** (`/batches`).
- **What to show**:
  - The list of batches displaying drug formulation, manufacturer, manufacturing date, and batch lifecycle status.
- **Action**: Click **"+ Register Batch Lot"**.
  - Select Drug: `Paracetamol (500 mg)`
  - Select Manufacturer: `Sun Pharma Laboratories Ltd`
  - Status: `RELEASED`
- **Talking Point**: Emphasize that batch creation executes the **`REGISTER_BATCH` PL/SQL stored procedure**, validating that the manufacturer exists in the `MANUFACTURER` ISA subclass table.

---

### Step 7: Trace a Package (Anti-Counterfeit Verification)
- **Action**: Navigate to **Package Verification** (`/verify`).
- **Scenario A (Authentic Package)**:
  - Enter QR Code: `QR-MED-208-01-G1`
  - Click **Verify Package**.
  - Result: **VERIFIED** badge. Complete 360-degree lineage report displayed: batch details, manufacturer, passed lab tests, and complete shipment chain of custody.
- **Scenario B (Recalled Package)**:
  - Enter QR Code: `QR-MED-201-01-A1`
  - Click **Verify Package**.
  - Result: **RECALL ALERT** badge. System flags that the associated batch was recalled due to contamination.
- **Scenario C (Counterfeit / Non-existent)**:
  - Enter: `QR-FAKE-COUNTERFEIT-999`
  - Result: **NOT FOUND** warning banner indicating an unregistered, counterfeit QR code.

---

### Step 8: Inspect Shipment Details
- **Action**: Navigate to **Shipments** (`/shipments`).
- **What to show**:
  - Manifest transfers between supply chain entities (Pfizer -> McKesson -> CVS Pharmacy).
  - Transport modes: `COLD_CHAIN_TRUCK`, `AIR_CARGO`, `ROAD_LOGISTICS`.
- **Action**: Click **"+ Create Shipment"**.
  - Verify that selecting the same entity for Sender and Receiver is rejected by both frontend validation and Oracle's `chk_shipment_parties` constraint (`sender_party_id <> receiver_party_id`).

---

### Step 9: Display Failed Quality Tests
- **Action**: Navigate to **Quality Tests** (`/quality-tests`).
- **What to show**:
  - Filter by **FAILED** tests or inspect `Batch #201` (glass particulate contamination) and `Batch #209` (thermal excursion failure).
  - Point out how lab assay failures feed directly into the verification engine to quarantine substandard drug lots.

---

### Step 10: Show Recall Impact Assessment
- **Action**: Navigate to **Recalls** (`/recalls`).
- **What to show**:
  - Active recall notices issued by regulatory bodies (`FDA`, `EMA`, `CDSCO`).
  - Impact summary generated by the **`GET_RECALL_IMPACT`** PL/SQL function:
    `Batches Affected: 1 | Packages Quarantined: 3 | Total Units: 350`.
- **Action**: Click **"Process"** on a recall notice to trigger the **`PROCESS_RECALL`** PL/SQL procedure, propagating quarantine status across batches and child packages in real time.

---

### Step 11: Execute the 15 SQL Analytics Queries
- **Action**: Navigate to **SQL Analytics** (`/analytics`).
- **What to show**:
  - The interactive query console featuring all **15 Core Queries**:
    1. Drug Catalogue
    2. Batch Traceability
    3. Package Inventory
    4. Shipment Tracking
    5. In-Transit Shipments
    6. Failed Quality Tests
    7. Active Recalls
    8. Recall Impact Analysis
    9. Manufacturer Performance
    10. Pharmacy Dispensing Summary
    11. Most Frequently Batched Drugs
    12. Undispensed Packages
    13. Package Shipment History
    14. Pending or Failed Quality Tests
    15. Package Verification Lineage Audit
  - Click any query (e.g., *Query 9: Manufacturer Performance* or *Query 11: Most Frequently Batched Drugs*).
  - Show the live SQL editor displaying standard Oracle SQL syntax with Window Functions (`DENSE_RANK()`), `LEFT OUTER JOIN`, and `NVL`.
  - Click **"Execute Query"** to see live results returned by the Express backend.

---

### Step 12: Demonstrate a PL/SQL Procedure or Function
- **Action**: Show `database/06_plsql.sql` and `database/07_demo.sql`.
- **Talking Points**:
  - `REGISTER_BATCH`: Validates manufacturer and drug existence, checks duplicate IDs, and inserts the lot safely.
  - `REGISTER_SHIPMENT`: Validates sender and receiver parties, verifies `sender != receiver`, and checks transport modes.
  - `PROCESS_RECALL`: Propagates recall status across `BATCH` and child `PACKAGE` units.
  - `VERIFY_PACKAGE`: Evaluates anti-counterfeit verdicts based on batch, quality, and recall relations.
  - `GET_RECALL_IMPACT`: Calculates aggregate supply chain blast radius.
  - `trg_batch_recall_cascade`: Trigger automatically cascades recall status to packages.
  - `trg_package_state_transition`: Trigger prevents dispensing recalled units.

---

### Step 13: Explain the Oracle Connection Status Honestly
- **Talking Points**:
  - When Oracle is running locally (`localhost:1521/XEPDB1`), MedLedger connects using the `oracledb` node driver with connection pooling and executes live SQL and PL/SQL.
  - When port 1521 is offline, MedLedger automatically runs its **development simulation fallback**, allowing full UI, CRUD, verification, and analytics demonstrations without crashing or presenting false claims.
  - The health check transparently indicates which engine is active.
