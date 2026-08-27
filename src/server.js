import "dotenv/config";

import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { createProfileProvider } from "./services/provider.js";
import { validateLinkedInUrl } from "./utils/url.js";

const app = express();

const port = Number(
  process.env.PORT || 3000
);

const provider =
  createProfileProvider();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  express.json({
    limit: "32kb"
  })
);

app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "linkedin-profile-api",
    provider: provider.name
  });
});

app.get(
  "/api/v1/docs",
  (_req, res) => {
    res.json({
      endpoint: "POST /api/v1/profile",

      request: {
        url:
          "https://www.linkedin.com/in/example/"
      },

      response: {
        success: true,
        profile: {
          id: "string|null",
          name: {
            fullName: "string|null",
            firstName: "string|null",
            lastName: "string|null"
          },
          headline: "string|null",
          location: "object|null",
          about: "string|null",
          profileUrl: "string",
          profileImage: "string|null",
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          languages: []
        }
      }
    });
  }
);

app.post(
  "/api/v1/profile",
  async (req, res) => {
    try {
      const url = req.body?.url;

      const parsed =
        validateLinkedInUrl(url);

      const profile =
        await provider.getProfile({
          url,
          vanityName:
            parsed.vanityName
        });

      return res.json({
        success: true,

        profile,

        meta: {
          provider: provider.name,
          fetchedAt:
            new Date().toISOString()
        }
      });
    } catch (error) {
      const status =
        error.statusCode || 500;

      return res
        .status(status)
        .json({
          success: false,

          error: {
            code:
              error.code ||
              "INTERNAL_ERROR",

            message:
              error.publicMessage ||
              error.message ||
              "Unexpected error"
          }
        });
    }
  }
);

app.use(
  (_req, res) => {
    res.status(404).json({
      success: false,

      error: {
        code: "NOT_FOUND",
        message: "Route not found"
      }
    });
  }
);

app.listen(
  port,
  () => {
    console.log(
      `linkedin-profile-api running on port ${port}`
    );
  }
);