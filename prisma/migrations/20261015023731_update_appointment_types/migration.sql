/*
  Warnings:

  - The values [VEHICLE_VIEWING,FINANCE_CONSULTATION] on the enum `AppointmentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentType_new" AS ENUM ('TEST_DRIVE', 'VEHICLE_SELLING', 'OTHER');
ALTER TABLE "public"."Appointment" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "type" TYPE "AppointmentType_new" USING ("type"::text::"AppointmentType_new");
ALTER TYPE "AppointmentType" RENAME TO "AppointmentType_old";
ALTER TYPE "AppointmentType_new" RENAME TO "AppointmentType";
DROP TYPE "public"."AppointmentType_old";
ALTER TABLE "Appointment" ALTER COLUMN "type" SET DEFAULT 'TEST_DRIVE';
COMMIT;
