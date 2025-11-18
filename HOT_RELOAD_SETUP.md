# Hot Reload Setup ✅

## 🚀 Quick Start

Both servers are now running with hot reload enabled!

### Start Both Servers (Recommended)
```bash
npm run dev:full
```

This starts:
- **Backend API** on port 3001 with nodemon (hot reload)
- **Angular Frontend** on port 4200 with built-in hot reload

### Start Servers Separately

**Backend only:**
```bash
npm run dev:api
```

**Frontend only:**
```bash
npm run dev:angular
```

## 🔥 Hot Reload Features

### Backend (Node.js/Express)
- ✅ **nodemon** watches `.js` and `.json` files
- ✅ Automatically restarts server on file changes
- ✅ Ignores `node_modules/`, `angular/`, and backup files
- ✅ Changes to `server.js` trigger immediate restart

### Frontend (Angular)
- ✅ **Built-in hot reload** via Angular CLI
- ✅ Automatically reloads browser on file changes
- ✅ Fast refresh for component changes
- ✅ Preserves component state when possible

## 📝 File Watching

### Backend Watches:
- `server.js` - Main server file
- `*.js` - All JavaScript files in root
- `*.json` - Configuration files

### Frontend Watches:
- All TypeScript files (`*.ts`)
- All HTML templates (`*.html`)
- All SCSS/CSS files (`*.scss`, `*.css`)
- Component files automatically detected

## 🛠️ Development Workflow

1. **Make changes** to any file
2. **Save the file**
3. **Server automatically restarts** (backend) or **browser refreshes** (frontend)
4. **See changes immediately** - no manual restart needed!

## 🔍 Troubleshooting

### Backend not reloading?
- Check if nodemon is running: `ps aux | grep nodemon`
- Verify file changes are being saved
- Check console for nodemon restart messages

### Frontend not reloading?
- Check browser console for errors
- Verify Angular CLI is running: `ps aux | grep "ng serve"`
- Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Port already in use?
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:4200 | xargs kill -9  # Frontend
```

## 📊 Server URLs

- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:4200
- **Health Check**: http://localhost:3001/api/health

## 🎯 Tips

1. **Keep both terminals open** to see server logs
2. **Check browser console** for frontend errors
3. **Check terminal** for backend errors
4. **Use `npm run dev:full`** for easiest setup
5. **Changes to API endpoints** require backend restart (automatic with nodemon)
6. **Changes to Angular components** trigger browser refresh (automatic)

## ✅ Status

Both servers are configured and running with hot reload enabled!

