import express, { json } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerConfigs from "./configs/swaggerConfig.js";
import apiRoutes from "./routes/index.js";
import { postgresDB } from "./configs/postgresDB.js";
import { ensureBucketExists } from "./configs/s3.js";
import "./models/index.js";
import validateApiKey from "./middlewares/validateApiKey.js";
import errorHandling from "./middlewares/errorHandling.js";
import githubOAuthRoutes from "./routes/GitHubRoutes.js";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});

const app = express();
app.set('trust proxy', true);
// middlewares
app.use(cors());
//app.use(validateApiKey)
app.use(json());
const port = process.env.API_SERVER_PORT || 4000;

// GitHub OAuth routes (browser redirects, no API key required)
app.use("/api/github", githubOAuthRoutes);

// only requests to /api/* will be sent to our router
const router = express.Router();
apiRoutes(router);
app.use("/api", validateApiKey, router);

  // Endpoint to check that sentry logging works
  app.get("/debug-sentry", () => {
    throw new Error("Sentry test error from API server");
  });

// API docs
const swaggerUiOptions = {
  customSiteTitle: "Spoken Map API Documentation",
  customCss: ".swagger-ui .topbar { display: none }",
};
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerConfigs, swaggerUiOptions),
);

Sentry.setupExpressErrorHandler(app);
app.use(errorHandling);

// connect to databases and storage
postgresDB()
  .then(async () => {
    // Ensure S3 bucket exists
    await ensureBucketExists();

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
