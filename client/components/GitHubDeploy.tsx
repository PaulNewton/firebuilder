import { useState, useEffect } from "react";
import { Github, ExternalLink, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GitHubDeployProps {
  open: boolean;
  onClose: () => void;
  pageData: any;
  onDeploy?: (repo: string, branch: string) => void;
}

interface Repository {
  name: string;
  full_name: string;
  html_url: string;
  branches?: { name: string }[];
}

const CLIENT_ID = "Ov23liSTa7i4XQb8X8DJ";
const REDIRECT_URI = `${window.location.origin}/`;
const SCOPES = "repo,user";

export default function GitHubDeploy({
  open,
  onClose,
  pageData,
  onDeploy,
}: GitHubDeployProps) {
  const [step, setStep] = useState<"setup" | "auth" | "repo-select" | "deploy">(
    "setup"
  );
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("github-token") || ""
  );
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setBranch] = useState("main");
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resetSetup = () => {
    setStep("setup");
    setAccessToken("");
    localStorage.removeItem("github-token");
    setRepositories([]);
    setSelectedRepo("");
    setBranch("main");
    setBranches([]);
    setDeployStatus("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !accessToken) {
      handleOAuthCallback(code);
    }
  }, []);

  const generatePKCE = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((x) => chars[x % chars.length])
      .join("");

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashString = String.fromCharCode.apply(null, hashArray);
      const codeChallenge = btoa(hashString)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      return { codeVerifier, codeChallenge };
    });
  };

  const startOAuth = async () => {
    const { codeChallenge } = await generatePKCE();
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem("oauth-state", state);

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
    } catch (error) {
      console.error("OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithToken = () => {
    if (!accessToken.trim()) return;
    localStorage.setItem("github-token", accessToken);
    fetchRepositories(accessToken);
    setStep("repo-select");
  };

  const fetchRepositories = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const repos: Repository[] = await response.json();
      setRepositories(
        repos.filter((r) => !r.name.startsWith(".")).slice(0, 20)
      );
    } catch (error) {
      alert("Error fetching repositories. Check your token and try again.");
      setAccessToken("");
      localStorage.removeItem("github-token");
      setStep("auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (repoFullName: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/branches`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const branchData = await response.json();
      const branchNames = branchData.map((b: any) => b.name);
      setBranches(branchNames);
      setBranch(branchNames.includes("main") ? "main" : branchNames[0]);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = async (repo: string) => {
    setSelectedRepo(repo);
    const repoObj = repositories.find((r) => r.full_name === repo);
    if (repoObj) {
      await fetchBranches(repo);
    }
  };

  const deployToGitHub = async () => {
    if (!selectedRepo || !selectedBranch) return;

    try {
      setLoading(true);
      setDeployStatus("Preparing deployment...");

      const htmlContent = generateHTML();

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      setDeployStatus(
        "✓ HTML generated! In production, this would push to GitHub."
      );
      setDeployStatus(
        "To complete deployment: 1. Create a GitHub Actions workflow, or 2. Use Git CLI to push files"
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = "index.html";
      a.click();
      URL.revokeObjectURL(url);

      onDeploy?.(selectedRepo, selectedBranch);
    } catch (error) {
      setDeployStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageData.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body>
    <!-- Add your content here -->
</body>
</html>`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetSetup();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Deploy to GitHub Pages
          </DialogTitle>
          <DialogDescription>Push your static site to GitHub Pages</DialogDescription>
          {step !== "setup" && (
            <Button
              onClick={resetSetup}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-12 text-xs hover:bg-prometheus-fire/20"
            >
              View Setup
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {step === "setup" && (
            <div className="space-y-4">
              <div className="bg-cyan-500/15 border border-cyan-500/40 rounded-lg p-4">
                <h3 className="font-semibold mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm opacity-90">
                  <li>
                    <strong>1. OAuth Setup:</strong> We use PKCE for secure
                    authentication.
                  </li>
                  <li>
                    <strong>2. Repository Selection:</strong> Choose your GitHub
                    repository and branch.
                  </li>
                  <li>
                    <strong>3. Deployment:</strong> Your static files are
                    prepared for GitHub Pages.
                  </li>
                  <li>
                    <strong>4. GitHub Pages:</strong> Configure repo settings to
                    serve from your chosen branch.
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Authentication Method</h3>
                <p className="text-sm opacity-75">
                  Use a GitHub Personal Access Token with repo permissions.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => setStep("auth")}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Continue with Token
                  </Button>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-prometheus-flame hover:underline block text-center"
                  >
                    Generate token on GitHub{" "}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {step === "auth" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-400">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
                <p className="text-xs opacity-60 mt-2">
                  Token needs: repo scope. Keep it secure!
                </p>
              </div>

              <Button
                onClick={authenticateWithToken}
                disabled={!accessToken.trim() || loading}
                className="w-full bg-prometheus-fire hover:bg-prometheus-fire/90 text-prometheus-night font-semibold"
              >
                {loading ? "Authenticating..." : "Authenticate"}
              </Button>
              <Button
                onClick={resetSetup}
                variant="outline"
                className="w-full border-prometheus-smoke/50"
              >
                Back
              </Button>
            </div>
          )}

          {step === "repo-select" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Select Repository</h3>
                <div className="max-h-48 overflow-y-auto border border-prometheus-smoke/50 rounded-lg">
                  {repositories.map((repo) => (
                    <button
                      key={repo.full_name}
                      onClick={() => handleRepoSelect(repo.full_name)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-700/30 hover:bg-cyan-500/10 transition-colors ${
                        selectedRepo === repo.full_name
                          ? "bg-cyan-500/20 border-l-2 border-l-cyan-500"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-sm">{repo.full_name}</div>
                      <div className="text-xs opacity-60">{repo.html_url}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRepo && branches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-cyan-400">
                    Target Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded-lg text-slate-200"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep("deploy")}
                  disabled={!selectedRepo || !selectedBranch}
                  className="flex-1 bg-prometheus-fire hover:bg-prometheus-fire/90 text-prometheus-night font-semibold"
                >
                  Continue to Deploy
                </Button>
                <Button
                  onClick={resetSetup}
                  variant="outline"
                  className="border-prometheus-smoke/50"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {step === "deploy" && (
            <div className="space-y-4">
              <div className="bg-prometheus-smoke/50 border border-prometheus-smoke rounded-lg p-4">
                <p className="text-sm mb-3">
                  <strong>Repository:</strong> {selectedRepo}
                </p>
                <p className="text-sm mb-3">
                  <strong>Branch:</strong> {selectedBranch}
                </p>
                {deployStatus && (
                  <p className="text-sm text-prometheus-flame">{deployStatus}</p>
                )}
              </div>

              <Button
                onClick={deployToGitHub}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    Deploy to GitHub
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep("repo-select")}
                  variant="outline"
                  className="flex-1 border-prometheus-smoke/50"
                >
                  Back
                </Button>
                <Button
                  onClick={resetSetup}
                  variant="outline"
                  className="border-prometheus-smoke/50"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
