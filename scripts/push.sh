#!/usr/bin/env bash

set -euo pipefail

REMOTE_URL="https://github.com/M4ng0D0g/ds_final_project.git"
BRANCH="main"
VERSION_FILE=".settings"

if [[ $# -eq 0 ]]; then
  echo "Usage: ./push.sh \"commit message\""
  exit 1
fi

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Error: .settings file not found in project root."
  exit 1
fi

VERSION="$(grep -E '^project_version=' "$VERSION_FILE" | head -n1 | cut -d'=' -f2- | tr -d '[:space:]')"

if [[ -z "$VERSION" ]]; then
  # fallback: try first non-empty line
  VERSION="$(awk 'NF{print $0; exit}' "$VERSION_FILE" | tr -d '[:space:]')"
fi

if [[ -z "$VERSION" ]]; then
  echo "Error: .settings file is empty or project_version not set."
  exit 1
fi

COMMIT_MSG="v${VERSION}: $*"

# DRY_RUN support for safe testing
if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "DRY_RUN: computed commit message -> $COMMIT_MSG"
  exit 0
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Error: this directory is not a git repository."
  exit 1
}

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$COMMIT_MSG"
git push -u origin "$BRANCH"
