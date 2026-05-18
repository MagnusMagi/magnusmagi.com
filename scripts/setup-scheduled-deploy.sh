#!/usr/bin/env bash
# Creates a Vercel deploy hook and stores it as a GitHub Actions secret
# named VERCEL_DEPLOY_HOOK_URL, so the .github/workflows/scheduled-deploy.yml
# cron can trigger redeploys twice a day.
#
# Run once with your Vercel API token:
#
#   VERCEL_TOKEN="<token>" bash scripts/setup-scheduled-deploy.sh
#
# Generate a token at https://vercel.com/account/tokens
# Revoke it afterwards if you only want one-shot use.

set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "error: VERCEL_TOKEN env var is required" >&2
  echo "       generate one at https://vercel.com/account/tokens" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (brew install jq)" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh (GitHub CLI) is required" >&2
  exit 1
fi

if [ ! -f .vercel/project.json ]; then
  echo "error: .vercel/project.json not found — run from the repo root" >&2
  exit 1
fi

PROJECT_ID=$(jq -r .projectId .vercel/project.json)
TEAM_ID=$(jq -r .orgId .vercel/project.json)
HOOK_NAME="scheduled-content-publish"
HOOK_REF="main"

echo "→ creating Vercel deploy hook '$HOOK_NAME' on ref '$HOOK_REF'..."

RESPONSE=$(curl --fail --silent --show-error -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$HOOK_NAME\",\"ref\":\"$HOOK_REF\"}" \
  "https://api.vercel.com/v1/projects/$PROJECT_ID/deploy-hooks?teamId=$TEAM_ID")

# Response shape: { ..., "link": { "deployHooks": [{ "name", "url", ... }] } }
HOOK_URL=$(echo "$RESPONSE" \
  | jq -r --arg name "$HOOK_NAME" \
      '(.link.deployHooks // []) | map(select(.name == $name)) | last | .url // empty')

if [ -z "$HOOK_URL" ]; then
  echo "error: failed to extract deploy hook url" >&2
  echo "response: $RESPONSE" >&2
  exit 1
fi

echo "→ storing secret VERCEL_DEPLOY_HOOK_URL in GitHub Actions..."

printf '%s' "$HOOK_URL" | gh secret set VERCEL_DEPLOY_HOOK_URL --body -

echo
echo "✓ Done."
echo "  Deploy hook URL stored as VERCEL_DEPLOY_HOOK_URL repo secret."
echo "  The scheduled-deploy workflow will run at 06:00 and 18:00 UTC daily."
echo
echo "  To trigger once now:"
echo "    gh workflow run scheduled-deploy.yml"
