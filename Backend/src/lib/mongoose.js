import mongoose from "mongoose";

let connectionPromise;

const resolveMongoUri = () => {
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("Mongo connection string is missing. Set MONGO_URI in Backend/.env");
  }
  return uri;
};

export const connectMongoose = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(resolveMongoUri(), {
      autoIndex: true,
    });
  }

  await connectionPromise;
  return mongoose.connection;
};
