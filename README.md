# Drag & Drop Date Picker

A unique React-based date picker where users drag and drop floating letters and numbers to form valid dates.

## Features

- **Drag & Drop Interface**: Drag floating tokens to drop slots
- **Dynamic Validation**: Smart month validation with cascading rules
- **Visual Feedback**: Shake animation on validation failures, green glow on completion
- **Chaotic Animation**: Floating tokens with random movement
- **Pure Black Theme**: Clean, minimal design

## Tech Stack

- **React 19** with hooks
- **Vite** for build tooling
- **Custom CSS** (no frameworks)
- **SVG** favicon

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Vercel Deployment

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set project name
# - Confirm build settings
```

### Option 2: Deploy via GitHub

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

### Option 3: Deploy via Vercel Dashboard

1. **Zip the project**:
   ```bash
   cd my-react-app
   zip -r ../date-picker-app.zip . -x node_modules/\*
   ```

2. **Upload to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Upload the zip file
   - Deploy

## Build Configuration

The project includes a `vercel.json` configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

## Project Structure

```
my-react-app/
├── src/
│   ├── src/
│   │   └── UselessDatePickerMinimal.jsx  # Main component
│   ├── App.jsx                            # App wrapper
│   ├── index.css                          # Custom styles
│   └── main.jsx                           # Entry point
├── public/
│   └── favicon.svg                        # Custom favicon
├── vercel.json                            # Vercel config
└── package.json                           # Dependencies
```

## Build Output

- **Total size**: ~206 kB (63 kB gzipped)
- **CSS**: 5.45 kB (1.89 kB gzipped)
- **JS**: 200.46 kB (63.12 kB gzipped)
- **HTML**: 0.73 kB (0.41 kB gzipped)

## Environment Variables

No environment variables required for basic functionality.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard under Project Settings → Domains.