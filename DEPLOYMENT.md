# Deployment Guide

This guide will help you deploy the Water Business Management System homepage to a subdomain.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js applications and supports custom subdomains.

### Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts. For production deployment:
   ```bash
   vercel --prod
   ```

4. **Add Custom Subdomain**:
   - Go to your Vercel dashboard: https://vercel.com/dashboard
   - Select your project
   - Go to Settings > Domains
   - Add your subdomain (e.g., `water.yourdomain.com`)
   - Update your DNS records as instructed by Vercel

### Automatic Deployments:
- Connect your GitHub repository to Vercel for automatic deployments on every push
- Vercel will automatically build and deploy your Next.js app

---

## Option 2: Deploy with Docker

If you have a server with Docker installed:

### Steps:

1. **Build the Docker image**:
   ```bash
   docker build -t water-site .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 3000:3000 --name water-site water-site
   ```

3. **Set up Nginx reverse proxy** (for subdomain):
   Create `/etc/nginx/sites-available/water.yourdomain.com`:
   ```nginx
   server {
       listen 80;
       server_name water.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site**:
   ```bash
   ln -s /etc/nginx/sites-available/water.yourdomain.com /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

5. **Set up SSL with Let's Encrypt**:
   ```bash
   certbot --nginx -d water.yourdomain.com
   ```

---

## Option 3: Deploy to Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and deploy**:
   ```bash
   netlify login
   netlify deploy --prod
   ```

3. **Add custom subdomain** in Netlify dashboard under Domain settings

---

## Option 4: Traditional Node.js Server

### Prerequisites:
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy

### Steps:

1. **Build the application**:
   ```bash
   npm install
   npm run build
   ```

2. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "water-site" -- start
   pm2 save
   pm2 startup
   ```

3. **Set up Nginx** (same as Docker option above)

---

## Environment Variables

If you need environment variables, create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

For production, set these in your hosting platform's environment variable settings.

---

## Quick Deploy Commands

### Vercel (Fastest):
```bash
npm i -g vercel
vercel --prod
```

### Docker:
```bash
docker build -t water-site . && docker run -d -p 3000:3000 water-site
```

### PM2:
```bash
npm run build && pm2 start npm --name "water-site" -- start
```

---

## DNS Configuration

To set up a subdomain (e.g., `water.yourdomain.com`):

1. **For Vercel/Netlify**: Add a CNAME record:
   - Type: CNAME
   - Name: water
   - Value: (provided by hosting platform)

2. **For Custom Server**: Add an A record:
   - Type: A
   - Name: water
   - Value: Your server's IP address

---

## Troubleshooting

- **Build errors**: Make sure all dependencies are installed (`npm install`)
- **Port conflicts**: Change the port in `package.json` scripts or use environment variable `PORT`
- **Module resolution**: Ensure `tsconfig.json` paths are correct
- **Static files**: Check that `public` folder exists and contains necessary assets

---

## Recommended: Vercel

For Next.js applications, Vercel is the recommended platform because:
- Zero configuration needed
- Automatic HTTPS
- Global CDN
- Easy subdomain setup
- Free tier available
- Automatic deployments from Git
