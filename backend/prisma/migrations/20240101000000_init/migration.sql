-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REPORTING_DONE', 'REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED');

-- CreateEnum
CREATE TYPE "CyclePhase" AS ENUM ('GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT,
    "employeeCode" TEXT,
    "reportingOfficerId" TEXT,
    "reviewingOfficerId" TEXT,
    "acceptingOfficerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "phase" "CyclePhase" NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpaGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weightage" DOUBLE PRECISION NOT NULL,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpaGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidYearReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "progress" TEXT NOT NULL,
    "selfRating" DOUBLE PRECISION,
    "reportingRemarks" TEXT,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MidYearReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualAppraisal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "achievements" TEXT,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT',
    "kpaScore" DOUBLE PRECISION,
    "valuesScore" DOUBLE PRECISION,
    "competenciesScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "ratingBand" TEXT,
    "reportingRemarks" TEXT,
    "reviewingRemarks" TEXT,
    "acceptingRemarks" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reportingDoneAt" TIMESTAMP(3),
    "reviewingDoneAt" TIMESTAMP(3),
    "acceptingDoneAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnnualAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpaRating" (
    "id" TEXT NOT NULL,
    "annualAppraisalId" TEXT NOT NULL,
    "kpaGoalId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "ratedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpaRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttributeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeRating" (
    "id" TEXT NOT NULL,
    "annualAppraisalId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "ratedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttributeRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");
CREATE UNIQUE INDEX "MidYearReview_userId_cycleId_key" ON "MidYearReview"("userId", "cycleId");
CREATE UNIQUE INDEX "AnnualAppraisal_userId_cycleId_key" ON "AnnualAppraisal"("userId", "cycleId");
CREATE UNIQUE INDEX "KpaRating_annualAppraisalId_kpaGoalId_key" ON "KpaRating"("annualAppraisalId", "kpaGoalId");
CREATE UNIQUE INDEX "AttributeRating_annualAppraisalId_attributeId_key" ON "AttributeRating"("annualAppraisalId", "attributeId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_department_idx" ON "User"("department");
CREATE INDEX "AppraisalCycle_year_idx" ON "AppraisalCycle"("year");
CREATE INDEX "AppraisalCycle_status_idx" ON "AppraisalCycle"("status");
CREATE INDEX "KpaGoal_userId_cycleId_idx" ON "KpaGoal"("userId", "cycleId");
CREATE INDEX "MidYearReview_userId_cycleId_idx" ON "MidYearReview"("userId", "cycleId");
CREATE INDEX "AnnualAppraisal_userId_cycleId_idx" ON "AnnualAppraisal"("userId", "cycleId");
CREATE INDEX "AnnualAppraisal_status_idx" ON "AnnualAppraisal"("status");
CREATE INDEX "AttributeMaster_type_idx" ON "AttributeMaster"("type");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_reportingOfficerId_fkey" FOREIGN KEY ("reportingOfficerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KpaGoal" ADD CONSTRAINT "KpaGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KpaGoal" ADD CONSTRAINT "KpaGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MidYearReview" ADD CONSTRAINT "MidYearReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MidYearReview" ADD CONSTRAINT "MidYearReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnnualAppraisal" ADD CONSTRAINT "AnnualAppraisal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnnualAppraisal" ADD CONSTRAINT "AnnualAppraisal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KpaRating" ADD CONSTRAINT "KpaRating_annualAppraisalId_fkey" FOREIGN KEY ("annualAppraisalId") REFERENCES "AnnualAppraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KpaRating" ADD CONSTRAINT "KpaRating_kpaGoalId_fkey" FOREIGN KEY ("kpaGoalId") REFERENCES "KpaGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttributeRating" ADD CONSTRAINT "AttributeRating_annualAppraisalId_fkey" FOREIGN KEY ("annualAppraisalId") REFERENCES "AnnualAppraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttributeRating" ADD CONSTRAINT "AttributeRating_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
