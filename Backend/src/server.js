import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureSystemUsers } from "./modules/auth/systemUsers.js";
import { ensurePayrollSeed } from "./modules/payroll/payrollSeed.js";
import { connectMongoose } from "./lib/mongoose.js";

const start = async () => {
  try {
    await connectMongoose();
    console.log("📦 MongoDB Connected...");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }

  await ensureSystemUsers();
  await ensurePayrollSeed();

  app.listen(env.port, () => {
    console.log(`✅ HRMS backend running on http://localhost:${env.port}`);
  });
};

start().catch((err) => {
  console.error("Backend startup failed", err);
  process.exit(1);
});
