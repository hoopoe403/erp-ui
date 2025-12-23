# Deployment Guide

## Overview

This project uses:
- **GitHub Actions** for CI/CD (free)
- **GitHub Container Registry (ghcr.io)** for Docker images (free)
- **Watchtower** for automatic container updates on your server

## Setup Instructions

### 1. GitHub Repository Setup

1. Push your code to GitHub (if not already done)
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
   - Build the Docker image on every push to `main`
   - Push the image to GitHub Container Registry (`ghcr.io`)

### 2. Make Package Public (Optional but Recommended)

After the first build, go to:
1. Your GitHub repo → Packages (right sidebar)
2. Click on the package
3. Package Settings → Change visibility to "Public" (for easier pulling)

Or keep it private and authenticate on your server (see step 3b).

### 3. Windows Server Setup

#### Prerequisites
- Docker Desktop for Windows installed
- Docker Compose installed

#### 3a. Login to GitHub Container Registry (for private packages)

```powershell
# Generate a Personal Access Token (PAT) from GitHub:
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Create a token with 'read:packages' scope

# Login to ghcr.io
docker login ghcr.io -u YOUR_GITHUB_USERNAME
# Enter your PAT as the password
```

#### 3b. Create deployment folder

```powershell
mkdir C:\erp-deployment
cd C:\erp-deployment
```

#### 3c. Create docker-compose.yml

Create `docker-compose.yml` with this content (update YOUR_GITHUB_USERNAME):

```yaml
version: '3.8'

services:
  erp-ui:
    image: ghcr.io/YOUR_GITHUB_USERNAME/fe-erp-ui:latest
    container_name: erp-ui
    ports:
      - "4200:80"
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - //var/run/docker.sock:/var/run/docker.sock
      - C:/Users/YOUR_USER/.docker/config.json:/config.json:ro
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300
      - WATCHTOWER_LABEL_ENABLE=true
    restart: unless-stopped
```

#### 3d. Start the services

```powershell
docker-compose up -d
```

### 4. How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   You push to   │────▶│ GitHub Actions  │────▶│   ghcr.io       │
│   main branch   │     │ builds image    │     │ stores image    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ (every 5 min)
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Application   │◀────│  Watchtower     │◀────│ Checks for new  │
│   updated!      │     │  pulls & restarts│     │ image version   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 5. Useful Commands

```powershell
# View running containers
docker ps

# View logs
docker logs erp-ui
docker logs watchtower

# Manually pull latest image
docker-compose pull
docker-compose up -d

# Stop everything
docker-compose down

# Force update
docker-compose pull && docker-compose up -d --force-recreate
```

### 6. Troubleshooting

**Image not pulling?**
- Check if you're logged into ghcr.io: `docker login ghcr.io`
- Verify the image name matches your GitHub repository

**Watchtower not updating?**
- Check Watchtower logs: `docker logs watchtower`
- Ensure the container has the watchtower label

**Port 80 already in use?**
- Change the port mapping in docker-compose.yml to `8080:80`

### 7. Optional: Manual Deployment (without Watchtower)

If you prefer manual control, skip Watchtower and run:

```powershell
# Pull latest image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/fe-erp-ui:latest

# Restart container
docker-compose up -d --force-recreate
```

## Environment-Specific Builds

If you need different environments (staging, production), create separate workflows or use environment variables in your Angular build.
