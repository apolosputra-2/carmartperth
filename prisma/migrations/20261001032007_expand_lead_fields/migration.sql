-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "contractSignedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "lostAt" TIMESTAMP(3),
ADD COLUMN     "wonAt" TIMESTAMP(3);
