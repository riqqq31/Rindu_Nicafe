"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Validation
  if (!username || !password) {
    return { error: "Username dan password harus diisi." };
  }

  // Find user in database
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { error: "Username atau password salah." };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Username atau password salah." };
  }

  // Create session
  await createSession({
    userId: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
  });

  // Redirect based on role
  if (user.role === "owner") {
    redirect("/owner");
  } else {
    redirect("/karyawan");
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
