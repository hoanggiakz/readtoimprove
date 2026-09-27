import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";
import { requireAuth, requireAdmin } from "@/lib/security";

const { mockPrisma, mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "log-sec-1" }),
    },
  },
  mockAuth: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("Security: Authentication & Authorization Guards (FR-SEC-01, FR-SEC-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-SEC-AUTH-01: requireAuth redirects unauthenticated visitor to /login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("TC-SEC-AUTH-02: requireAuth preserves sanitized relative return URL in query parameter", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await expect(requireAuth("/me/favorites")).rejects.toThrow("REDIRECT:/login?returnUrl=%2Fme%2Ffavorites");
    expect(mockRedirect).toHaveBeenCalledWith("/login?returnUrl=%2Fme%2Ffavorites");
  });

  it("TC-SEC-AUTH-03: requireAuth neutralizes malicious open-redirect protocol-relative return URL", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await expect(requireAuth("//attacker.com/steal-token")).rejects.toThrow("REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("TC-SEC-AUTH-04: requireAuth returns session user object when user is authenticated", async () => {
    const sessionUser = {
      id: "usr-123",
      email: "learner@example.com",
      name: "Learner One",
      role: Role.USER,
    };
    mockAuth.mockResolvedValueOnce({ user: sessionUser });

    const result = await requireAuth();
    expect(result).toEqual(sessionUser);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("TC-SEC-AUTH-05: requireAdmin redirects unauthenticated visitor to /login with encoded return URL", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await expect(requireAdmin("/secure-console-x7")).rejects.toThrow("REDIRECT:/login?returnUrl=%2Fsecure-console-x7");
    expect(mockRedirect).toHaveBeenCalledWith("/login?returnUrl=%2Fsecure-console-x7");
  });

  it("TC-SEC-AUTH-06: requireAdmin rejects regular USER role, records PII-masked audit log, and throws 403", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "usr-regular", email: "student@school.edu", role: Role.USER },
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "usr-regular",
      email: "student@school.edu",
      name: "Student",
      role: Role.USER,
      isActive: true,
    });

    await expect(requireAdmin("/secure-console-x7/users")).rejects.toThrow("403 Forbidden: Administrator privileges required.");

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "usr-regular",
          action: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
          entity: "AdminConsole",
          entityId: "/secure-console-x7/users",
          details: expect.stringContaining("s*****t@school.edu"), // Masked PII
        }),
      })
    );
  });

  it("TC-SEC-AUTH-07: requireAdmin rejects inactive admin accounts even if role is ADMIN", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "usr-inactive-admin", email: "admin@example.com", role: Role.ADMIN },
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "usr-inactive-admin",
      email: "admin@example.com",
      name: "Disabled Admin",
      role: Role.ADMIN,
      isActive: false, // Disabled
    });

    await expect(requireAdmin()).rejects.toThrow("403 Forbidden");
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it("TC-SEC-AUTH-08: requireAdmin allows active ADMIN and returns verified admin user profile", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "usr-valid-admin", email: "super@readtoimprove.com", role: Role.ADMIN },
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "usr-valid-admin",
      email: "super@readtoimprove.com",
      name: "Super Admin",
      role: Role.ADMIN,
      isActive: true,
    });

    const admin = await requireAdmin();
    expect(admin).toEqual({
      id: "usr-valid-admin",
      email: "super@readtoimprove.com",
      name: "Super Admin",
      role: Role.ADMIN,
    });
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });
});
