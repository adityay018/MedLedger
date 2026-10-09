-- ============================================================================
-- SCRIPT: 07_demo.sql
-- PROJECT: MedLedger — Pharmaceutical Supply Chain Intelligence
-- PURPOSE: Interactive Demonstration Script for Schema Verification.
--          Demonstrates PL/SQL procedures, functions, trigger behaviors,
--          and exception handling in SQL*Plus or Oracle SQL Developer.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 160;
SET PAGESIZE 50;
SET FEEDBACK ON;

PROMPT ============================================================================;
PROMPT                  MEDLEDGER DBMS - LIVE DEMONSTRATION SCRIPT                 ;
PROMPT ============================================================================;

-- ----------------------------------------------------------------------------
-- DEMO 1: Executing verify_package Function
-- Demonstrates: Authentic Package vs Recalled Package vs Non-existent QR Code
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 1] Testing Anti-Counterfeit Verification Function (verify_package);
PROMPT ----------------------------------------------------------------------------;

DECLARE
    v_res1 VARCHAR2(200);
    v_res2 VARCHAR2(200);
    v_res3 VARCHAR2(200);
BEGIN
    -- 1. Test Authentic Package (Paxlovid in-transit)
    v_res1 := verify_package('QR-MED-208-01-G1');
    DBMS_OUTPUT.PUT_LINE('Test 1 [QR: QR-MED-208-01-G1]: ' || v_res1);

    -- 2. Test Recalled Package (Batch 201 Remdesivir glass particulate)
    v_res2 := verify_package('QR-MED-201-01-A1');
    DBMS_OUTPUT.PUT_LINE('Test 2 [QR: QR-MED-201-01-A1]: ' || v_res2);

    -- 3. Test Counterfeit / Non-existent QR code
    v_res3 := verify_package('QR-COUNTERFEIT-FAKE-999');
    DBMS_OUTPUT.PUT_LINE('Test 3 [QR: QR-COUNTERFEIT-FAKE-999]: ' || v_res3);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO 2: Executing get_recall_impact Function
-- Demonstrates: Aggregating supply chain compromise under a recall notice
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 2] Testing Recall Impact Assessment Function (get_recall_impact);
PROMPT ----------------------------------------------------------------------------;

SELECT 
    recall_id,
    status,
    reason,
    get_recall_impact(recall_id) AS supply_chain_blast_radius
FROM RECALL
ORDER BY recall_id;

-- ----------------------------------------------------------------------------
-- DEMO 3: Executing register_batch Procedure
-- Demonstrates: Validating manufacturer & drug before registering a new batch
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 3] Testing Batch Registration Procedure (register_batch);
PROMPT ----------------------------------------------------------------------------;

DECLARE
    v_new_id NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Calling register_batch for Drug 103 (Paracetamol), Manufacturer 3 (Sun Pharma)...');
    register_batch(
        p_drug_id          => 103,
        p_manufacturer_id  => 3,
        p_manufacture_date => SYSDATE,
        p_batch_status     => 'RELEASED',
        p_new_batch_id     => v_new_id
    );
    DBMS_OUTPUT.PUT_LINE('Returned OUT Parameter Batch ID: ' || v_new_id);
END;
/

-- Verify the new batch was inserted
SELECT batch_id, drug_id, manufacturer_id, batch_status, manufacture_date 
FROM BATCH 
WHERE batch_id = (SELECT MAX(batch_id) FROM BATCH);

-- ----------------------------------------------------------------------------
-- DEMO 4: Demonstrating Exception Handling in register_batch
-- Demonstrates: Attempting to register a batch with an unauthorized non-manufacturer
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 4] Testing Exception Handling (Invalid Manufacturer Party ID = 9);
PROMPT ----------------------------------------------------------------------------;

DECLARE
    v_dummy_id NUMBER;
BEGIN
    -- Party ID 9 is CVS Health Pharmacy, NOT a Manufacturer
    DBMS_OUTPUT.PUT_LINE('Attempting to register batch with Party ID 9 (CVS Pharmacy - not a manufacturer)...');
    register_batch(
        p_drug_id          => 101,
        p_manufacturer_id  => 9,
        p_manufacture_date => SYSDATE,
        p_batch_status     => 'RELEASED',
        p_new_batch_id     => v_dummy_id
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('SUCCESSFULLY CAUGHT EXPECTED EXCEPTION:');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ' | SQLERRM: ' || SQLERRM);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO 5: Testing register_shipment Procedure
-- Demonstrates: Registering a custody transfer between valid supply chain parties
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 5] Testing Shipment Registration Procedure (register_shipment);
PROMPT ----------------------------------------------------------------------------;

DECLARE
    v_shipment_id NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Calling register_shipment: Sender 1 (Pfizer) -> Receiver 5 (AmerisourceBergen)...');
    register_shipment(
        p_sender_id       => 1,
        p_receiver_id     => 5,
        p_shipment_date   => SYSDATE,
        p_status          => 'CREATED',
        p_mode            => 'COLD_CHAIN_TRUCK',
        p_new_shipment_id => v_shipment_id
    );
    DBMS_OUTPUT.PUT_LINE('Returned OUT Parameter Shipment ID: ' || v_shipment_id);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO 6: Demonstrating Exception Handling in register_shipment
-- Demonstrates: Attempting to register shipment with identical sender & receiver
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 6] Testing Exception Handling (Identical Sender and Receiver = 1);
PROMPT ----------------------------------------------------------------------------;

DECLARE
    v_dummy_shipment_id NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting to register shipment with sender = 1 and receiver = 1...');
    register_shipment(
        p_sender_id       => 1,
        p_receiver_id     => 1,
        p_shipment_date   => SYSDATE,
        p_status          => 'CREATED',
        p_mode            => 'ROAD_LOGISTICS',
        p_new_shipment_id => v_dummy_shipment_id
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('SUCCESSFULLY CAUGHT EXPECTED EXCEPTION:');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ' | SQLERRM: ' || SQLERRM);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO 7: Testing Trigger trg_batch_recall_cascade
-- Demonstrates: Updating a batch status to RECALLED automatically flags packages
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 7] Testing Trigger trg_batch_recall_cascade;
PROMPT ----------------------------------------------------------------------------;

PROMPT Before Batch Update: Package statuses for Batch 202:;
SELECT package_id, batch_id, status FROM PACKAGE WHERE batch_id = 202;

PROMPT Updating Batch 202 status to RECALLED...;
UPDATE BATCH
SET batch_status = 'RECALLED'
WHERE batch_id = 202;

PROMPT After Batch Update: Notice non-dispensed packages are now automatically RECALLED:;
SELECT package_id, batch_id, status FROM PACKAGE WHERE batch_id = 202;

-- Revert demo update to keep database in standard test state
ROLLBACK;
PROMPT Rolled back test batch status update.

-- ----------------------------------------------------------------------------
-- DEMO 8: Testing Trigger trg_check_package_qty
-- Demonstrates: Preventing insertion of zero/negative package units
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 8] Testing Trigger trg_check_package_qty (Preventing quantity <= 0);
PROMPT ----------------------------------------------------------------------------;

BEGIN
    INSERT INTO PACKAGE (
        package_id, batch_id, dispense_id, package_size, packaged_at,
        qr_code, status, quantity_total
    ) VALUES (
        999, 203, NULL, 'Invalid Test Box', SYSDATE,
        'QR-INVALID-TEST-999', 'PACKAGED', -5
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('SUCCESSFULLY CAUGHT TRIGGER EXCEPTION:');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ' | SQLERRM: ' || SQLERRM);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO 9: Testing Trigger trg_package_state_transition
-- Demonstrates: Preventing dispensing of a RECALLED package unit
-- ----------------------------------------------------------------------------
PROMPT;
PROMPT ----------------------------------------------------------------------------;
PROMPT [DEMO 9] Testing Trigger trg_package_state_transition (Preventing Recall Dispensing);
PROMPT ----------------------------------------------------------------------------;

BEGIN
    -- Package 1 belongs to recalled Batch 201 (status = 'RECALLED')
    DBMS_OUTPUT.PUT_LINE('Attempting to update status of RECALLED package 1 to DISPENSED...');
    UPDATE PACKAGE
    SET status = 'DISPENSED'
    WHERE package_id = 1;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('SUCCESSFULLY CAUGHT STATE TRANSITION EXCEPTION:');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ' | SQLERRM: ' || SQLERRM);
END;
/

PROMPT ============================================================================;
PROMPT MedLedger Interactive PL/SQL Demonstration Completed.
PROMPT ============================================================================;
