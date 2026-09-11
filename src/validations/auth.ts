import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email không được để trống" })
    .email({ message: "Địa chỉ email không hợp lệ" }),
  password: z
    .string()
    .min(1, { message: "Mật khẩu không được để trống" })
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Họ và tên không được để trống" })
      .min(2, { message: "Họ và tên phải có ít nhất 2 ký tự" })
      .max(100, { message: "Họ và tên tối đa 100 ký tự" }),
    email: z
      .string()
      .trim()
      .min(1, { message: "Email không được để trống" })
      .email({ message: "Địa chỉ email không hợp lệ" }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
      .regex(/[a-zA-Z]/, { message: "Mật khẩu phải chứa ít nhất một chữ cái" })
      .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất một chữ số" }),
    confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
