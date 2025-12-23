import mongoose from "mongoose";
import dotenv from "dotenv";

// Load .env before anything else
dotenv.config({ path: "./.env" });

export const connectDB = async () => {
  try {
     console.log(process.env.MONGODB_URI)
    // Debug print (optional)
    if (!process.env.MONGODB_URI) {
      console.error("❌ ERROR: MONGO_URI is missing in .env file");
      process.exit(1);
    }
      
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};
