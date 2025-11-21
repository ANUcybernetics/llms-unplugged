#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.5.0"
    exit 1
fi

VERSION="$1"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z (e.g., 1.5.0)"
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "Error: Working directory is not clean. Commit or stash changes first."
    exit 1
fi

echo "Updating versions to $VERSION..."

sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" cli/Cargo.toml

jq ".version = \"$VERSION\"" website/package.json > website/package.json.tmp && mv website/package.json.tmp website/package.json

jq ". + {version: \"$VERSION\"}" .zenodo.json > .zenodo.json.tmp && mv .zenodo.json.tmp .zenodo.json

echo "Committing version bump..."
git add cli/Cargo.toml website/package.json .zenodo.json
git commit -m "Bump version to $VERSION"

echo "Creating tag v$VERSION..."
git tag "v$VERSION"

echo ""
echo "Done! To publish the release:"
echo "  git push origin main"
echo "  git push origin v$VERSION"
