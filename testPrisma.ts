import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    });

    if (!existingUser) {
      // Create a new user if it doesn't exist
      const newUser = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
        },
      });

      console.log("Created new user:", newUser);
    } else {
      console.log("User already exists:", existingUser);
    }

    // Fetch all users
    const allUsers = await prisma.user.findMany();

    console.log("All users:", allUsers);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
