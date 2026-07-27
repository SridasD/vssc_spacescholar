#!/bin/bash
#
# Builds this project on a Linux box (this script MUST be run on Linux, not
# copied over from a Windows build — `next` ships platform-specific native
# binaries (@next/swc-*), so node_modules built on Windows will not run on
# Ubuntu) and packages a fully self-contained deployment zip that includes
# node_modules. This is for the offline Ubuntu target, which has no internet
# access and therefore cannot run its own `npm ci` — unlike the AWS target,
# which does have internet and can build from source via build-production.ps1's
# source zip instead.
set -euo pipefail

# Set project name (optional)
PROJECT_NAME=""

# Auto-detect project name if not specified
if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME=$(basename "$(pwd)")
    echo "Auto-detected project name: $PROJECT_NAME" >&2
else
    echo "Using specified project name: $PROJECT_NAME" >&2
fi

if [ ! -f "package.json" ]; then
    echo "No package.json found in $(pwd) — run this script from the project root." >&2
    exit 1
fi

# ---- Install + build (fail loudly on any error, same contract as build-production.ps1) ----
echo "" >&2
echo "==> Installing dependencies (npm ci)" >&2
npm ci

echo "" >&2
echo "==> Building for production (npm run build)" >&2
NODE_ENV=production npm run build

if [ ! -f ".next/BUILD_ID" ]; then
    echo "Build reported success but .next/BUILD_ID is missing — treating this as a failed build." >&2
    exit 1
fi
echo "Build succeeded (BUILD_ID: $(cat .next/BUILD_ID))" >&2

# Strip devDependencies (typescript, tailwindcss, postcss, eslint, ...) from
# node_modules before shipping — they were needed to produce .next but are
# not needed to run `next start`. npm prune works off the already-installed
# tree, so this needs no further network access.
echo "" >&2
echo "==> Pruning devDependencies from node_modules" >&2
npm prune --omit=dev

# Create timestamp for filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Get parent directory
PARENT_DIR=$(dirname "$(pwd)")

# Define backup directory in parent folder
BACKUP_DIR="$PARENT_DIR/Backup"
echo "Using backup directory: $BACKUP_DIR" >&2

# Create Backup folder in parent directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "Created Backup directory in parent folder: $BACKUP_DIR" >&2
fi

# Define essential files for PM2 deployment on a box with no internet access.
# node_modules is included (pruned to production deps) since the target
# cannot run npm ci/install itself.
ESSENTIAL_FILES=('.next' 'node_modules' 'public' 'package.json' 'package-lock.json' 'next.config.js')

# .env.production is opt-in, not automatic — a secrets-bearing file
# shouldn't be bundled by default (mirrors build-production.ps1's
# -IncludeEnvFile gate). Set INCLUDE_ENV_FILE=1 in the environment to opt in.
if [ "${INCLUDE_ENV_FILE:-0}" = "1" ] && [ -f ".env.production" ]; then
    ESSENTIAL_FILES+=(".env.production")
    echo "Including environment file: .env.production (INCLUDE_ENV_FILE=1)" >&2
else
    echo "Not including .env.production (set INCLUDE_ENV_FILE=1 to bundle it)" >&2
fi

# Add optional config files if they exist
OPTIONAL_FILES=('ecosystem.config.js' '.babelrc' 'babel.config.js' 'postcss.config.js' 'tailwind.config.js')
for file in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        ESSENTIAL_FILES+=("$file")
        echo "Including optional file: $file" >&2
    fi
done

# Create deployment-ready backup directly in the parent's Backup folder
DEPLOYMENT_ZIP_PATH="$BACKUP_DIR/${PROJECT_NAME}_deployment_$TIMESTAMP.zip"
zip -rq "$DEPLOYMENT_ZIP_PATH" "${ESSENTIAL_FILES[@]}"
DEPLOYMENT_ZIP_MB=$(du -m "$DEPLOYMENT_ZIP_PATH" | cut -f1)
echo "Deployment-ready backup created in parent directory: $DEPLOYMENT_ZIP_PATH (${DEPLOYMENT_ZIP_MB} MB)" >&2
echo "On the offline target: unzip and run 'npm start' / your PM2 restart directly — no npm install needed." >&2

# Create complete project backup using compatible method. This is a
# broader repo snapshot for archival, not a deploy artifact — it
# excludes node_modules/.git/.next/Backup plus anything secret/user-data
# that shouldn't ride along in a backup zip: certificates, uploaded user
# documents, and any .env* file.
TEMP_DIR="$PARENT_DIR/temp_archive_$TIMESTAMP"
mkdir -p "$TEMP_DIR"

rsync -a \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude=".next" \
    --exclude="Backup" \
    --exclude="certificates" \
    --exclude="uploaded_files" \
    --exclude=".env*" \
    . "$TEMP_DIR"

# Create complete project zip directly in the parent's Backup folder
COMPLETE_ZIP_PATH="$BACKUP_DIR/complete_project_${PROJECT_NAME}_$TIMESTAMP.zip"
(cd "$TEMP_DIR" && zip -rq "$COMPLETE_ZIP_PATH" .)

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "Complete project backup created in parent directory: $COMPLETE_ZIP_PATH" >&2
