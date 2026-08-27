import { LinkedInProvider } from "./linkedin.provider.js";
import { MockProvider } from "./mock.provider.js";

export function createProfileProvider() {
  const provider =
    (
      process.env.PROFILE_PROVIDER ||
      "linkedin"
    ).toLowerCase();

  if (provider === "mock") {
    return new MockProvider();
  }

  if (provider === "linkedin") {
    return new LinkedInProvider();
  }

  throw new Error(
    `Unsupported PROFILE_PROVIDER: ${provider}`
  );
}