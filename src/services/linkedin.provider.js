import { apiError } from "../utils/url.js";

export class LinkedInProvider {
  name = "linkedin";

  async getProfile({ url, vanityName }) {
    const token =
      process.env.LINKEDIN_ACCESS_TOKEN;

    if (!token) {
      throw apiError(
        503,
        "LINKEDIN_NOT_CONFIGURED",
        "LinkedIn access token is not configured. Please authenticate with LinkedIn first."
      );
    }

    const response = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json"
        }
      }
    );

    let body = null;

    try {
      body =
        await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      throw apiError(
        response.status === 401
          ? 401
          : 502,

        response.status === 401
          ? "LINKEDIN_ACCESS_TOKEN_EXPIRED"
          : "LINKEDIN_API_ERROR",

        body?.message ||
          body?.error_description ||
          `LinkedIn API returned HTTP ${response.status}.`
      );
    }

    return normalizeLinkedInProfile(
      body,
      url
    );
  }
}

function normalizeLinkedInProfile(
  data,
  profileUrl
) {
  return {
    id:
      data?.sub ??
      null,

    name: {
      fullName:
        data?.name ??
        null,

      firstName:
        data?.given_name ??
        null,

      lastName:
        data?.family_name ??
        null
    },

    email:
      data?.email ??
      null,

    headline:
      null,

    location:
      data?.locale
        ? {
            locale:
              data.locale
          }
        : null,

    about:
      null,

    profileUrl:
      profileUrl ??
      null,

    profileImage:
      data?.picture ??
      null,

    experience: [],

    education: [],

    skills: [],

    certifications: [],

    languages: []
  };
}
