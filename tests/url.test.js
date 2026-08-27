import test from "node:test";
import assert from "node:assert/strict";

import {
  validateLinkedInUrl
} from "../src/utils/url.js";

test(
  "accepts LinkedIn profile URL",
  () => {
    const result =
      validateLinkedInUrl(
        "https://www.linkedin.com/in/jane-doe/"
      );

    assert.equal(
      result.vanityName,
      "jane-doe"
    );
  }
);

test(
  "rejects non LinkedIn URL",
  () => {
    assert.throws(
      () =>
        validateLinkedInUrl(
          "https://example.com/in/jane-doe/"
        ),
      /linkedin\.com/
    );
  }
);

test(
  "rejects company URL",
  () => {
    assert.throws(
      () =>
        validateLinkedInUrl(
          "https://www.linkedin.com/company/example/"
        ),
      /Expected a LinkedIn profile URL/
    );
  }
);