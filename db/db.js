import mongoose from "mongoose";
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true ,useUnifiedTopology:true});
    console.log("Database connected succesfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // You might want to handle the error here, e.g., retrying, logging, or terminating the application
  }
};

export default connectToMongoDB;
