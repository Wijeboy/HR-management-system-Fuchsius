import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureSystemUsers } from "./modules/auth/systemUsers.js";
import { ensurePayrollSeed } from "./modules/payroll/payrollSeed.js";
import { prisma } from "./lib/prisma.js";

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully (Prisma/MongoDB)");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }

  await ensureSystemUsers();
  await ensurePayrollSeed();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ HRMS backend running successfully on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Backend startup failed", error);
  process.exit(1);
});
