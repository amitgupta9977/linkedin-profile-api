# LinkedIn Profile API

A hosted REST API that accepts a LinkedIn profile URL and returns structured profile information.

This project was built as part of a hiring challenge to reverse engineer LinkedIn APIs and provide profile information through a backend API without using browser automation.

## Features

* Public HTTPS API
* LinkedIn profile URL validation
* LinkedIn OAuth 2.0 / OpenID Connect authentication
* Direct requests to LinkedIn APIs using HTTP
* Structured JSON profile response
* Provider-based architecture
* Mock provider support for local development
* Environment-based configuration
* No browser automation or scraping through Puppeteer/Playwright
* Credentials and secrets kept outside the repository

## Architecture

```text
Client
  |
  | POST /api/v1/profile
  v
Express API
  |
  v
Profile Provider
  |
  +-------------------+
  |                   |
  v                   v
LinkedInProvider    MockProvider
  |
  v
LinkedIn API
  |
  v
Normalized Profile JSON
```

## Project Structure

```text
linkedin-profile-api/
│
├── src/
│   ├── server.js
│   │
│   ├── services/
│   │   ├── provider.js
│   │   ├── linkedin.provider.js
│   │   └── mock.provider.js
│   │
│   └── utils/
│       └── url.js
│
├── package.json
├── package-lock.json
└── README.md
```

## Requirements

* Node.js 20+
* npm
* LinkedIn Developer Application
* LinkedIn OAuth credentials

## Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd linkedin-profile-api
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file locally:

```env
PORT=3000
NODE_ENV=development

PROFILE_PROVIDER=linkedin

LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
```

### Production

For production deployments, configure these values through the hosting provider's environment-variable settings rather than committing a `.env` file.

Example:

```env
NODE_ENV=production
PROFILE_PROVIDER=linkedin

LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://your-domain.com/auth/linkedin/callback
```

**Never commit `LINKEDIN_CLIENT_SECRET`, access tokens, or other credentials to GitHub.**

## LinkedIn Application Configuration

Create/configure an application in the LinkedIn Developer Portal.

Enable:

* Sign In with LinkedIn using OpenID Connect
* Share on LinkedIn, if required by the application

Required OAuth scopes:

```text
openid
profile
email
```

Configure the Authorized Redirect URL to exactly match the value configured in `LINKEDIN_REDIRECT_URI`.

Example:

```text
https://your-domain.com/auth/linkedin/callback
```

## Running Locally

Development:

```bash
npm run dev
```

Production-style:

```bash
npm start
```

The server starts on:

```text
http://localhost:3000
```

## Health Check

### Request

```http
GET /health
```

### Example

```bash
curl http://localhost:3000/health
```

### Response

```json
{
  "ok": true,
  "service": "linkedin-profile-api",
  "provider": "linkedin",
  "linkedinAuthenticated": false
}
```

After completing LinkedIn authentication:

```json
{
  "ok": true,
  "service": "linkedin-profile-api",
  "provider": "linkedin",
  "linkedinAuthenticated": true
}
```

## LinkedIn Authentication

Start the OAuth flow:

```http
GET /auth/linkedin
```

Example:

```text
https://your-domain.com/auth/linkedin
```

The user is redirected to LinkedIn for authentication and authorization.

After successful authorization, LinkedIn redirects the user to:

```text
/auth/linkedin/callback
```

The backend exchanges the authorization code for an access token and calls:

```text
GET https://api.linkedin.com/v2/userinfo
```

The authenticated member information is then normalized into the application's response format.

## Profile API

### Endpoint

```http
POST /api/v1/profile
```

### Request

```json
{
  "url": "https://www.linkedin.com/in/example/"
}
```

### Example

```bash
curl -X POST \
  https://your-domain.com/api/v1/profile \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.linkedin.com/in/example/"}'
```

### Response

```json
{
  "success": true,
  "profile": {
    "id": "string",
    "name": {
      "fullName": "string",
      "firstName": "string",
      "lastName": "string"
    },
    "email": "string|null",
    "headline": null,
    "location": {
      "locale": {
        "country": "US",
        "language": "en"
      }
    },
    "about": null,
    "profileUrl": "https://www.linkedin.com/in/example/",
    "profileImage": "https://...",
    "experience": [],
    "education": [],
    "skills": [],
    "certifications": [],
    "languages": []
  },
  "meta": {
    "provider": "linkedin",
    "fetchedAt": "2026-08-31T00:00:00.000Z",
    "authenticatedWithLinkedIn": true
  }
}
```

## API Documentation

The API provides a basic documentation endpoint:

```http
GET /api/v1/docs
```

Example:

```text
https://your-domain.com/api/v1/docs
```

## Provider Architecture

The API uses a provider-based architecture so that profile data sources can be changed without changing the API layer.

```javascript
createProfileProvider()
```

The provider is selected using:

```env
PROFILE_PROVIDER=linkedin
```

For local testing, a mock provider can be used:

```env
PROFILE_PROVIDER=mock
```

## Error Handling

The API returns structured errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "LINKEDIN_API_ERROR",
    "message": "LinkedIn API returned an error."
  }
}
```

Common error codes include:

```text
LINKEDIN_OAUTH_NOT_CONFIGURED
LINKEDIN_AUTH_ERROR
AUTHORIZATION_CODE_MISSING
LINKEDIN_TOKEN_ERROR
LINKEDIN_ACCESS_TOKEN_MISSING
LINKEDIN_PROFILE_ERROR
LINKEDIN_ACCESS_TOKEN_EXPIRED
LINKEDIN_NOT_CONFIGURED
PROFILE_ACCESS_NOT_AVAILABLE
NOT_FOUND
INTERNAL_ERROR
```

## Deployment

The application can be deployed to any Node.js-compatible hosting platform.

Example production deployment flow:

```text
GitHub Repository
       |
       v
Hosting Platform
       |
       v
npm install
       |
       v
npm start
       |
       v
Public HTTPS API
```

### Render Example

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Configure the following environment variables in Render:

```env
NODE_ENV=production
PROFILE_PROVIDER=linkedin
LINKEDIN_CLIENT_ID=<your-client-id>
LINKEDIN_CLIENT_SECRET=<your-client-secret>
LINKEDIN_REDIRECT_URI=https://your-domain.com/auth/linkedin/callback
```

## Security

The following security practices are followed:

* LinkedIn client secret is stored as an environment variable.
* Secrets are not committed to the repository.
* Access tokens are not returned as API responses.
* `helmet` is used for HTTP security headers.
* Request body size is limited.
* `x-powered-by` is disabled.
* Authentication errors are handled without exposing credentials.

## Reverse Engineering Approach

The implementation uses direct HTTP communication with LinkedIn APIs.

The application does not use:

* Puppeteer
* Playwright
* Selenium
* Browser automation
* DOM-based scraping

The current implementation uses LinkedIn OAuth/OpenID Connect and directly calls LinkedIn's API endpoints.

The profile data is normalized into a stable application-specific JSON schema rather than exposing LinkedIn's raw API response directly.

## Known Limitations

### 1. LinkedIn `/v2/userinfo` is for the authenticated member

The OpenID Connect `userinfo` endpoint returns information about the LinkedIn member who authorized the application.

It does **not** provide arbitrary public-profile lookup by LinkedIn URL.

Therefore, submitting:

```text
https://www.linkedin.com/in/person-a/
```

does not mean the API can automatically retrieve `person-a`'s profile unless the LinkedIn API access available to the application permits that operation.

### 2. Extended profile fields

Fields such as:

```text
headline
about
experience
education
skills
certifications
languages
```

may not be available through the currently enabled LinkedIn OIDC permissions.

The application keeps these fields in the response schema so that additional supported LinkedIn profile APIs can be integrated if the required access is available.

### 3. OAuth token storage

The current development implementation keeps the access token in application memory.

This is suitable for testing but is not intended as a production-grade persistent token store.

A production implementation should use secure server-side token/session storage with appropriate expiration and refresh handling.

### 4. LinkedIn API access restrictions

LinkedIn controls access to member data through products, permissions, scopes, and application approval.

The availability of profile information can therefore depend on the permissions granted to the LinkedIn application.

## Testing

Run the test suite with:

```bash
npm test
```

Health check:

```text
GET /health
```

Authentication:

```text
GET /auth/linkedin
```

Profile:

```text
POST /api/v1/profile
```

Documentation:

```text
GET /api/v1/docs
```

## Example Production API

```text
POST https://your-domain.com/api/v1/profile
```

Request:

```json
{
  "url": "https://www.linkedin.com/in/example/"
}
```

## Future Improvements

Potential improvements include:

* Persistent encrypted OAuth token storage
* Token expiration and refresh handling
* Better profile-field mapping
* Additional LinkedIn API integrations when approved
* Request rate limiting
* Response caching
* Automated integration tests
* Improved API authentication
* More detailed API documentation

## License

This project was created for a hiring challenge and assessment purposes.
