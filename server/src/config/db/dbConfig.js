// region imports
import mongoose from "mongoose";
import chalk from "chalk";
import { env } from '../env/envConfig.js';
// endregion

// region connect to db
const connectDB = async (options = {}) => {
  try {
    // connect using MongoDB URL from env config
    await mongoose.connect(env?.MONGODB_URL || "", options || {});

    // log successful connection
    console.log(chalk.green('Database connected successfully'));

  } catch (error) {
    // log failure reason for debugging
    console.error(chalk.red('Database connection failed:'), error?.message || 'Database connection failed');

    // exit process because app cannot run without DB
    process?.exit(1);
  }
};
// endregion

// region connection events
mongoose.connection.on('disconnected', () => {
  console.warn(chalk.yellow('Database disconnected'));
});

mongoose.connection.on('reconnected', () => {
  console.log(chalk.cyan('Database reconnected'));
});

mongoose.connection.on('error', (err = {}) => {
  console.error(chalk.red('Database runtime error:'), err?.message || 'Unknown database error');
});
// endregion

// region exports
export default connectDB;
// endregion
