import { apiError } from "../utils/url.js";

export class LinkedInProvider {
  name = "linkedin";

  async getProfile({ url, vanityName }) {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;

    if (!token) {
      throw apiError(
        503,
        "LINKEDIN_NOT_CONFIGURED",
        "LinkedIn access token is not configured."
      );
    }

    const expectedVanity =
      process.env.LINKEDIN_VANITY_NAME?.trim();

    if (
      expectedVanity &&
      expectedVanity.toLowerCase() !==
        vanityName.toLowerCase()
    ) {
      throw apiError(
        403,
        "PROFILE_ACCESS_NOT_AVAILABLE",
        "The configured LinkedIn API access does not permit arbitrary public-profile lookup."
      );
    }

    const response = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      let body = null;

      try {
        body = await response.json();
      } catch {}

      throw apiError(
        response.status === 401
          ? 401
          : 502,
        "LINKEDIN_API_ERROR",
        body?.message ||
          `LinkedIn API returned HTTP ${response.status}.`
      );
    }

    const data = await response.json();

    return normalizeLinkedInProfile(
      data,
      url
    );
  }
}

function normalizeLinkedInProfile(
  data,
  profileUrl
) {
  return {
    id: data.sub ?? null,

    name: {
      fullName: data.name ?? null,
      firstName: data.given_name ?? null,
      lastName: data.family_name ?? null
    },

    headline: null,

    location: data.locale
      ? {
          locale: data.locale
        }
      : null,

    about: null,

    profileUrl,

    profileImage:
      data.picture ?? null,

    experience: [],

    education: [],

    skills: [],

    certifications: [],

    languages: []
  };
}