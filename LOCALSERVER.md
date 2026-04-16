# Running the HR Factory Application Locally

## Quick Start

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at: **http://localhost:5173**

---

## Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js) or **yarn**

---

## Step-by-Step Instructions

### 1. Navigate to Web Directory

```bash
cd web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This starts the Vite development server with:
- Hot Module Replacement (HMR) - instant updates on file changes
- Source maps for debugging
- Optimized build process

### 4. Open in Browser

Navigate to: **http://localhost:5173**

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:5173) |
| `npm run build` | Build for production (creates `dist/` folder) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

---

## Troubleshooting

### Port Already in Use

If port 5173 is occupied, Vite will automatically use the next available port (5174, 5175, etc.). Check the console output for the actual URL.

### Node Modules Issues

If you encounter errors after pulling updates:

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Firebase Connection Issues

Ensure you have:
1. Internet connection (Firebase is cloud-hosted)
2. Valid Firebase credentials in `src/firebase.js`
3. Firestore and Authentication enabled in your Firebase console

### Windows Users

If `rm -rf` doesn't work on Windows, use:
```cmd
rmdir /s /q node_modules
npm install
```

---

## Project Structure

```
web/
├── src/
│   ├── components/    # React components
│   ├── contexts/       # Auth & state contexts
│   ├── firebase/       # Firebase configuration
│   ├── hooks/          # Custom React hooks
│   └── App.jsx         # Main app component
├── public/             # Static assets
├── index.html          # HTML entry point
└── package.json        # Dependencies & scripts
```

---

## Building for Production

```bash
# Create optimized production build
npm run build

# Preview the production build
npm run preview
```

The production build is output to the `dist/` folder.

---

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
