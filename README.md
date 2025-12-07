
  
  <h1>✨ ReportRemix</h1>
  <p><strong>AI-Powered Word Document Editor</strong></p>
  <p>Edit Word documents with intelligent AI assistance, beautiful dark UI, and powerful formatting tools</p>

  <p>
    <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/AI-Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  </p>
</div>

---

## 🎯 Features

### 📝 **Rich Text Editor**
- **19 Professional Fonts** - Arial, Calibri, Times New Roman, and more
- **Font Sizes** - 8pt to 72pt with precise control
- **Text Formatting** - Bold, italic, underline, strikethrough
- **Colors** - Text color and highlight with 18+ preset colors
- **Alignment** - Left, center, right, justify
- **Lists** - Bullet points and numbered lists
- **Headings** - H1, H2, and paragraph styles
- **Page Breaks** - Insert manual page breaks

### 🤖 **AI-Powered Editing**
- **Smart Content Editing** - Ask AI to rewrite, format, or improve your document
- **Intelligent Merge** - Handles partial AI responses gracefully
- **Content Preservation** - Never lose your work with smart recovery
- **Style Retention** - Maintains formatting during AI edits
- **Image Protection** - Images stay intact during AI operations

### 📄 **Document Management**
- **Import** - Upload .docx files with full formatting preservation
- **Export** - Download as Word (.docx) or PDF
- **A4 Layout** - Professional multi-page view with proper margins
- **Page Numbers** - Automatic page numbering
- **Zoom** - Ctrl/Cmd + Scroll to zoom 25%-200%

### 🎨 **Modern Dark UI**
- **Sleek Design** - Beautiful dark theme inspired by modern apps
- **Responsive** - Works perfectly on desktop, tablet, and mobile
- **Floating AI Button** - Quick access to AI assistant on mobile
- **Smooth Animations** - Polished transitions and interactions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SatyaPujith/ReportRemix.git
   cd reportremix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📖 Usage Guide

### Uploading Documents
1. Drag and drop a `.docx` file onto the upload zone
2. Or click to browse and select a file
3. Wait for the document to parse and load

### Manual Editing
1. **Select text** first before applying formatting
2. Use the **toolbar** to change fonts, sizes, colors
3. Apply **bold, italic, underline** with buttons or keyboard shortcuts
4. Insert **lists, headings, and page breaks**
5. **Double-click images** to reset their size
6. **Ctrl/Cmd + Scroll** to zoom in/out

### AI Editing
1. Click the **AI button** (mobile) or use the **sidebar** (desktop)
2. Type your request in natural language:
   - *"Make the title bold and centered"*
   - *"Rewrite the introduction to be more formal"*
   - *"Change all headings to blue"*
   - *"Add a summary at the beginning"*
3. Press **Enter** to send
4. AI will update your document automatically

### Exporting
1. Click the **Export** button in the header
2. Choose **Word (.docx)** or **PDF**
3. Enter a filename
4. Click **Download**

---

## 🎨 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + Scroll` | Zoom in/out |
| `Enter` | Send AI message |
| `Shift + Enter` | New line in chat |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling (CDN)

### Document Processing
- **Mammoth.js** - DOCX import with formatting preservation
- **html-docx-js** - DOCX export
- **jsPDF** - PDF generation
- **html2canvas** - HTML to canvas rendering

### AI Integration
- **Gemini AI** - Advanced language model for document editing
- **Smart Merge Algorithm** - Handles partial responses

### Icons & UI
- **Lucide React** - Beautiful icon library
- **React Markdown** - Markdown rendering in chat

---

## 📱 Mobile Features

### Responsive Design
- **Floating AI Button** - Quick access to AI assistant
- **Slide-in Chat Panel** - Full-screen chat overlay
- **Touch-Friendly** - Optimized for touch interactions
- **Horizontal Toolbar Scroll** - All tools accessible

### Mobile Gestures
- **Tap** floating button to open AI chat
- **Tap overlay** to close chat
- **Scroll** toolbar horizontally for more tools
- **Pinch zoom** on document (browser native)

---

## 🔧 Configuration

### Environment Variables

```env
# Required: Gemini AI API Key
VITE_GEMINI_API_KEY=your_api_key_here
```

### Customization

**Fonts** - Edit `FONTS` array in `components/DocumentEditor.tsx`
```typescript
const FONTS = ['Arial', 'Calibri', 'Times New Roman', ...];
```

**Font Sizes** - Edit `FONT_SIZES` array
```typescript
const FONT_SIZES = ['8', '9', '10', '11', '12', ...];
```

**Colors** - Customize color palettes in the toolbar sections

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist` directory.

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable: `VITE_GEMINI_API_KEY`
4. Deploy

### Deploy to Netlify

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_GEMINI_API_KEY`

---

## 🎯 Roadmap

- [ ] Real-time collaboration
- [ ] Version history
- [ ] Comments and annotations
- [ ] Track changes
- [ ] More export formats (Markdown, HTML)
- [ ] Custom templates
- [ ] Cloud storage integration
- [ ] Offline mode

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Mammoth.js** - For excellent DOCX parsing
- **Gemini AI** - For powerful language model capabilities
- **Lucide** - For beautiful icons
- **Tailwind CSS** - For rapid UI development
- **React Community** - For amazing tools and libraries

---

## 📧 Support

Having issues? Found a bug? Have a feature request?

- 📫 Open an issue on [GitHub Issues](https://github.com/yourusername/reportremix/issues)
- 💬 Start a discussion on [GitHub Discussions](https://github.com/yourusername/reportremix/discussions)

---

<div align="center">
  <p>Made with ❤️ by developers, for developers</p>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-usage-guide">Usage</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-deployment">Deploy</a>
  </p>
  
  <p>⭐ Star this repo if you find it useful!</p>
</div>
