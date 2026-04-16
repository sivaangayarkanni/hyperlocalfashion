# 🚀 ReWear Platform - Deployment Guide

## Quick Start Deployment

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/sivaangayarkanni/hyperlocalfashion.git
cd hyperlocalfashion

# 2. Install dependencies
npm install
cd client && npm install && cd ..
cd server/mcp && npm install && cd ../..

# 3. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start development server
npm run dev

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Docker Deployment

#### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/sivaangayarkanni/hyperlocalfashion.git
cd hyperlocalfashion

# 2. Setup environment
cp .env.example .env
# Edit .env with your API keys and secrets

# 3. Build and start
docker-compose up -d

# 4. Check logs
docker-compose logs -f rewear-app

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

#### Option 2: Manual Docker Build

```bash
# Build image
docker build -t rewear-platform:latest .

# Run container
docker run -d \
  --name rewear-app \
  -p 5000:5000 \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -e OPENAI_API_KEY=your-key \
  -v $(pwd)/rewear.db:/app/rewear.db \
  rewear-platform:latest

# Check logs
docker logs -f rewear-app
```

### Cloud Deployment

#### Heroku Deployment

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create rewear-platform

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set OPENAI_API_KEY=your-key
heroku config:set ANTHROPIC_API_KEY=your-key
heroku config:set GOOGLE_API_KEY=your-key
heroku config:set COHERE_API_KEY=your-key

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

#### AWS Deployment (ECS)

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name rewear-platform

# 2. Build and push image
docker build -t rewear-platform:latest .
docker tag rewear-platform:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/rewear-platform:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/rewear-platform:latest

# 3. Create ECS task definition
# Use AWS Console or CLI to create task definition

# 4. Create ECS service
# Use AWS Console or CLI to create service
```

#### DigitalOcean App Platform

```bash
# 1. Connect GitHub repository
# https://cloud.digitalocean.com/apps

# 2. Create new app
# Select repository: hyperlocalfashion

# 3. Configure build
# Dockerfile: ./Dockerfile

# 4. Set environment variables
# Add all required API keys

# 5. Deploy
# Click "Deploy" button
```

### Environment Variables

Create `.env` file with:

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=sqlite:///rewear.db

# JWT
JWT_SECRET=your-super-secret-key-change-this

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy...
COHERE_API_KEY=...

# Optional: Payment Gateway
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...

# Optional: SMS/Email
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...
```

### Health Checks

```bash
# Check API health
curl http://localhost:5000/health

# Check database
curl http://localhost:5000/api/health/db

# Check AI services
curl http://localhost:5000/api/health/ai
```

### Monitoring & Logs

```bash
# Docker logs
docker-compose logs -f rewear-app

# Real-time monitoring
docker stats rewear-app

# Database backup
docker exec rewear-app cp /app/rewear.db /app/rewear.db.backup

# View database
sqlite3 rewear.db ".tables"
```

### Scaling

#### Horizontal Scaling (Multiple Instances)

```bash
# Scale with Docker Compose
docker-compose up -d --scale rewear-app=3

# Or use Kubernetes
kubectl scale deployment rewear-app --replicas=3
```

#### Performance Optimization

1. **Enable Caching**
   ```bash
   # Redis caching
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Database Optimization**
   ```bash
   # Create indexes
   sqlite3 rewear.db "CREATE INDEX idx_user_id ON bookings(userId);"
   sqlite3 rewear.db "CREATE INDEX idx_tailor_id ON bookings(tailorId);"
   ```

3. **CDN Setup**
   - Use CloudFlare for static assets
   - Configure origin shield

### Troubleshooting

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### Database Locked
```bash
# Restart container
docker-compose restart rewear-app

# Or reset database
rm rewear.db
docker-compose up -d
```

#### Out of Memory
```bash
# Increase memory limit
docker update --memory 2g rewear-app

# Or in docker-compose.yml
services:
  rewear-app:
    mem_limit: 2g
```

### Backup & Recovery

```bash
# Backup database
docker exec rewear-app tar czf - /app/rewear.db | gzip > rewear.db.tar.gz

# Restore database
gunzip -c rewear.db.tar.gz | docker exec -i rewear-app tar xzf -

# Backup entire app
docker exec rewear-app tar czf - /app | gzip > rewear-backup.tar.gz
```

### SSL/TLS Setup

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Or use Let's Encrypt with Certbot
certbot certonly --standalone -d yourdomain.com
```

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure all API keys
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure monitoring
- [ ] Setup error logging (Sentry)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Setup CI/CD pipeline
- [ ] Test disaster recovery
- [ ] Document runbooks
- [ ] Setup alerts

### Support

For issues or questions:
- GitHub Issues: https://github.com/sivaangayarkanni/hyperlocalfashion/issues
- Email: founders@rewear.in
- Documentation: https://rewear.in/docs

---

**Happy Deploying! 🚀**
