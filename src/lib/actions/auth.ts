"use server";

import * as bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/validations/auth";
import { signSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

/**
 * Server Action: Authenticates a user, verifies password, and sets session cookie.
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: "Vui lòng kiểm tra lại thông tin đăng nhập.",
    };
  }

  const { email, password } = validation.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      message: "Email hoặc mật khẩu không chính xác.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      message: "Email hoặc mật khẩu không chính xác.",
    };
  }

  const token = await signSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(token);

  return {
    success: true,
    message: "Đăng nhập thành công!",
  };
}

/**
 * Server Action: Registers a new learner account with role USER and logs them in.
 */
export async function registerAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: "Vui lòng sửa các lỗi trong biểu mẫu.",
    };
  }

  const { name, email, password } = validation.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      errors: { email: ["Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác."] },
      message: "Email này đã được đăng ký tài khoản.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.USER,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  const token = await signSessionToken(newUser);
  await setSessionCookie(token);

  return {
    success: true,
    message: "Đăng ký tài khoản thành công!",
  };
}

/**
 * Server Action: Logs out the current user and invalidates cookie.
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}
