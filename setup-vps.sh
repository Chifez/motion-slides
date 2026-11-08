#!/usr/bin/env bash
set -e

echo "=================================================="
echo " MotionSlides Export Server - VPS Quick Setup"
echo "=================================================="

# 1. Require root or sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo: sudo ./setup-vps.sh"
  exit 1
fi

# 2. Check and allocate 4GB Swapfile
if [ ! -f /swapfile ]; then
  echo "==> Configuring 4GB NVMe swapfile for stability..."
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl vm.swappiness=20
  if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
    echo 'vm.swappiness=20' >> /etc/sysctl.conf
  fi
  echo "==> 4GB Swapfile configured successfully."
else
  echo "==> Swapfile already exists. Skipping."
fi

# 3. Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker and Docker Compose..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable docker
  systemctl start docker
  echo "==> Docker installed successfully."
else
  echo "==> Docker is already installed."
fi

# 4. Prepare .env file if missing
if [ ! -f apps/export-server/.env ]; then
  echo "==> Creating apps/export-server/.env from .env.example..."
  cp apps/export-server/.env.example apps/export-server/.env
  sed -i 's|FRONTEND_URL=http://localhost:3000|FRONTEND_URL=https://motionslides.app|g' apps/export-server/.env
  sed -i 's|MAX_CONCURRENT=2|MAX_CONCURRENT=1|g' apps/export-server/.env
  sed -i 's|STORAGE_PROVIDER=local|STORAGE_PROVIDER=local|g' apps/export-server/.env
  echo "==> Created apps/export-server/.env with production defaults."
fi

echo ""
echo "=================================================="
echo " Setup complete! To launch the export server:"
echo "   docker compose up -d --build"
echo ""
echo " To monitor logs:"
echo "   docker compose logs -f export-server"
echo "=================================================="
