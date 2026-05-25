import { prisma } from "@/lib/prisma";
import "dotenv/config";

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("DB CONNECTED ✅", result);
  } catch (err) {
    console.error("DB FAILED ❌", err);
  }
}

test();