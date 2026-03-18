# Citadelle Frontend

A sophisticated, Arctic-themed encrypted storage interface with premium ice-glass aesthetics.

## Design Philosophy

**Cold, Secure, Premium**

The interface evokes the feeling of a high-security vault carved from arctic ice:
- Deep navy-blue backgrounds representing depth and security
- Pale blue-white gradients with frost effects
- Glass/ice textures with blur and translucency
- Sharp, elegant typography with Playfair Display
- Subtle frost particles floating upward

## Visual Language

### Color Palette
- **Background**: `#0a1628` - Deep arctic night
- **Surface**: `#0f1d32` - Ice depths
- **Text**: `#e8f4f8` - Frost white
- **Accent**: `#4a9eff` - Glacier blue
- **Subtle**: `rgba(200, 220, 255, 0.x)` - Various frost opacities

### Typography
- **Title**: Playfair Display (serif) - Elegant, timeless, secure feeling
- **Body**: Inter (sans-serif) - Clean, modern, highly readable
- **Special**: All-caps tracking for labels and buttons

### Effects
- `.ice-glass` / `.ice-glass-strong` - Frosted glass panels
- `.ice-input` - Input fields with ice depth
- `.frost-text` - Gradient text from white to pale blue
- `.arctic-bg` - Animated gradient background
- `.ice-shimmer` - Horizontal shimmer effect
- Frost particles with glow effects

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS 4 (CSS-first configuration)
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Inter + Playfair Display)

## Pages

- `/auth` - Authentication interface with Sign In / Sign Up

## Run Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
```

Static files output to `dist/`

## Key Features

- **Glassmorphism 2.0**: Multi-layer ice effects with backdrop blur
- **Premium Typography**: Playfair Display for impact, Inter for clarity  
- **Atmospheric Depth**: Frost particles, ambient glows, gradient shifts
- **Accessible**: High contrast text, clear visual hierarchy
- **Responsive**: Works on all device sizes

## File Structure

```
app/
├── auth/page.tsx      # Authentication page
├── layout.tsx         # Root layout with fonts
├── page.tsx           # Redirect to auth
└── globals.css        # Arctic theme & utilities
components/ui/         # shadcn components
public/
dist/                  # Build output
```
