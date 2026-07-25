#!/bin/bash

# Set project name (optional)
PROJECT_NAME=""

# Auto-detect project name if not specified
if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME=$(basename $(pwd))
    echo "Auto-detected project name: $PROJECT_NAME" >&2
else
    echo "Using specified project name: $PROJECT_NAME" >&2
fi

# Create timestamp for filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Get parent directory
PARENT_DIR=$(dirname $(pwd))

# Define backup directory in parent folder
BACKUP_DIR="$PARENT_DIR/Backup"
echo "Using backup directory: $BACKUP_DIR" >&2

# Create Backup folder in parent directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "Created Backup directory in parent folder: $BACKUP_DIR" >&2
fi

# Define essential files for PM2 deployment
ESSENTIAL_FILES=('.next' 'public' 'package.json' 'package-lock.json' 'next.config.js')

# Add only .env.production file
if [ -f ".env.production" ]; then
    ESSENTIAL_FILES+=(".env.production")
    echo "Including environment file: .env.production" >&2
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
zip -r "$DEPLOYMENT_ZIP_PATH" "${ESSENTIAL_FILES[@]}"
echo "Deployment-ready backup created in parent directory: $DEPLOYMENT_ZIP_PATH" >&2

# Create complete project backup using compatible method
TEMP_DIR="$PARENT_DIR/temp_archive_$TIMESTAMP"
mkdir -p "$TEMP_DIR"

# Copy files to temp directory with exclusions
rsync -av --exclude="node_modules" --exclude=".git" --exclude="Backup" . "$TEMP_DIR"

# Create complete project zip directly in the parent's Backup folder
COMPLETE_ZIP_PATH="$BACKUP_DIR/complete_project_${PROJECT_NAME}_$TIMESTAMP.zip"
zip -r "$COMPLETE_ZIP_PATH" "$TEMP_DIR"

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "Complete project backup created in parent directory: $COMPLETE_ZIP_PATH" >&2
