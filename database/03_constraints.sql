-- ============================================================================
-- SCRIPT: 03_constraints.sql
-- PROJECT: MedLedger DBMS - University DA2 Project
-- PURPOSE: Define all Foreign Keys, CHECK constraints, and Domain validations.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

PROMPT ===================================================;
PROMPT Applying Referential & Check Constraints...;
PROMPT ===================================================;

-- ----------------------------------------------------------------------------
-- 1. FOREIGN KEY CONSTRAINTS: Subclasses to PARTY (ISA hierarchy)
-- ----------------------------------------------------------------------------
ALTER TABLE MANUFACTURER
    ADD CONSTRAINT fk_mfg_party FOREIGN KEY (party_id)
    REFERENCES PARTY (party_id) ON DELETE CASCADE;

ALTER TABLE DISTRIBUTOR
    ADD CONSTRAINT fk_dist_party FOREIGN KEY (party_id)
    REFERENCES PARTY (party_id) ON DELETE CASCADE;

ALTER TABLE PHARMACY
    ADD CONSTRAINT fk_pharm_party FOREIGN KEY (party_id)
    REFERENCES PARTY (party_id) ON DELETE CASCADE;

ALTER TABLE REGULATOR
    ADD CONSTRAINT fk_reg_party FOREIGN KEY (party_id)
    REFERENCES PARTY (party_id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 2. FOREIGN KEY CONSTRAINTS: BATCH
-- ----------------------------------------------------------------------------
ALTER TABLE BATCH
    ADD CONSTRAINT fk_batch_drug FOREIGN KEY (drug_id)
    REFERENCES DRUG (drug_id);

ALTER TABLE BATCH
    ADD CONSTRAINT fk_batch_mfg FOREIGN KEY (manufacturer_id)
    REFERENCES MANUFACTURER (party_id);

ALTER TABLE BATCH
    ADD CONSTRAINT fk_batch_recall FOREIGN KEY (recall_id)
    REFERENCES RECALL (recall_id);

-- ----------------------------------------------------------------------------
-- 3. FOREIGN KEY CONSTRAINTS: QUALITY_TEST
-- ----------------------------------------------------------------------------
ALTER TABLE QUALITY_TEST
    ADD CONSTRAINT fk_qtest_batch FOREIGN KEY (batch_id)
    REFERENCES BATCH (batch_id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. FOREIGN KEY CONSTRAINTS: DISPENSING
-- ----------------------------------------------------------------------------
ALTER TABLE DISPENSING
    ADD CONSTRAINT fk_disp_pharmacy FOREIGN KEY (pharmacy_id)
    REFERENCES PHARMACY (party_id);

-- ----------------------------------------------------------------------------
-- 5. FOREIGN KEY CONSTRAINTS: PACKAGE
-- ----------------------------------------------------------------------------
ALTER TABLE PACKAGE
    ADD CONSTRAINT fk_pkg_batch FOREIGN KEY (batch_id)
    REFERENCES BATCH (batch_id);

ALTER TABLE PACKAGE
    ADD CONSTRAINT fk_pkg_dispense FOREIGN KEY (dispense_id)
    REFERENCES DISPENSING (dispense_id);

-- ----------------------------------------------------------------------------
-- 6. FOREIGN KEY CONSTRAINTS: SHIPMENT
-- ----------------------------------------------------------------------------
ALTER TABLE SHIPMENT
    ADD CONSTRAINT fk_shipment_sender FOREIGN KEY (sender_party_id)
    REFERENCES PARTY (party_id);

ALTER TABLE SHIPMENT
    ADD CONSTRAINT fk_shipment_receiver FOREIGN KEY (receiver_party_id)
    REFERENCES PARTY (party_id);

-- ----------------------------------------------------------------------------
-- 7. FOREIGN KEY CONSTRAINTS: CONTAINS (M:N Bridge)
-- ----------------------------------------------------------------------------
ALTER TABLE CONTAINS
    ADD CONSTRAINT fk_contains_pkg FOREIGN KEY (package_id)
    REFERENCES PACKAGE (package_id) ON DELETE CASCADE;

ALTER TABLE CONTAINS
    ADD CONSTRAINT fk_contains_shipment FOREIGN KEY (shipment_id)
    REFERENCES SHIPMENT (shipment_id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 8. DOMAIN INTEGRITY (CHECK CONSTRAINTS)
-- ----------------------------------------------------------------------------

-- Quantities must be strictly positive
ALTER TABLE PACKAGE
    ADD CONSTRAINT chk_pkg_qty CHECK (quantity_total > 0);

ALTER TABLE DISPENSING
    ADD CONSTRAINT chk_disp_qty CHECK (quantity > 0);

-- Valid Batch lifecycle statuses
ALTER TABLE BATCH
    ADD CONSTRAINT chk_batch_status CHECK (
        batch_status IN ('RELEASED', 'QUARANTINED', 'IN_TRANSIT', 'RECALLED', 'EXPIRED', 'ACTIVE')
    );

-- Valid Quality Test review statuses
ALTER TABLE QUALITY_TEST
    ADD CONSTRAINT chk_qtest_status CHECK (
        status IN ('PASSED', 'FAILED', 'PENDING')
    );

-- Valid Recall statuses
ALTER TABLE RECALL
    ADD CONSTRAINT chk_recall_status CHECK (
        status IN ('INITIATED', 'INVESTIGATING', 'ACTIVE', 'COMPLETED')
    );

-- Valid Package custody statuses
ALTER TABLE PACKAGE
    ADD CONSTRAINT chk_pkg_status CHECK (
        status IN ('PACKAGED', 'IN_TRANSIT', 'DELIVERED', 'DISPENSED', 'RECALLED', 'TAMPERED')
    );

-- Valid Shipment lifecycle statuses
ALTER TABLE SHIPMENT
    ADD CONSTRAINT chk_shipment_status CHECK (
        status IN ('CREATED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED')
    );

-- Valid Logistics transport modes
ALTER TABLE SHIPMENT
    ADD CONSTRAINT chk_shipment_mode CHECK (
        mode IN ('AIR_CARGO', 'COLD_CHAIN_TRUCK', 'EXPRESS_COURIER', 'MARITIME', 'ROAD_LOGISTICS')
    );

-- Sender party and receiver party cannot be identical
ALTER TABLE SHIPMENT
    ADD CONSTRAINT chk_shipment_parties CHECK (sender_party_id <> receiver_party_id);

PROMPT All Referential and Check Constraints applied successfully.
PROMPT ===================================================;
