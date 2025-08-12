import mongoose from 'mongoose';

export default async () => {
  if (global.__SERVER_PID__) {
    try { process.kill(global.__SERVER_PID__); } catch {}
  }
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
};
