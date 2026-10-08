-- ============================================================================
-- SCRIPT: 00_run_all.sql
-- PROJECT: MedLedger DBMS - University DA2 Project
-- PURPOSE: Master execution script to run all database scripts sequentially.
-- USAGE IN SQL*PLUS / SQL DEVELOPER:
--    @database/00_run_all.sql
-- ============================================================================

PROMPT ============================================================================;
PROMPT            STARTING FULL MEDLEDGER DATABASE INITIALIZATION                  ;
PROMPT ============================================================================;

PROMPT [1/6] Running 01_drop_tables.sql...;
@@01_drop_tables.sql;

PROMPT [2/6] Running 02_create_tables.sql...;
@@02_create_tables.sql;

PROMPT [3/6] Running 03_constraints.sql...;
@@03_constraints.sql;

PROMPT [4/6] Running 04_insert_data.sql...;
@@04_insert_data.sql;

PROMPT [5/6] Running 05_queries.sql...;
@@05_queries.sql;

PROMPT [6/6] Running 06_plsql.sql...;
@@06_plsql.sql;

PROMPT [DEMO] Running 07_demo.sql...;
@@07_demo.sql;

PROMPT ============================================================================;
PROMPT       MEDLEDGER DATABASE INITIALIZATION & VERIFICATION COMPLETED!           ;
PROMPT ============================================================================;
