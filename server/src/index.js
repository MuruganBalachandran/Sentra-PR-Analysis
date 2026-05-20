// region imports
// package imports
import chalk from "chalk";

// config imports
import { connectDB, env } from "./config/index.js";

// app imports
import app from "./app.js";
import { initAutoBuildScheduler } from "./services/context/contextAutoBuilder.js";
// endregion

// region start server
const startServer = async () => {
  try {
    // wait for DB connection before starting server
    await connectDB();

    // start express server only after DB is ready
    app.listen(env?.PORT || 3000, () => {
      console.log(chalk.green(`Server running on port ${env?.PORT || 3000}`));
    });
    initAutoBuildScheduler();
  } catch (err) {
    // log startup error and exit
    console.error(
      chalk.red("Server startup failed:"),
      err?.message || "Unknown startup error",
    );
    process.exit(1);
  }
};

startServer();
// endregion
