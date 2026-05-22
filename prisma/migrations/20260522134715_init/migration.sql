-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HEAD_COACH', 'COACH', 'INTERN', 'TRAINEE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('AR', 'EN');

-- CreateEnum
CREATE TYPE "Ownership" AS ENUM ('CSK_OWNED', 'PARTNER', 'PATRONAGE');

-- CreateEnum
CREATE TYPE "DisciplineCategory" AS ENUM ('BOXING', 'KICKBOXING', 'MMA', 'KARATE', 'FITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "LevelBand" AS ENUM ('N', 'A', 'B', 'C');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SessionPlanStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "EvaluationPeriod" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MonthlyReportStatus" AS ENUM ('DRAFT', 'APPROVED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('SUBSCRIPTION', 'PRIVATE_SESSION', 'BELT_EXAM', 'CHAMPIONSHIP', 'MERCHANDISE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'VODAFONE_CASH', 'BANK_TRANSFER', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitRecipientType" AS ENUM ('CSK', 'VENUE', 'COACH', 'FEDERATION', 'TAX_ADMIN', 'DISCIPLINE_OWNER');

-- CreateEnum
CREATE TYPE "ChampRegistrationStatus" AS ENUM ('OPTED_IN', 'COACH_CONFIRMED', 'PAID', 'WITHDREW');

-- CreateEnum
CREATE TYPE "FightOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW', 'NO_CONTEST');

-- CreateEnum
CREATE TYPE "FightMethod" AS ENUM ('KO', 'TKO', 'DECISION', 'SUBMISSION', 'DQ', 'OTHER');

-- CreateEnum
CREATE TYPE "BeltExamResultStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "MedicalDocType" AS ENUM ('CLEARANCE', 'ECG', 'BLOOD', 'VISION', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalDocStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "CertificateAwardType" AS ENUM ('BEST_TRAINEE_GROUP', 'BEST_TRAINEE_LOCATION', 'BEST_COACH_LOCATION', 'BELT_PROGRESSION', 'CHAMPIONSHIP', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "fullNameEn" TEXT NOT NULL,
    "gender" "Gender",
    "dob" TIMESTAMP(3),
    "profilePhotoUrl" TEXT,
    "nationalId" TEXT,
    "homeAddress" TEXT,
    "emergencyContact" JSONB,
    "preferredLocale" "Locale" NOT NULL DEFAULT 'AR',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "notificationOptOuts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notificationsReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "parentManaged" BOOLEAN NOT NULL DEFAULT false,
    "parentUserId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "ownership" "Ownership" NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "openingHours" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "category" "DisciplineCategory" NOT NULL,
    "skillsTaxonomy" JSONB NOT NULL,
    "ownerUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSplitRule" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "disciplineId" TEXT,
    "revenueType" "RevenueType" NOT NULL,
    "venuePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cskPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "coachPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "otherPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "otherLabel" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationSplitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "levelBand" "LevelBand",
    "ageBandMin" INTEGER,
    "ageBandMax" INTEGER,
    "primaryCoachId" TEXT,
    "internId" TEXT,
    "schedule" JSONB NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternAssignment" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "groupId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InternAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "monthlyFee" DECIMAL(12,2) NOT NULL,
    "sessionsPerMonth" INTEGER NOT NULL DEFAULT 12,
    "discountPercent" DECIMAL(5,2),
    "discountReason" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DUE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingUnit" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "category" TEXT NOT NULL,
    "targetBodyParts" TEXT[],
    "targetSkills" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "recommendedDurationSeconds" INTEGER,
    "recommendedRounds" INTEGER,
    "recommendedRoundDurationSec" INTEGER,
    "equipmentRequired" TEXT[],
    "demoMediaUrl" TEXT,
    "demoMediaType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingUnitDiscipline" (
    "trainingUnitId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,

    CONSTRAINT "TrainingUnitDiscipline_pkey" PRIMARY KEY ("trainingUnitId","disciplineId")
);

-- CreateTable
CREATE TABLE "TrainingUnitVersion" (
    "id" TEXT NOT NULL,
    "trainingUnitId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingUnitVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" "SessionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "unitsSequence" JSONB NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionComment" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "groupId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "internId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "executedSequence" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "arrivalTime" TIMESTAMP(3),
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickEvaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "effortScore" INTEGER NOT NULL,
    "notes" TEXT,
    "flaggedBodyPart" TEXT,
    "flaggedSkill" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailedEvaluation" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "contextGroupId" TEXT,
    "evaluationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" "EvaluationPeriod" NOT NULL,
    "bodyPartScores" JSONB NOT NULL,
    "skillScores" JSONB NOT NULL,
    "summaryComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetailedEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachEvaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" "DailyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "incidents" TEXT,
    "headCoachNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "attendanceSummary" JSONB NOT NULL,
    "evaluationSummary" JSONB NOT NULL,
    "milestones" JSONB NOT NULL,
    "narrative" TEXT,
    "status" "MonthlyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "pdfUrl" TEXT,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "revenueType" "RevenueType" NOT NULL,
    "referenceId" TEXT,
    "payerUserId" TEXT NOT NULL,
    "amountGross" DECIMAL(12,2) NOT NULL,
    "amountNet" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "method" "PaymentMethod" NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedById" TEXT NOT NULL,
    "notes" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundOfId" TEXT,
    "subscriptionId" TEXT,
    "privateSessionId" TEXT,
    "championshipRegId" TEXT,
    "beltExamResultId" TEXT,
    "merchandiseSaleId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "revenueType" "RevenueType" NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerData" JSONB,
    "subscriptionId" TEXT,
    "privateSessionId" TEXT,
    "championshipRegId" TEXT,
    "beltExamResultId" TEXT,
    "merchandiseSaleId" TEXT,
    "locationId" TEXT,
    "coachUserId" TEXT,
    "disciplineId" TEXT,
    "paymentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSplit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "recipientType" "SplitRecipientType" NOT NULL,
    "recipientUserId" TEXT,
    "recipientLocationId" TEXT,
    "recipientLabel" TEXT,
    "percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachContract" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "locationId" TEXT,
    "disciplineId" TEXT,
    "subscriptionPercent" DECIMAL(5,2),
    "privateSessionPercent" DECIMAL(5,2),
    "privateSessionFixedRate" DECIMAL(12,2),
    "beltExamPercent" DECIMAL(5,2),
    "championshipPercent" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateSession" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "fee" DECIMAL(12,2) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Championship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "locationLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "disciplines" TEXT[],
    "weightCategories" JSONB NOT NULL,
    "ageCategories" JSONB NOT NULL,
    "allowedLevels" "LevelBand"[],
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "registrationFee" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Championship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionshipRegistration" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "weightKg" DECIMAL(5,2),
    "ageAtRegistration" INTEGER,
    "isAmateur" BOOLEAN NOT NULL DEFAULT true,
    "level" "LevelBand",
    "targetWeightClass" TEXT,
    "weightCutNotes" TEXT,
    "status" "ChampRegistrationStatus" NOT NULL DEFAULT 'OPTED_IN',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionshipRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FightResult" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "outcome" "FightOutcome" NOT NULL,
    "method" "FightMethod",
    "round" INTEGER,
    "timeInRound" TEXT,
    "videoUrl" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FightResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeltExam" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "examinerName" TEXT NOT NULL,
    "federation" TEXT NOT NULL,
    "fee" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeltExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeltExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "result" "BeltExamResultStatus" NOT NULL,
    "score" DECIMAL(5,2),
    "newLevel" "LevelBand",
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeltExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "bloodType" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "currentMedications" TEXT,
    "primaryPhysicianName" TEXT,
    "primaryPhysicianPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalDocument" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "documentType" "MedicalDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "issuingDoctor" TEXT,
    "status" "MedicalDocStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchandiseItem" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "photos" TEXT[],
    "variants" JSONB NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchandiseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchandiseSale" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "variantSku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "customerUserId" TEXT,
    "locationId" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldById" TEXT NOT NULL,

    CONSTRAINT "MerchandiseSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "awardType" "CertificateAwardType" NOT NULL,
    "groupId" TEXT,
    "periodYear" INTEGER,
    "periodMonth" INTEGER,
    "narrative" TEXT,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "tokenPrefix" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Location_active_idx" ON "Location"("active");

-- CreateIndex
CREATE INDEX "Discipline_category_idx" ON "Discipline"("category");

-- CreateIndex
CREATE INDEX "LocationSplitRule_locationId_revenueType_idx" ON "LocationSplitRule"("locationId", "revenueType");

-- CreateIndex
CREATE UNIQUE INDEX "LocationSplitRule_locationId_disciplineId_revenueType_effec_key" ON "LocationSplitRule"("locationId", "disciplineId", "revenueType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Group_locationId_active_idx" ON "Group"("locationId", "active");

-- CreateIndex
CREATE INDEX "Group_disciplineId_idx" ON "Group"("disciplineId");

-- CreateIndex
CREATE INDEX "InternAssignment_coachId_idx" ON "InternAssignment"("coachId");

-- CreateIndex
CREATE INDEX "InternAssignment_internId_idx" ON "InternAssignment"("internId");

-- CreateIndex
CREATE INDEX "Enrollment_groupId_status_idx" ON "Enrollment"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_traineeId_groupId_startDate_key" ON "Enrollment"("traineeId", "groupId", "startDate");

-- CreateIndex
CREATE INDEX "Subscription_traineeId_active_idx" ON "Subscription"("traineeId", "active");

-- CreateIndex
CREATE INDEX "Subscription_paymentStatus_idx" ON "Subscription"("paymentStatus");

-- CreateIndex
CREATE INDEX "TrainingUnit_category_idx" ON "TrainingUnit"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingUnitVersion_trainingUnitId_version_key" ON "TrainingUnitVersion"("trainingUnitId", "version");

-- CreateIndex
CREATE INDEX "SessionPlan_groupId_sessionDate_idx" ON "SessionPlan"("groupId", "sessionDate");

-- CreateIndex
CREATE INDEX "SessionPlan_status_idx" ON "SessionPlan"("status");

-- CreateIndex
CREATE INDEX "Session_groupId_scheduledStart_idx" ON "Session"("groupId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Session_coachId_scheduledStart_idx" ON "Session"("coachId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Attendance_traineeId_idx" ON "Attendance"("traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_traineeId_key" ON "Attendance"("sessionId", "traineeId");

-- CreateIndex
CREATE INDEX "QuickEvaluation_traineeId_createdAt_idx" ON "QuickEvaluation"("traineeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuickEvaluation_sessionId_traineeId_key" ON "QuickEvaluation"("sessionId", "traineeId");

-- CreateIndex
CREATE INDEX "DetailedEvaluation_traineeId_evaluationDate_idx" ON "DetailedEvaluation"("traineeId", "evaluationDate");

-- CreateIndex
CREATE INDEX "CoachEvaluation_coachId_createdAt_idx" ON "CoachEvaluation"("coachId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachEvaluation_sessionId_traineeId_key" ON "CoachEvaluation"("sessionId", "traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_sessionId_key" ON "DailyReport"("sessionId");

-- CreateIndex
CREATE INDEX "DailyReport_groupId_status_idx" ON "DailyReport"("groupId", "status");

-- CreateIndex
CREATE INDEX "DailyReport_status_submittedAt_idx" ON "DailyReport"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "MonthlyReport_status_idx" ON "MonthlyReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_traineeId_periodYear_periodMonth_key" ON "MonthlyReport"("traineeId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_revenueType_paidAt_idx" ON "Payment"("revenueType", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_payerUserId_idx" ON "Payment"("payerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_paymentId_key" ON "PaymentIntent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_createdAt_idx" ON "PaymentIntent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_payerUserId_idx" ON "PaymentIntent"("payerUserId");

-- CreateIndex
CREATE INDEX "PaymentIntent_providerOrderId_idx" ON "PaymentIntent"("providerOrderId");

-- CreateIndex
CREATE INDEX "RevenueSplit_paymentId_idx" ON "RevenueSplit"("paymentId");

-- CreateIndex
CREATE INDEX "RevenueSplit_recipientUserId_idx" ON "RevenueSplit"("recipientUserId");

-- CreateIndex
CREATE INDEX "CoachContract_coachId_active_idx" ON "CoachContract"("coachId", "active");

-- CreateIndex
CREATE INDEX "CoachContract_locationId_disciplineId_idx" ON "CoachContract"("locationId", "disciplineId");

-- CreateIndex
CREATE INDEX "PrivateSession_traineeId_scheduledStart_idx" ON "PrivateSession"("traineeId", "scheduledStart");

-- CreateIndex
CREATE INDEX "PrivateSession_coachId_scheduledStart_idx" ON "PrivateSession"("coachId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Championship_startDate_idx" ON "Championship"("startDate");

-- CreateIndex
CREATE INDEX "ChampionshipRegistration_traineeId_idx" ON "ChampionshipRegistration"("traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipRegistration_championshipId_traineeId_key" ON "ChampionshipRegistration"("championshipId", "traineeId");

-- CreateIndex
CREATE INDEX "FightResult_registrationId_idx" ON "FightResult"("registrationId");

-- CreateIndex
CREATE INDEX "BeltExam_examDate_idx" ON "BeltExam"("examDate");

-- CreateIndex
CREATE INDEX "BeltExamResult_traineeId_recordedAt_idx" ON "BeltExamResult"("traineeId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BeltExamResult_examId_traineeId_key" ON "BeltExamResult"("examId", "traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_traineeId_key" ON "MedicalRecord"("traineeId");

-- CreateIndex
CREATE INDEX "MedicalDocument_traineeId_expiryDate_idx" ON "MedicalDocument"("traineeId", "expiryDate");

-- CreateIndex
CREATE INDEX "MedicalDocument_status_expiryDate_idx" ON "MedicalDocument"("status", "expiryDate");

-- CreateIndex
CREATE INDEX "MerchandiseItem_active_idx" ON "MerchandiseItem"("active");

-- CreateIndex
CREATE INDEX "MerchandiseSale_soldAt_idx" ON "MerchandiseSale"("soldAt");

-- CreateIndex
CREATE INDEX "MerchandiseSale_itemId_idx" ON "MerchandiseSale"("itemId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Certificate_recipientId_issuedAt_idx" ON "Certificate"("recipientId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_userId_revokedAt_idx" ON "ApiToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSplitRule" ADD CONSTRAINT "LocationSplitRule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSplitRule" ADD CONSTRAINT "LocationSplitRule_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_primaryCoachId_fkey" FOREIGN KEY ("primaryCoachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternAssignment" ADD CONSTRAINT "InternAssignment_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternAssignment" ADD CONSTRAINT "InternAssignment_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternAssignment" ADD CONSTRAINT "InternAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUnit" ADD CONSTRAINT "TrainingUnit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUnitDiscipline" ADD CONSTRAINT "TrainingUnitDiscipline_trainingUnitId_fkey" FOREIGN KEY ("trainingUnitId") REFERENCES "TrainingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUnitDiscipline" ADD CONSTRAINT "TrainingUnitDiscipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingUnitVersion" ADD CONSTRAINT "TrainingUnitVersion_trainingUnitId_fkey" FOREIGN KEY ("trainingUnitId") REFERENCES "TrainingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SessionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickEvaluation" ADD CONSTRAINT "QuickEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickEvaluation" ADD CONSTRAINT "QuickEvaluation_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickEvaluation" ADD CONSTRAINT "QuickEvaluation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailedEvaluation" ADD CONSTRAINT "DetailedEvaluation_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailedEvaluation" ADD CONSTRAINT "DetailedEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEvaluation" ADD CONSTRAINT "CoachEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEvaluation" ADD CONSTRAINT "CoachEvaluation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEvaluation" ADD CONSTRAINT "CoachEvaluation_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_refundOfId_fkey" FOREIGN KEY ("refundOfId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_privateSessionId_fkey" FOREIGN KEY ("privateSessionId") REFERENCES "PrivateSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_championshipRegId_fkey" FOREIGN KEY ("championshipRegId") REFERENCES "ChampionshipRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_beltExamResultId_fkey" FOREIGN KEY ("beltExamResultId") REFERENCES "BeltExamResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_merchandiseSaleId_fkey" FOREIGN KEY ("merchandiseSaleId") REFERENCES "MerchandiseSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_recipientLocationId_fkey" FOREIGN KEY ("recipientLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachContract" ADD CONSTRAINT "CoachContract_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachContract" ADD CONSTRAINT "CoachContract_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachContract" ADD CONSTRAINT "CoachContract_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateSession" ADD CONSTRAINT "PrivateSession_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateSession" ADD CONSTRAINT "PrivateSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateSession" ADD CONSTRAINT "PrivateSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Championship" ADD CONSTRAINT "Championship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRegistration" ADD CONSTRAINT "ChampionshipRegistration_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipRegistration" ADD CONSTRAINT "ChampionshipRegistration_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightResult" ADD CONSTRAINT "FightResult_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "ChampionshipRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightResult" ADD CONSTRAINT "FightResult_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeltExam" ADD CONSTRAINT "BeltExam_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeltExamResult" ADD CONSTRAINT "BeltExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "BeltExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeltExamResult" ADD CONSTRAINT "BeltExamResult_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeltExamResult" ADD CONSTRAINT "BeltExamResult_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseSale" ADD CONSTRAINT "MerchandiseSale_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MerchandiseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseSale" ADD CONSTRAINT "MerchandiseSale_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseSale" ADD CONSTRAINT "MerchandiseSale_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseSale" ADD CONSTRAINT "MerchandiseSale_soldById_fkey" FOREIGN KEY ("soldById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
