-- CARMART Broker Portal: development/test finance data only.
-- Run ONLY after verified pg_dump backup and matching database confirmation.
-- psql -v ON_ERROR_STOP=1 -f this-file.sql
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

-- Capture keys for inspection in this transaction. The PowerShell wrapper
-- separately exports a durable storage-key manifest before running this SQL.
CREATE TEMP TABLE reset_application_ids ON COMMIT DROP AS
  SELECT "id" FROM "FinanceApplication";
CREATE TEMP TABLE reset_document_ids ON COMMIT DROP AS
  SELECT "id" FROM "FinanceDocument"
  WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);

-- Dependent deletion/audit records first; do not delete PortalUser,
-- Brokerage, BrokerConsentDocument, or legacy Lead/Appointment tables.
DELETE FROM "FinanceDeletionDocument"
 WHERE "deletionAuditId" IN (
   SELECT "id" FROM "FinanceDeletionAudit"
   WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids)
 );
DELETE FROM "FinanceDeletionAudit"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "DocumentAccessLog"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids)
    OR "documentId" IN (SELECT "id" FROM reset_document_ids);
DELETE FROM "ApplicationEditAuditLog"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "FinanceStatusHistory"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "StaffAssignmentHistory"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "BrokerAssignmentHistory"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "PrivacyRequest"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "BrokerConsentRequest"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "BrokerConsentToken"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);

-- Both SMS classes are specific to the development finance workflows.
-- This also clears pre-application finance-link SMS messages without an
-- applicationId, preserving SMS messages of other types.
DELETE FROM "SmsMessage"
 WHERE "messageType" IN ('FINANCE_APPLICATION_LINK', 'BROKER_CONSENT')
    OR "applicationId" IN (SELECT "id" FROM reset_application_ids);

-- Unconsumed link prefills may not have an applicationId.
DELETE FROM "FinanceLinkPrefill";
DELETE FROM "FinanceDocument"
 WHERE "applicationId" IN (SELECT "id" FROM reset_application_ids);
DELETE FROM "FinanceApplication"
 WHERE "id" IN (SELECT "id" FROM reset_application_ids);

-- Abort transaction if unexpected linked data remains.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "FinanceApplication") OR
     EXISTS (SELECT 1 FROM "FinanceDocument") OR
     EXISTS (SELECT 1 FROM "BrokerConsentRequest") THEN
    RAISE EXCEPTION 'Finance reset verification failed; rolling back';
  END IF;
END $$;
COMMIT;
