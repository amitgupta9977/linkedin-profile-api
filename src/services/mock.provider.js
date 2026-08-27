import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class MockProvider {
  name = "mock";

  async getProfile({ url }) {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDirectory = path.dirname(currentFile);

    const fixturePath = path.join(
      currentDirectory,
      "../../fixtures/profile.json"
    );

    const raw = await readFile(
      fixturePath,
      "utf8"
    );

    const profile = JSON.parse(raw);

    return {
      ...profile,
      profileUrl: url
    };
  }
}