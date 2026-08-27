import "dotenv/config";

import crypto from "node:crypto";
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

/*
 * ==========================================
 * Temporary in-memory OAuth token storage
 * ==========================================
 *
 * IMPORTANT:
 * This is suitable for testing only.
 * Tokens will be lost when Render restarts.
 */
let linkedinAccessToken = null;


/*
 * ==========================================
 * LinkedIn OAuth - Start
 * ==========================================
 */
app.get(
  "/auth/linkedin",
  (_req, res) => {
    const clientId =
      process.env.LINKEDIN_CLIENT_ID;

    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(503).json({
        success: false,

        error: {
          code:
            "LINKEDIN_OAUTH_NOT_CONFIGURED",

          message:
            "LinkedIn OAuth client ID or redirect URI is not configured."
        }
      });
    }

    const state =
      crypto.randomUUID();

    const params =
      new URLSearchParams({
        response_type:
          "code",

        client_id:
          clientId,

        redirect_uri:
          redirectUri,

        state,

        scope:
          "openid profile email"
      });

    return res.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    );
  }
);


/*
 * ==========================================
 * LinkedIn OAuth - Callback
 * ==========================================
 */
app.get(
  "/auth/linkedin/callback",
  async (req, res) => {
    try {
      const code =
        req.query?.code;

      const error =
        req.query?.error;

      /*
       * User rejected authorization
       */
      if (error) {
        return res.status(400).json({
          success: false,

          error: {
            code:
              "LINKEDIN_AUTH_ERROR",

            message:
              req.query
                ?.error_description ||
              error
          }
        });
      }

      /*
       * Authorization code missing
       */
      if (!code) {
        return res.status(400).json({
          success: false,

          error: {
            code:
              "AUTHORIZATION_CODE_MISSING",

            message:
              "LinkedIn authorization code was not provided."
          }
        });
      }

      const clientId =
        process.env.LINKEDIN_CLIENT_ID;

      const clientSecret =
        process.env.LINKEDIN_CLIENT_SECRET;

      const redirectUri =
        process.env.LINKEDIN_REDIRECT_URI;

      if (
        !clientId ||
        !clientSecret ||
        !redirectUri
      ) {
        return res.status(503).json({
          success: false,

          error: {
            code:
              "LINKEDIN_OAUTH_NOT_CONFIGURED",

            message:
              "LinkedIn OAuth credentials are not configured."
          }
        });
      }

      /*
       * ======================================
       * Exchange authorization code
       * for access token
       * ======================================
       */
      const tokenResponse =
        await fetch(
          "https://www.linkedin.com/oauth/v2/accessToken",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },

            body:
              new URLSearchParams({
                grant_type:
                  "authorization_code",

                code,

                client_id:
                  clientId,

                client_secret:
                  clientSecret,

                redirect_uri:
                  redirectUri
              })
          }
        );

      let tokenData = null;

      try {
        tokenData =
          await tokenResponse.json();
      } catch {
        tokenData = null;
      }

      if (!tokenResponse.ok) {
        console.error(
          "LinkedIn token error:",
          tokenData
        );

        return res.status(502).json({
          success: false,

          error: {
            code:
              "LINKEDIN_TOKEN_ERROR",

            message:
              tokenData
                ?.error_description ||
              tokenData?.error ||
              `LinkedIn token endpoint returned HTTP ${tokenResponse.status}.`
          }
        });
      }

      const accessToken =
        tokenData?.access_token;

      if (!accessToken) {
        return res.status(502).json({
          success: false,

          error: {
            code:
              "LINKEDIN_ACCESS_TOKEN_MISSING",

            message:
              "LinkedIn did not return an access token."
          }
        });
      }

      /*
       * Store token temporarily.
       *
       * DO NOT log the token.
       */
      linkedinAccessToken =
        accessToken;

      /*
       * ======================================
       * Fetch authenticated LinkedIn user
       * ======================================
       */
      const profileResponse =
        await fetch(
          "https://api.linkedin.com/v2/userinfo",
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              Accept:
                "application/json"
            }
          }
        );

      let profileData = null;

      try {
        profileData =
          await profileResponse.json();
      } catch {
        profileData = null;
      }

      if (!profileResponse.ok) {
        console.error(
          "LinkedIn profile error:",
          profileData
        );

        return res.status(502).json({
          success: false,

          error: {
            code:
              "LINKEDIN_PROFILE_ERROR",

            message:
              profileData?.message ||
              `LinkedIn userinfo endpoint returned HTTP ${profileResponse.status}.`
          }
        });
      }

      /*
       * ======================================
       * Return authenticated profile
       * ======================================
       */
      return res.json({
        success: true,

        message:
          "LinkedIn authentication successful.",

        profile: {
          id:
            profileData?.sub ??
            null,

          name: {
            fullName:
              profileData?.name ??
              null,

            firstName:
              profileData?.given_name ??
              null,

            lastName:
              profileData?.family_name ??
              null
          },

          email:
            profileData?.email ??
            null,

          profileImage:
            profileData?.picture ??
            null,

          locale:
            profileData?.locale ??
            null
        }
      });
    } catch (error) {
      console.error(
        "LinkedIn OAuth callback error:",
        error
      );

      return res.status(500).json({
        success: false,

        error: {
          code:
            "LINKEDIN_OAUTH_CALLBACK_ERROR",

          message:
            "Unexpected error during LinkedIn authentication."
        }
      });
    }
  }
);


/*
 * ==========================================
 * Health
 * ==========================================
 */
app.get(
  "/health",
  (_req, res) => {
    res.json({
      ok: true,

      service:
        "linkedin-profile-api",

      provider:
        provider.name,

      linkedinAuthenticated:
        Boolean(linkedinAccessToken)
    });
  }
);


/*
 * ==========================================
 * API Documentation
 * ==========================================
 */
app.get(
  "/api/v1/docs",
  (_req, res) => {
    res.json({
      endpoint:
        "POST /api/v1/profile",

      request: {
        url:
          "https://www.linkedin.com/in/example/"
      },

      response: {
        success: true,

        profile: {
          id:
            "string|null",

          name: {
            fullName:
              "string|null",

            firstName:
              "string|null",

            lastName:
              "string|null"
          },

          headline:
            "string|null",

          location:
            "object|null",

          about:
            "string|null",

          profileUrl:
            "string",

          profileImage:
            "string|null",

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


/*
 * ==========================================
 * GET Profile
 * ==========================================
 */
app.get(
  "/api/v1/profile",
  (_req, res) => {
    res.json({
      message:
        "Use POST /api/v1/profile to fetch a LinkedIn profile.",

      example: {
        method:
          "POST",

        body: {
          url:
            "https://www.linkedin.com/in/example/"
        }
      }
    });
  }
);


/*
 * ==========================================
 * POST Profile
 * ==========================================
 */
app.post(
  "/api/v1/profile",
  async (req, res) => {
    try {
      const url =
        req.body?.url;

      const parsed =
        validateLinkedInUrl(url);

      /*
       * If OAuth token exists, temporarily use
       * it for the LinkedIn provider.
       */
      if (linkedinAccessToken) {
        process.env.LINKEDIN_ACCESS_TOKEN =
          linkedinAccessToken;
      }

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
          provider:
            provider.name,

          fetchedAt:
            new Date().toISOString(),

          authenticatedWithLinkedIn:
            Boolean(linkedinAccessToken)
        }
      });
    } catch (error) {
      const status =
        error.statusCode ||
        500;

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


/*
 * ==========================================
 * 404
 * ==========================================
 */
app.use(
  (_req, res) => {
    res.status(404).json({
      success: false,

      error: {
        code:
          "NOT_FOUND",

        message:
          "Route not found"
      }
    });
  }
);


/*
 * ==========================================
 * Start Server
 * ==========================================
 */
app.listen(
  port,
  () => {
    console.log(
      `linkedin-profile-api running on port ${port}`
    );
  }
);
