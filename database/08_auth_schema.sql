-- ============================================================================
-- SCRIPT: 08_auth_schema.sql
-- PROJECT: MedLedger — Pharmaceutical Supply Chain Intelligence
-- PURPOSE: User Authentication, Role-Based Access Control, and Audit Logging
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

PROMPT ===================================================;
PROMPT Creating MedLedger Authentication & Security Tables...;
PROMPT ===================================================;

-- 1. USERS Table
CREATE TABLE USERS (
    user_id             NUMBER(10)          NOT NULL,
    name                VARCHAR2(100)       NOT NULL,
    email               VARCHAR2(150)       NOT NULL,
    password_hash       VARCHAR2(255)       NOT NULL,
    role                VARCHAR2(30)        NOT NULL,
    party_id            NUMBER(10),         -- Associated organization / party
    status              VARCHAR2(30)        DEFAULT 'PENDING' NOT NULL,
    requested_role      VARCHAR2(30),
    requested_org_name  VARCHAR2(100),
    organization_details VARCHAR2(500),
    created_at          DATE                DEFAULT SYSDATE NOT NULL,
    approved_at         DATE,
    approved_by         NUMBER(10),
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT chk_user_role CHECK (role IN ('ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR')),
    CONSTRAINT chk_user_status CHECK (status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
    CONSTRAINT fk_user_party FOREIGN KEY (party_id) REFERENCES PARTY(party_id) ON DELETE SET NULL,
    CONSTRAINT fk_user_approver FOREIGN KEY (approved_by) REFERENCES USERS(user_id) ON DELETE SET NULL
);

-- 2. AUDIT_LOG Table
CREATE TABLE AUDIT_LOG (
    log_id              NUMBER(10)          NOT NULL,
    user_id             NUMBER(10),
    user_email          VARCHAR2(150),
    action              VARCHAR2(100)       NOT NULL,
    entity_type         VARCHAR2(50),
    entity_id           VARCHAR2(100),
    details             VARCHAR2(1000),
    ip_address          VARCHAR2(50),
    created_at          DATE                DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_audit_log PRIMARY KEY (log_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

-- Sequences
CREATE SEQUENCE seq_user_id   START WITH 100 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_audit_id  START WITH 100 INCREMENT BY 1 NOCACHE;

PROMPT USERS and AUDIT_LOG tables and sequences created successfully.
PROMPT ===================================================;
