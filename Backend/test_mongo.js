import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const PayrollEmployee = mongoose.model('PayrollEmployee', new mongoose.Schema({ _id: String, baseSalary: Number, bankName: String, accountNo: String }));
      const User = mongoose.model('User', new mongoose.Schema({ employeeId: String, id: String }));
      const p = await PayrollEmployee.find().lean();
      console.log('PayrollEmployees:', p);
      const u = await User.find().lean();
      console.log('Users:', u.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
    process.exit(0);
  });
