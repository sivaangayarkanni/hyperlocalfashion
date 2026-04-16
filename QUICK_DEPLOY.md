# ⚡ ReWear Platform - Quick Deploy Guide

## 🚀 Deploy in 5 Minutes

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/sivaangayarkanni/hyperlocalfashion.git
cd hyperlocalfashion

# 2. Setup environment
cp .env.example .env

# 3. Edit .env with your API keys (optional for demo)
# nano .env

# 4. Deploy
docker-compose up -d

# 5. Access application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

### Option 2: Automated Script

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

### Option 3: Manual Docker

```bash
# Build
docker build -t rewear-platform:latest .

# Run
docker run -d \
  --name rewear-app \
  -p 5000:5000 \
  -p 3000:3000 \
  -e NODE_ENV=production \
  rewear-platform:latest

# Check logs
docker logs -f rewear-app
```

---

## ✅ Verify Deployment

```bash
# Check API
curl http://localhost:5000/health

# Check Database
curl http://localhost:5000/api/health/db

# Check AI Services
curl http://localhost:5000/api/health/ai

# Access Frontend
open http://localhost:3000
```

---

## 🔧 Configuration

### Minimal Setup (Demo)
No configuration needed! Just run `docker-compose up -d`

### Production Setup
Edit `.env` with:

```env
NODE_ENV=production
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy...
COHERE_API_KEY=...
```

---

## 📊 Test Features

### 1. Create Account
- Go to http://localhost:3000
- Click "Sign up"
- Select role (Customer or Tailor)
- Create account

### 2. Test Sustainability Dashboard
- Login as customer
- Go to Dashboard
- View sustainability metrics
- Check leaderboard

### 3. Test AI Chatbot
- Click on chatbot icon
- Ask questions like:
  - "Find me a tailor nearby"
  - "How much does a shirt repair cost?"
  - "What's my sustainability impact?"

### 4. Test Booking
- Click "Create Booking"
- Upload garment image
- AI analyzes damage
- Select tailor
- Complete booking

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
docker-compose down
PORT=8000 docker-compose up -d
```

### Database Issues
```bash
# Reset database
rm rewear.db
docker-compose restart

# Or backup and reset
cp rewear.db rewear.db.backup
rm rewear.db
docker-compose restart
```

### Memory Issues
```bash
# Increase memory limit
docker update --memory 2g rewear-app

# Or in docker-compose.yml
services:
  rewear-app:
    mem_limit: 2g
```

### Logs
```bash
# View logs
docker-compose logs -f rewear-app

# View specific service
docker-compose logs rewear-app

# Last 100 lines
docker-compose logs --tail=100 rewear-app
```

---

## 📱 Test Accounts

### Demo Customer
- Email: customer@rewear.in
- Password: demo123

### Demo Tailor
- Email: tailor@rewear.in
- Password: demo123

---

## 🎯 What to Test

- [ ] Login/Signup works
- [ ] Dashboard loads
- [ ] Sustainability data displays
- [ ] Leaderboard updates
- [ ] AI chatbot responds
- [ ] Booking creation works
- [ ] Real-time updates work
- [ ] Mobile responsive

---

## 📊 Performance Check

```bash
# Check container stats
docker stats rewear-app

# Check database size
sqlite3 rewear.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"

# Check API response time
time curl http://localhost:5000/api/health
```

---

## 🔒 Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Keep API keys secure
- Enable rate limiting
- Setup backups

---

## 📞 Support

- GitHub: https://github.com/sivaangayarkanni/hyperlocalfashion
- Email: founders@rewear.in
- Issues: https://github.com/sivaangayarkanni/hyperlocalfashion/issues

---

## 🎉 Next Steps

1. **Customize**: Edit branding, colors, content
2. **Add Data**: Create test bookings and reviews
3. **Configure**: Setup payment gateway, SMS, email
4. **Deploy**: Push to production (AWS, Heroku, DigitalOcean)
5. **Monitor**: Setup monitoring and alerts

---

**Happy Deploying! 🚀**

For detailed deployment guide, see: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
For production checklist, see: [PRODUCTION_READY.md](PRODUCTION_READY.md)
