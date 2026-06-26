import { describe, expect, it, vi } from "vitest";

const { mockCreate, mockDeleteMany, mockAuditLog } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockAuditLog: vi.fn(),
}));

vi.mock("@/infrastructure/db/prisma", () => {
  const mockPrisma = {
    championshipRegistration: {
      findMany: vi.fn(async () => [
        { id: "reg1", weightKg: 70, fightClass: "AMATEUR", trainee: { gender: "MALE" } },
        { id: "reg2", weightKg: 75, fightClass: "AMATEUR", trainee: { gender: "MALE" } },
        { id: "reg3", weightKg: 80, fightClass: "AMATEUR", trainee: { gender: "MALE" } },
        { id: "reg4", weightKg: 72, fightClass: "AMATEUR", trainee: { gender: "MALE" } },
        { id: "reg5", weightKg: 65, fightClass: "PROFESSIONAL", trainee: { gender: "FEMALE" } },
        { id: "reg6", weightKg: 68, fightClass: "PROFESSIONAL", trainee: { gender: "FEMALE" } },
      ]),
    },
    match: {
      deleteMany: mockDeleteMany,
      create: mockCreate,
    },
    auditLog: {
      create: mockAuditLog,
    },
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Import after mock
import { runAutomatedMatchmaking } from "@/application/championships/service";

describe("Automated Matchmaking Engine", () => {
  it("groups, sorts by weight, and pairs adjacent fighters of same class and gender", async () => {
    mockCreate.mockClear();
    mockDeleteMany.mockClear();

    await runAutomatedMatchmaking("champ-1", "actor-1");

    // Check deleteMany was called for old matches of champ-1
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { championshipId: "champ-1" } });

    // In AMATEUR MALE we have:
    // Let's list AMATEUR MALE by weight:
    // reg1: 70kg, reg4: 72kg, reg2: 75kg, reg3: 80kg
    // Pairs should be:
    // Pair 1: reg1 (70) and reg4 (72) -> average 71 kg
    // Pair 2: reg2 (75) and reg3 (80) -> average 78 kg
    // In PROFESSIONAL FEMALE we have:
    // reg5: 65kg, reg6: 68kg -> average 67 kg
    // Pair 3: reg5 (65) and reg6 (68)

    expect(mockCreate).toHaveBeenCalledTimes(3);

    // Verify match creation args
    const calls = mockCreate.mock.calls;
    const weightClasses = calls.map((c: any) => c[0].data.weightClass);
    
    expect(weightClasses).toContain("71 kg");
    expect(weightClasses).toContain("78 kg");
    expect(weightClasses).toContain("67 kg");
  });
});
