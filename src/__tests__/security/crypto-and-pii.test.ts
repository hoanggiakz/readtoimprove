import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { maskIpAddress, maskEmail } from "@/lib/security";

describe("Security: Cryptographic Hashing & PII Masking (FR-SEC-02, FR-SEC-09)", () => {
  it("TC-SEC-CRYP-01: bcrypt hashes passwords with work factor >= 12", async () => {
    const password = "SecureStudentPass2026!";
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash.length).toBeGreaterThanOrEqual(60);
  });

  it("TC-SEC-CRYP-02: bcrypt verification correctly validates valid and rejects invalid passwords", async () => {
    const password = "TargetLearnerPassword#1";
    const hash = await bcrypt.hash(password, 12);

    const validMatch = await bcrypt.compare(password, hash);
    const invalidMatch = await bcrypt.compare("WrongPassword123!", hash);

    expect(validMatch).toBe(true);
    expect(invalidMatch).toBe(false);
  });

  it("TC-SEC-CRYP-03: maskIpAddress redacts the host octet of IPv4 addresses", () => {
    expect(maskIpAddress("192.168.1.42")).toBe("192.168.1.xxx");
    expect(maskIpAddress("10.0.0.1")).toBe("10.0.0.xxx");
    expect(maskIpAddress("203.0.113.195")).toBe("203.0.113.xxx");
  });

  it("TC-SEC-CRYP-04: maskIpAddress redacts host identifiers of IPv6 addresses", () => {
    expect(maskIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3:xxxx:xxxx:xxxx");
    expect(maskIpAddress("2607:f8b0:4005:805::200e")).toBe("2607:f8b0:4005:xxxx:xxxx:xxxx");
  });

  it("TC-SEC-CRYP-05: maskIpAddress safely handles undefined, null, or empty values", () => {
    expect(maskIpAddress(null)).toBe("unknown");
    expect(maskIpAddress(undefined)).toBe("unknown");
    expect(maskIpAddress("")).toBe("unknown");
    expect(maskIpAddress("   ")).toBe("unknown");
    expect(maskIpAddress("invalid-ip")).toBe("masked");
  });

  it("TC-SEC-CRYP-06: maskEmail masks local-part characters of standard email addresses", () => {
    expect(maskEmail("student@readtoimprove.com")).toBe("s*****t@readtoimprove.com");
    expect(maskEmail("administrator@gmail.com")).toBe("a***********r@gmail.com");
    expect(maskEmail("hoang@domain.vn")).toBe("h***g@domain.vn");
  });

  it("TC-SEC-CRYP-07: maskEmail handles short email usernames (1-2 characters) gracefully", () => {
    expect(maskEmail("ab@domain.com")).toBe("a*@domain.com");
    expect(maskEmail("a@domain.com")).toBe("*@domain.com");
  });

  it("TC-SEC-CRYP-08: maskEmail returns fallback for null, undefined, or malformed email inputs", () => {
    expect(maskEmail(null)).toBe("masked@unknown");
    expect(maskEmail(undefined)).toBe("masked@unknown");
    expect(maskEmail("not-an-email")).toBe("masked@unknown");
    expect(maskEmail("")).toBe("masked@unknown");
  });
});
