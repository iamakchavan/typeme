# typeme

A clean, minimalist typing speed test application with real-time WPM tracking and smooth animations.

🚀 **Live Demo**: [https://typeme.space](https://typeme.space)

## Features

- ⚡ Real-time WPM (Words Per Minute) calculation
- 🎯 Visual feedback for correct/incorrect characters
- 🔊 Audio feedback with toggle option
- ✨ Smooth animations and transitions
- 📱 Responsive design
- ⌨️ 30-second typing test
- 🔄 Instant restart functionality

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Shadcn UI** components
- **Lucide React** for icons

## Getting Started

> **Prerequisites:**
> [Node.js](https://nodejs.org/en/) (version 16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at [http://localhost:5173](http://localhost:5173)

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Deployment

This project is optimized for **Vercel** deployment:

### Deploy to Vercel

1. **One-click deploy:**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/typeme)

2. **Manual deployment:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **GitHub integration:**
   - Connect your repository to Vercel
   - Automatic deployments on every push to main branch
   - Preview deployments for pull requests

### Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```bash
cp .env.example .env.local
```

## Project Structure

```
typeme/
├── public/           # Static assets
│   └── typeme.png   # OG image
├── src/
│   ├── components/  # Reusable UI components
│   ├── lib/         # Utility functions
│   ├── screens/     # Main application screens
│   └── index.tsx    # Application entry point
├── vercel.json      # Vercel configuration
└── vite.config.ts   # Vite configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
