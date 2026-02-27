#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EduSphere Classroom — EC2 Deployment Script
# Run this on your EC2 instance via SSH:
#   bash deploy-ec2.sh
#
# Tested on: Amazon Linux 2023 / Ubuntu 22.04
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

echo "============================================"
echo " EduSphere Classroom — EC2 Deployment"
echo "============================================"
echo ""

# ── Detect OS ────────────────────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Could not detect OS"
    exit 1
fi

echo "📦 Detected OS: $OS"
echo ""

# ── 1. Stop and disable Apache ──────────────────────────────────────────────
echo "🛑 Stopping Apache (if running)..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo systemctl stop httpd 2>/dev/null || true
    sudo systemctl disable httpd 2>/dev/null || true
    sudo yum remove -y httpd 2>/dev/null || true
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo systemctl stop apache2 2>/dev/null || true
    sudo systemctl disable apache2 2>/dev/null || true
    sudo apt-get remove -y apache2 2>/dev/null || true
fi
echo "✅ Apache removed"
echo ""

# ── 2. Install Node.js 20 ───────────────────────────────────────────────────
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
    
    if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        sudo yum install -y nodejs
    else
        sudo apt-get install -y nodejs
    fi
else
    echo "  Node.js $(node -v) already installed"
fi
echo "✅ Node.js $(node -v)"
echo ""

# ── 3. Install Git ──────────────────────────────────────────────────────────
echo "📦 Installing Git..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo yum install -y git
else
    sudo apt-get update && sudo apt-get install -y git
fi
echo "✅ Git $(git --version)"
echo ""

# ── 4. Install PM2 globally ─────────────────────────────────────────────────
echo "📦 Installing PM2 (process manager)..."
sudo npm install -g pm2
echo "✅ PM2 installed"
echo ""

# ── 5. Install Nginx ────────────────────────────────────────────────────────
echo "📦 Installing Nginx..."
if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    sudo yum install -y nginx
else
    sudo apt-get install -y nginx
fi
echo "✅ Nginx installed"
echo ""

# ── 6. Clone the app ────────────────────────────────────────────────────────
APP_DIR="/home/$(whoami)/edusphere-classroom"

if [ -d "$APP_DIR" ]; then
    echo "📂 App directory exists. Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📥 Cloning from GitHub..."
    git clone https://github.com/adarsh8081/edusphere-classroom.git "$APP_DIR"
    cd "$APP_DIR"
fi
echo "✅ Code ready at $APP_DIR"
echo ""

# ── 7. Install dependencies ─────────────────────────────────────────────────
echo "📦 Installing npm dependencies (this may take a minute)..."
npm install --production=false
echo "✅ Dependencies installed"
echo ""

# ── 8. Create .env file (if not exists) ─────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    
    # Generate a random session secret
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s/your_strong_random_secret_here/$SESSION_SECRET/" "$APP_DIR/.env"
    
    # Set production mode
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" "$APP_DIR/.env"
    sed -i "s/PORT=3000/PORT=3000/" "$APP_DIR/.env"
    
    echo ""
    echo "  ⚠️  IMPORTANT: Edit your .env file with real credentials!"
    echo "  Run: nano $APP_DIR/.env"
    echo ""
else
    echo "📝 .env file already exists — keeping it"
fi
echo ""

# ── 9. Build the app ────────────────────────────────────────────────────────
echo "🔨 Building the application..."
npm run build
echo "✅ Build complete"
echo ""

# ── 10. Configure Nginx ─────────────────────────────────────────────────────
echo "🌐 Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/conf.d/edusphere.conf > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # Max upload size (for assignments, resources, etc.)
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # WebSocket support (for Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # All other requests
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
NGINX_CONF

# Remove default nginx configs that might conflict
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Test and restart Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
echo "✅ Nginx configured (port 80 → Node.js 3000)"
echo ""

# ── 11. Start the app with PM2 ──────────────────────────────────────────────
echo "🚀 Starting EduSphere with PM2..."
cd "$APP_DIR"
pm2 delete edusphere 2>/dev/null || true
NODE_ENV=production pm2 start dist/index.cjs --name edusphere --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp /home/$(whoami) 2>/dev/null || true
echo "✅ App running with PM2 (auto-restarts on crash/reboot)"
echo ""

# ── Done! ────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "your-ec2-ip")
echo "============================================"
echo " 🎉 DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo " Your app is live at: http://$PUBLIC_IP"
echo ""
echo " Useful PM2 commands:"
echo "   pm2 logs edusphere    — View application logs"
echo "   pm2 restart edusphere — Restart the app"
echo "   pm2 status            — Check status"
echo ""
echo " ⚠️  Don't forget to edit your .env:"
echo "   nano $APP_DIR/.env"
echo "   pm2 restart edusphere"
echo ""
echo "============================================"
