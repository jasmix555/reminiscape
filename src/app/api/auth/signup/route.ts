// src/app/api/auth/signup/route.ts
import {NextResponse} from "next/server";
import {hash} from "bcrypt";

import {prisma} from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {email, password, name} = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({error: "Missing required fields"}, {status: 400});
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {email},
    });

    if (existingUser) {
      return NextResponse.json({error: "User with this email already exists"}, {status: 400});
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword, // Using hashedPassword instead of password
      },
    });

    // Remove hashedPassword from response
    const {hashedPassword: _, ...userWithoutPassword} = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: "User created successfully",
      },
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating user:", error);

    return NextResponse.json({error: "Error creating user"}, {status: 500});
  }
}
