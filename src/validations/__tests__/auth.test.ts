import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/validations/auth";

describe("Auth Validation Schemas", () => {
  // TC-VAL-AUTH-01: loginSchema valid input
  it("TC-VAL-AUTH-01: parses valid login input cleanly", () => {
    const valid = { email: "learner@example.com", password: "Password123" };
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("learner@example.com");
    }
  });

  // TC-VAL-AUTH-02: loginSchema rejects empty email
  it("TC-VAL-AUTH-02: rejects empty or blank email", () => {
    const result = loginSchema.safeParse({ email: "   ", password: "Password123" });
    expect(result.success).toBe(false);
  });

  // TC-VAL-AUTH-03: loginSchema rejects invalid email format
  it("TC-VAL-AUTH-03: rejects malformed email strings", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "Password123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Địa chỉ email không hợp lệ");
    }
  });

  // TC-VAL-AUTH-04: loginSchema rejects password < 6 chars
  it("TC-VAL-AUTH-04: rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({ email: "learner@example.com", password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Mật khẩu phải có ít nhất 6 ký tự");
    }
  });

  // TC-VAL-AUTH-05: registerSchema valid input
  it("TC-VAL-AUTH-05: parses valid registration input cleanly", () => {
    const valid = {
      name: "Nguyễn Văn A",
      email: "learner.valid@example.com",
      password: "StrongPassword1",
      confirmPassword: "StrongPassword1",
    };
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  // TC-VAL-AUTH-06: registerSchema rejects mismatched password confirmation
  it("TC-VAL-AUTH-06: rejects mismatched confirmPassword", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "learner@example.com",
      password: "StrongPassword1",
      confirmPassword: "DifferentPassword2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Mật khẩu xác nhận không khớp");
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  // TC-VAL-AUTH-07: registerSchema rejects password without digits or letters
  it("TC-VAL-AUTH-07: enforces password complexity rules (letter and digit)", () => {
    const noDigits = registerSchema.safeParse({
      name: "Test User",
      email: "learner@example.com",
      password: "onlyletters",
      confirmPassword: "onlyletters",
    });
    expect(noDigits.success).toBe(false);

    const noLetters = registerSchema.safeParse({
      name: "Test User",
      email: "learner@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(noLetters.success).toBe(false);
  });

  // TC-VAL-AUTH-08: registerSchema rejects name < 2 chars or > 100 chars
  it("TC-VAL-AUTH-08: rejects name out of bounds", () => {
    const shortName = registerSchema.safeParse({
      name: "A",
      email: "learner@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(shortName.success).toBe(false);

    const longName = registerSchema.safeParse({
      name: "A".repeat(101),
      email: "learner@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(longName.success).toBe(false);
  });
});
