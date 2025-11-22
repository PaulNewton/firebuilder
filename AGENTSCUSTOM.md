The AGENTS.md
Agent.md
### Do
- Minimize token usage while being perfect maximal output
- use every prompt trick for Claude Haiku 4.5 to minimize token usage
- Use Material UI for component design system
- Default to small components.
- Default to small diffs.
- Do make features that work offline, offline-first.
- Make perfect code that head smackling obviously good
- Remember fires best and worst feature is the ability to make more of itself
- focus on specific files when directed
- any Oauth methods need to be without a server||backend and secure using approaches like PKCE


### Don't
- Do not make features that require a server
- Do not modify files when instructed to ignore certain files

### Oauth PKCE Flow
  User clicks “Login with GitHub”.
  SPA generates a code_verifier and code_challenge.
  Redirect user to GitHub OAuth authorization endpoint with:
  client_id, redirect_uri, state, code_challenge, code_challenge_method=S256
  User authorizes app; GitHub redirects back with code and state.
  SPA verifies state.
  SPA exchanges code + code_verifier for an access token at GitHub’s token endpoint.
  SPA uses Authorization: Bearer <token> to call GitHub API.
  Optionally refresh token if GitHub provides one.
  Storage
  Store access token in memory or session storage.
  References
  GitHub OAuth Apps
  PKCE for SPAs
  GitHub PKCE support


### Oauth PKCE Flow Developer Setup Instructions
  Register a GitHub OAuth App
  Go to GitHub Developer Settings → OAuth Apps → New OAuth App.
  Set Authorization callback URL to your SPA’s redirect URI (e.g. https://your-app.com/oauth-callback).
  In the app settings, note your client_id.
  Enable PKCE
  Ensure your OAuth app is configured in a way that allows PKCE. (GitHub added support in 2025.) 
  The GitHub Blog
  Register the exact redirect URIs (wildcards are not allowed). 
  GitHub Docs
  Implement front-end code per the flow above.
  Test
  Run your SPA on a domain / origin that matches the registered redirect.


### Oauth PKCE Flow example code
  Authorization Request
  ```
  const clientId = "<YOUR_CLIENT_ID>";
  const redirectUri = encodeURIComponent(window.location.origin + "/oauth-callback");
  const state = generateRandomState();  // implement securely
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  const url = `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;
  // then redirect
  window.location.href = url;

  ```
  Token Exchange, When GitHub redirects back:
  ```
  // Parse URL parameters: code, state
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  if (returnedState !== storedState) {
  throw new Error("Invalid state");
  }

  // Exchange for access token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    client_id: clientId,
    // no client_secret
    code: code,
    redirect_uri: window.location.origin + "/oauth-callback",
    code_verifier: codeVerifier,
  })
  });
  const data = await tokenResponse.json();
  // data.access_token, data.scope, data.token_type, etc.

  ```
  Calling GitHub API
  ```
  const token = data.access_token;
  const resp = await fetch("https://api.github.com/user", {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json"
  }
  });
  const user = await resp.json();
  console.log("Logged in user:", user);

  ```
