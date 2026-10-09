-- ============================================================================
-- SCRIPT: 06_plsql.sql
-- PROJECT: MedLedger — Pharmaceutical Supply Chain Intelligence
-- PURPOSE: PL/SQL Stored Procedures, Functions, Triggers, and Verification.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET FEEDBACK ON;

PROMPT ============================================================================;
PROMPT Compiling MedLedger PL/SQL Database Objects...;
PROMPT ============================================================================;

-- ----------------------------------------------------------------------------
-- 1. PROCEDURE: register_batch
-- OBJECTIVE: Safely registers a manufactured batch after validating that both
--            the manufacturer and the drug formulation exist in the system.
--            Validates required fields, checks for duplicate IDs, and enforces
--            referential integrity.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE register_batch (
    p_drug_id          IN  DRUG.drug_id%TYPE,
    p_manufacturer_id  IN  MANUFACTURER.party_id%TYPE,
    p_manufacture_date IN  DATE,
    p_batch_status     IN  VARCHAR2,
    p_new_batch_id     OUT NUMBER,
    p_batch_id         IN  NUMBER DEFAULT NULL
)
AS
    v_mfg_count    NUMBER := 0;
    v_drug_count   NUMBER := 0;
    v_dup_count    NUMBER := 0;
    v_target_id    NUMBER;
    e_null_fields  EXCEPTION;
    e_invalid_mfg  EXCEPTION;
    e_invalid_drug EXCEPTION;
    e_duplicate_id EXCEPTION;
BEGIN
    -- 1. Validate required fields
    IF p_drug_id IS NULL OR p_manufacturer_id IS NULL THEN
        RAISE e_null_fields;
    END IF;

    -- 2. Validate manufacturer existence in subclass table
    SELECT COUNT(*) INTO v_mfg_count
    FROM MANUFACTURER
    WHERE party_id = p_manufacturer_id;

    IF v_mfg_count = 0 THEN
        RAISE e_invalid_mfg;
    END IF;

    -- 3. Validate drug formulation existence
    SELECT COUNT(*) INTO v_drug_count
    FROM DRUG
    WHERE drug_id = p_drug_id;

    IF v_drug_count = 0 THEN
        RAISE e_invalid_drug;
    END IF;

    -- 4. Check for duplicate ID if manual ID was passed; otherwise obtain next batch ID
    IF p_batch_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dup_count
        FROM BATCH
        WHERE batch_id = p_batch_id;

        IF v_dup_count > 0 THEN
            RAISE e_duplicate_id;
        END IF;
        v_target_id := p_batch_id;
    ELSE
        SELECT NVL(MAX(batch_id), 200) + 1 INTO v_target_id FROM BATCH;
    END IF;

    -- 5. Insert new batch
    INSERT INTO BATCH (
        batch_id,
        drug_id,
        manufacturer_id,
        recall_id,
        batch_status,
        manufacture_date
    ) VALUES (
        v_target_id,
        p_drug_id,
        p_manufacturer_id,
        NULL,
        NVL(p_batch_status, 'RELEASED'),
        NVL(p_manufacture_date, SYSDATE)
    );

    p_new_batch_id := v_target_id;
    DBMS_OUTPUT.PUT_LINE('[SUCCESS] Batch #' || v_target_id || ' successfully registered for Drug #' || p_drug_id || ' by Manufacturer #' || p_manufacturer_id);

EXCEPTION
    WHEN e_null_fields THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_batch: Required fields p_drug_id and p_manufacturer_id cannot be NULL.');
        RAISE_APPLICATION_ERROR(-20005, 'Missing Required Fields: p_drug_id and p_manufacturer_id must be provided.');
    WHEN e_invalid_mfg THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_batch: Party ID ' || p_manufacturer_id || ' is not a licensed MANUFACTURER.');
        RAISE_APPLICATION_ERROR(-20001, 'Invalid Manufacturer: Party ID does not exist in MANUFACTURER table.');
    WHEN e_invalid_drug THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_batch: Drug ID ' || p_drug_id || ' does not exist in DRUG table.');
        RAISE_APPLICATION_ERROR(-20002, 'Invalid Drug: Drug ID does not exist.');
    WHEN e_duplicate_id THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_batch: Batch ID ' || p_batch_id || ' already exists in BATCH table.');
        RAISE_APPLICATION_ERROR(-20006, 'Duplicate Batch ID: Batch with ID ' || p_batch_id || ' already exists.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_batch encountered unexpected error: ' || SQLERRM);
        RAISE;
END register_batch;
/

-- ----------------------------------------------------------------------------
-- 2. PROCEDURE: process_recall
-- OBJECTIVE: Propagates a regulatory recall notice across the entire supply chain:
--            updates affected BATCH records to 'RECALLED' and flags all associated
--            PACKAGE units as 'RECALLED' to prevent retail dispensing.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE process_recall (
    p_recall_id IN RECALL.recall_id%TYPE
)
AS
    v_recall_exists  NUMBER := 0;
    v_batches_count  NUMBER := 0;
    v_packages_count NUMBER := 0;
    e_no_recall      EXCEPTION;
BEGIN
    -- Verify recall notice exists
    SELECT COUNT(*) INTO v_recall_exists
    FROM RECALL
    WHERE recall_id = p_recall_id;

    IF v_recall_exists = 0 THEN
        RAISE e_no_recall;
    END IF;

    -- 1. Update batch status to RECALLED for batches linked to this recall
    UPDATE BATCH
    SET batch_status = 'RECALLED'
    WHERE recall_id = p_recall_id;

    v_batches_count := SQL%ROWCOUNT;

    -- 2. Update status of all child packages linked to these batches
    UPDATE PACKAGE
    SET status = 'RECALLED'
    WHERE batch_id IN (
        SELECT batch_id FROM BATCH WHERE recall_id = p_recall_id
    )
    AND status <> 'DISPENSED'; -- Keep record of already dispensed for pharmacovigilance

    v_packages_count := SQL%ROWCOUNT;

    -- 3. Update the recall status to ACTIVE
    UPDATE RECALL
    SET status = 'ACTIVE'
    WHERE recall_id = p_recall_id;

    DBMS_OUTPUT.PUT_LINE('[RECALL PROCESSED] Recall #' || p_recall_id || ' executed:');
    DBMS_OUTPUT.PUT_LINE('  - Affected Batches Marked RECALLED: ' || v_batches_count);
    DBMS_OUTPUT.PUT_LINE('  - In-Circulation Packages Quarantined: ' || v_packages_count);

    COMMIT;
EXCEPTION
    WHEN e_no_recall THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] process_recall: Recall ID ' || p_recall_id || ' not found.');
        RAISE_APPLICATION_ERROR(-20003, 'Recall notice does not exist.');
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('[ERROR] process_recall failed: ' || SQLERRM);
        RAISE;
END process_recall;
/

-- ----------------------------------------------------------------------------
-- 3. PROCEDURE: register_shipment
-- OBJECTIVE: Registers a custody transfer shipment between two licensed supply
--            chain parties. Validates sender and receiver existence in PARTY,
--            enforces sender <> receiver rule, and validates transport mode.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE register_shipment (
    p_sender_id       IN  PARTY.party_id%TYPE,
    p_receiver_id     IN  PARTY.party_id%TYPE,
    p_shipment_date   IN  DATE,
    p_status          IN  VARCHAR2,
    p_mode            IN  VARCHAR2,
    p_new_shipment_id OUT NUMBER
)
AS
    v_sender_count   NUMBER := 0;
    v_receiver_count NUMBER := 0;
    v_next_id        NUMBER;
    e_null_parties   EXCEPTION;
    e_same_parties   EXCEPTION;
    e_invalid_sender EXCEPTION;
    e_invalid_rcvr   EXCEPTION;
    e_invalid_mode   EXCEPTION;
BEGIN
    -- 1. Validate non-null party references
    IF p_sender_id IS NULL OR p_receiver_id IS NULL THEN
        RAISE e_null_parties;
    END IF;

    -- 2. Validate sender != receiver
    IF p_sender_id = p_receiver_id THEN
        RAISE e_same_parties;
    END IF;

    -- 3. Validate sender existence in PARTY
    SELECT COUNT(*) INTO v_sender_count FROM PARTY WHERE party_id = p_sender_id;
    IF v_sender_count = 0 THEN
        RAISE e_invalid_sender;
    END IF;

    -- 4. Validate receiver existence in PARTY
    SELECT COUNT(*) INTO v_receiver_count FROM PARTY WHERE party_id = p_receiver_id;
    IF v_receiver_count = 0 THEN
        RAISE e_invalid_rcvr;
    END IF;

    -- 5. Validate transport mode domain
    IF NVL(p_mode, 'ROAD_LOGISTICS') NOT IN (
        'AIR_CARGO', 'COLD_CHAIN_TRUCK', 'EXPRESS_COURIER', 'MARITIME', 'ROAD_LOGISTICS'
    ) THEN
        RAISE e_invalid_mode;
    END IF;

    -- 6. Generate next shipment ID
    SELECT NVL(MAX(shipment_id), 400) + 1 INTO v_next_id FROM SHIPMENT;

    INSERT INTO SHIPMENT (
        shipment_id,
        sender_party_id,
        receiver_party_id,
        shipment_date,
        status,
        mode
    ) VALUES (
        v_next_id,
        p_sender_id,
        p_receiver_id,
        NVL(p_shipment_date, SYSDATE),
        NVL(p_status, 'CREATED'),
        NVL(p_mode, 'ROAD_LOGISTICS')
    );

    p_new_shipment_id := v_next_id;
    DBMS_OUTPUT.PUT_LINE('[SUCCESS] Shipment #' || v_next_id || ' registered: Sender #' || p_sender_id || ' -> Receiver #' || p_receiver_id || ' (Mode: ' || NVL(p_mode, 'ROAD_LOGISTICS') || ')');

EXCEPTION
    WHEN e_null_parties THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment: sender_party_id and receiver_party_id cannot be NULL.');
        RAISE_APPLICATION_ERROR(-20010, 'Required Parties Missing: sender_party_id and receiver_party_id must be provided.');
    WHEN e_same_parties THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment: sender and receiver cannot be identical.');
        RAISE_APPLICATION_ERROR(-20011, 'Invalid Shipment: Sender and Receiver parties cannot be identical.');
    WHEN e_invalid_sender THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment: Sender party ID ' || p_sender_id || ' does not exist.');
        RAISE_APPLICATION_ERROR(-20012, 'Invalid Sender: Party ID does not exist in PARTY table.');
    WHEN e_invalid_rcvr THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment: Receiver party ID ' || p_receiver_id || ' does not exist.');
        RAISE_APPLICATION_ERROR(-20013, 'Invalid Receiver: Party ID does not exist in PARTY table.');
    WHEN e_invalid_mode THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment: Invalid transport mode: ' || p_mode);
        RAISE_APPLICATION_ERROR(-20014, 'Invalid Mode: Transport mode not permitted by domain constraint.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] register_shipment failed: ' || SQLERRM);
        RAISE;
END register_shipment;
/

-- ----------------------------------------------------------------------------
-- 4. FUNCTION: verify_package
-- OBJECTIVE: Core Anti-Counterfeit Verification logic.
--            Accepts either package_id or qr_code.
--            Returns: 'AUTHENTIC', 'RECALLED', 'TAMPERED', 'FAILED_TEST', or 'INVALID'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_package (
    p_identifier IN VARCHAR2
)
RETURN VARCHAR2
AS
    v_package_id      PACKAGE.package_id%TYPE;
    v_pkg_status      PACKAGE.status%TYPE;
    v_batch_id        BATCH.batch_id%TYPE;
    v_batch_status    BATCH.batch_status%TYPE;
    v_recall_id       BATCH.recall_id%TYPE;
    v_failed_tests    NUMBER := 0;
    v_found           BOOLEAN := FALSE;
BEGIN
    -- 1. Search by exact package_id if input is numeric, or by qr_code
    BEGIN
        SELECT p.package_id, p.status, b.batch_id, b.batch_status, b.recall_id
        INTO v_package_id, v_pkg_status, v_batch_id, v_batch_status, v_recall_id
        FROM PACKAGE p
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        WHERE p.qr_code = p_identifier
           OR (REGEXP_LIKE(p_identifier, '^[0-9]+$') AND p.package_id = TO_NUMBER(p_identifier));
        
        v_found := TRUE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_found := FALSE;
    END;

    IF NOT v_found THEN
        RETURN 'INVALID: Package or QR Code does not exist in MedLedger';
    END IF;

    -- 2. Check if Package itself was marked RECALLED or TAMPERED
    IF v_pkg_status = 'TAMPERED' THEN
        RETURN 'TAMPERED: Security seal broken or chain-of-custody compromised';
    END IF;

    IF v_pkg_status = 'RECALLED' OR v_batch_status = 'RECALLED' OR v_recall_id IS NOT NULL THEN
        RETURN 'RECALLED: Product belongs to an active regulatory or manufacturer recall';
    END IF;

    -- 3. Check for failed lab quality tests
    SELECT COUNT(*) INTO v_failed_tests
    FROM QUALITY_TEST
    WHERE batch_id = v_batch_id AND status = 'FAILED';

    IF v_failed_tests > 0 THEN
        RETURN 'FAILED_TEST: Associated batch failed laboratory quality assurance';
    END IF;

    -- 4. Normal Authentic state
    IF v_pkg_status = 'DISPENSED' THEN
        RETURN 'AUTHENTIC (DISPENSED): Legitimate pharmaceutical product already dispensed to patient';
    ELSIF v_pkg_status IN ('PACKAGED', 'IN_TRANSIT', 'DELIVERED') THEN
        RETURN 'AUTHENTIC: Legitimate pharmaceutical product verified on MedLedger';
    ELSE
        RETURN 'STATUS: ' || v_pkg_status;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: Verification procedure failed - ' || SQLERRM;
END verify_package;
/

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: get_recall_impact
-- OBJECTIVE: Computes the aggregate impact of a recall notice (total batches
--            and total serialized packages quarantined across the network).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_recall_impact (
    p_recall_id IN RECALL.recall_id%TYPE
)
RETURN VARCHAR2
AS
    v_batches_count  NUMBER := 0;
    v_packages_count NUMBER := 0;
    v_units_total    NUMBER := 0;
    v_result         VARCHAR2(300);
BEGIN
    SELECT 
        COUNT(DISTINCT b.batch_id),
        COUNT(p.package_id),
        NVL(SUM(p.quantity_total), 0)
    INTO 
        v_batches_count,
        v_packages_count,
        v_units_total
    FROM BATCH b
    LEFT JOIN PACKAGE p ON b.batch_id = p.batch_id
    WHERE b.recall_id = p_recall_id;

    v_result := 'Batches Affected: ' || v_batches_count || 
                ' | Packages Quarantined: ' || v_packages_count || 
                ' | Total Units: ' || v_units_total;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Impact Calculation Error: ' || SQLERRM;
END get_recall_impact;
/

-- Function alias for backward compatibility with queries referencing recall_impact
CREATE OR REPLACE FUNCTION recall_impact (
    p_recall_id IN RECALL.recall_id%TYPE
)
RETURN VARCHAR2
AS
BEGIN
    RETURN get_recall_impact(p_recall_id);
END recall_impact;
/

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: trg_check_package_qty
-- OBJECTIVE: Business rule trigger preventing negative or zero package units.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_check_package_qty
BEFORE INSERT OR UPDATE OF quantity_total ON PACKAGE
FOR EACH ROW
BEGIN
    IF :NEW.quantity_total <= 0 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Package quantity_total must be strictly greater than zero.');
    END IF;
END trg_check_package_qty;
/

-- ----------------------------------------------------------------------------
-- 7. TRIGGER: trg_batch_recall_cascade
-- OBJECTIVE: Automatically cascades recall state to all related packages whenever
--            a batch's status is changed to 'RECALLED'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_batch_recall_cascade
AFTER UPDATE OF batch_status ON BATCH
FOR EACH ROW
WHEN (NEW.batch_status = 'RECALLED' AND OLD.batch_status <> 'RECALLED')
BEGIN
    UPDATE PACKAGE
    SET status = 'RECALLED'
    WHERE batch_id = :NEW.batch_id
      AND status <> 'DISPENSED';
END trg_batch_recall_cascade;
/

-- ----------------------------------------------------------------------------
-- 8. TRIGGER: trg_package_state_transition
-- OBJECTIVE: Validates package lifecycle state transitions.
--            - Prevents dispensing a product under active recall.
--            - Prevents dispensed product from reverting to active distribution.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_package_state_transition
BEFORE UPDATE OF status ON PACKAGE
FOR EACH ROW
BEGIN
    -- Prevent dispensing recalled product
    IF :NEW.status = 'DISPENSED' AND :OLD.status = 'RECALLED' THEN
        RAISE_APPLICATION_ERROR(-20020, 'Safety Violation: Cannot dispense a RECALLED package unit. Quarantined for patient safety.');
    END IF;

    -- Prevent dispensed product from re-entering transit
    IF :OLD.status = 'DISPENSED' AND :NEW.status IN ('PACKAGED', 'IN_TRANSIT') THEN
        RAISE_APPLICATION_ERROR(-20021, 'Lifecycle Violation: Dispensed package cannot re-enter active supply chain distribution.');
    END IF;
END trg_package_state_transition;
/

PROMPT ============================================================================;
PROMPT MedLedger PL/SQL Objects Compiled Successfully.
PROMPT ============================================================================;
