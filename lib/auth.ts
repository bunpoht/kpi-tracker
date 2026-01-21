import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { createClient } from "./db"
import type { User } from "@/types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(user: User): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("Users").select("*").eq("email", email).single()

  if (error || !data) return null
  return data as User
}

export async function getUserById(id: number): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("Users").select("*").eq("id", id).single()

  if (error || !data) return null
  return data as User
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const supabase = await createClient()
  const hashedPassword = await hashPassword(password)

  const { data: requireApprovalSetting } = await supabase
    .from("Settings")
    .select("value")
    .eq("key", "requireApproval")
    .single()

  const requireApproval = requireApprovalSetting?.value === "true"

  const { data, error } = await supabase
    .from("Users")
    .insert({
      email,
      password: hashedPassword,
      name,
      role: "USER",
      status: requireApproval ? "PENDING" : "APPROVED",
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as User
}
