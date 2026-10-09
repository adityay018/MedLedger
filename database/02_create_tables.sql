-- ============================================================================
-- SCRIPT: 02_create_tables.sql
-- PROJECT: MedLedger — Pharmaceutical Supply Chain Intelligence
-- PURPOSE: Create the 13 base relations matching the BCNF/EER specification.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

PROMPT ===================================================;
PROMPT Creating MedLedger Base Tables (BCNF Schema)...;
PROMPT ===================================================;

-- 1. PARTY (Superclass)
CREATE TABLE PARTY (
    party_id            NUMBER(10)          NOT NULL,
    party_name          VARCHAR2(100)       NOT NULL,
    address             VARCHAR2(255)       NOT NULL,
    phone               VARCHAR2(20)        NOT NULL,
    email               VARCHAR2(100)       NOT NULL,
    CONSTRAINT pk_party PRIMARY KEY (party_id)
);

-- 2. MANUFACTURER (Subclass of PARTY)
CREATE TABLE MANUFACTURER (
    party_id                    NUMBER(10)      NOT NULL,
    manufacturing_license_no    VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_manufacturer PRIMARY KEY (party_id),
    CONSTRAINT uq_mfg_license UNIQUE (manufacturing_license_no)
);

-- 3. DISTRIBUTOR (Subclass of PARTY)
CREATE TABLE DISTRIBUTOR (
    party_id                    NUMBER(10)      NOT NULL,
    distributor_license_no      VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_distributor PRIMARY KEY (party_id),
    CONSTRAINT uq_dist_license UNIQUE (distributor_license_no)
);

-- 4. PHARMACY (Subclass of PARTY)
CREATE TABLE PHARMACY (
    party_id                    NUMBER(10)      NOT NULL,
    pharmacy_license_no         VARCHAR2(50)    NOT NULL,
    hq                          VARCHAR2(100)   NOT NULL,
    CONSTRAINT pk_pharmacy PRIMARY KEY (party_id),
    CONSTRAINT uq_pharm_license UNIQUE (pharmacy_license_no)
);

-- 5. REGULATOR (Subclass of PARTY)
CREATE TABLE REGULATOR (
    party_id            NUMBER(10)      NOT NULL,
    regulator_code      VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_regulator PRIMARY KEY (party_id),
    CONSTRAINT uq_reg_code UNIQUE (regulator_code)
);

-- 6. DRUG (Base Product Catalog)
CREATE TABLE DRUG (
    drug_id             NUMBER(10)      NOT NULL,
    drug_name           VARCHAR2(100)   NOT NULL,
    description         VARCHAR2(500),
    strength            VARCHAR2(50)    NOT NULL,
    dosage_form         VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_drug PRIMARY KEY (drug_id)
);

-- 7. RECALL (Regulatory & Manufacturer Product Recalls)
CREATE TABLE RECALL (
    recall_id           NUMBER(10)      NOT NULL,
    recall_date         DATE            NOT NULL,
    status              VARCHAR2(30)    NOT NULL,
    reason              VARCHAR2(255)   NOT NULL,
    CONSTRAINT pk_recall PRIMARY KEY (recall_id)
);

-- 8. BATCH (Manufactured Lots of Drugs)
CREATE TABLE BATCH (
    batch_id            NUMBER(10)      NOT NULL,
    drug_id             NUMBER(10)      NOT NULL,
    manufacturer_id     NUMBER(10)      NOT NULL,
    recall_id           NUMBER(10),     -- Nullable: only filled if batch is recalled
    batch_status        VARCHAR2(30)    NOT NULL,
    manufacture_date    DATE            NOT NULL,
    CONSTRAINT pk_batch PRIMARY KEY (batch_id)
);

-- 9. QUALITY_TEST (Laboratory Assay & Verification for Batches)
CREATE TABLE QUALITY_TEST (
    test_id             NUMBER(10)      NOT NULL,
    batch_id            NUMBER(10)      NOT NULL,
    test_date           DATE            NOT NULL,
    test_type           VARCHAR2(50)    NOT NULL,
    result              VARCHAR2(100)   NOT NULL,
    status              VARCHAR2(30)    NOT NULL,
    CONSTRAINT pk_quality_test PRIMARY KEY (test_id)
);

-- 10. DISPENSING (Counter Dispensing Event at Pharmacy to Patient)
CREATE TABLE DISPENSING (
    dispense_id         NUMBER(10)      NOT NULL,
    pharmacy_id         NUMBER(10)      NOT NULL,
    dispensed_at        DATE            NOT NULL,
    patient_id          VARCHAR2(50)    NOT NULL,
    quantity            NUMBER(10)      NOT NULL,
    remarks             VARCHAR2(255),
    CONSTRAINT pk_dispensing PRIMARY KEY (dispense_id)
);

-- 11. PACKAGE (Serialized Unit in Supply Chain with QR Code)
CREATE TABLE PACKAGE (
    package_id          NUMBER(10)      NOT NULL,
    batch_id            NUMBER(10)      NOT NULL,
    dispense_id         NUMBER(10),     -- Nullable: populated upon retail dispensing
    package_size        VARCHAR2(50)    NOT NULL,
    packaged_at         DATE            NOT NULL,
    qr_code             VARCHAR2(100)   NOT NULL,
    status              VARCHAR2(30)    NOT NULL,
    quantity_total      NUMBER(10)      NOT NULL,
    CONSTRAINT pk_package PRIMARY KEY (package_id),
    CONSTRAINT uq_package_qr UNIQUE (qr_code)
);

-- 12. SHIPMENT (Custody Transfer between Supply Chain Parties)
CREATE TABLE SHIPMENT (
    shipment_id         NUMBER(10)      NOT NULL,
    sender_party_id     NUMBER(10)      NOT NULL,
    receiver_party_id   NUMBER(10)      NOT NULL,
    shipment_date       DATE            NOT NULL,
    status              VARCHAR2(30)    NOT NULL,
    mode                VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_shipment PRIMARY KEY (shipment_id)
);

-- 13. CONTAINS (M:N Bridge: Packages in a Shipment)
CREATE TABLE CONTAINS (
    package_id          NUMBER(10)      NOT NULL,
    shipment_id         NUMBER(10)      NOT NULL,
    CONSTRAINT pk_contains PRIMARY KEY (package_id, shipment_id)
);

-- Sequences for generating primary keys
CREATE SEQUENCE seq_party_id    START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_drug_id     START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_batch_id    START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_test_id     START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_recall_id   START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_package_id  START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_shipment_id START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_dispense_id START WITH 100 INCREMENT BY 1 NOCACHE;

PROMPT All 13 MedLedger tables created successfully.
PROMPT ===================================================;
