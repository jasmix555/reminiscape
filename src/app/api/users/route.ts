// src/app/api/users/route.ts
import {NextResponse} from "next/server";

import {prisma} from "@/lib/prisma";

export async function POST(req: Request) {
  const {email, name} = await req.json();

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return NextResponse.json(newUser, {status: 201});
  } catch (error) {
    console.error("Error creating user:", error);

    return NextResponse.json({error: "User creation failed"}, {status: 500});
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);

    return NextResponse.json({error: "Failed to fetch users"}, {status: 500});
  }
}
