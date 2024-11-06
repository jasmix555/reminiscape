// src/app/api/users/[id]/route.ts
import {NextResponse} from "next/server";

import {prisma} from "@/lib/prisma";

export async function GET(req: Request, {params}: {params: {id: string}}) {
  const {id} = params;

  try {
    const user = await prisma.user.findUnique({
      where: {id},
    });

    if (!user) {
      return NextResponse.json({error: "User not found"}, {status: 404});
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    return NextResponse.json({error: "Failed to fetch user"}, {status: 500});
  }
}

export async function PUT(req: Request, {params}: {params: {id: string}}) {
  const {id} = params;
  const {email, name} = await req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: {id},
      data: {email, name},
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);

    return NextResponse.json({error: "User update failed"}, {status: 500});
  }
}

export async function DELETE(req: Request, {params}: {params: {id: string}}) {
  const {id} = params;

  try {
    await prisma.user.delete({
      where: {id},
    });

    return NextResponse.json({message: "User deleted successfully"});
  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json({error: "User deletion failed"}, {status: 500});
  }
}
