import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const User = mongoose.model('User', new mongoose.Schema({ employeeId: String, name: String }));
      const pramod = await User.findOne({ name: /Pramod/i }).lean();
      console.log('Pramod User:', pramod);
    } catch (err) {
      console.error(err);
    }
    process.exit(0);
  });
