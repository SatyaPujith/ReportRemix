<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ReportRemix - AI Word Editor

An AI-powered Word document editor with custom rich text editor and Gemini AI for intelligent document editing.

## Features

- **Custom Rich Text Editor**: Built-in WYSIWYG editor with Word-like functionality
  - Font family selection (19 fonts including Arial, Calibri, Times New Roman)
  - Font size selection (8pt to 72pt)
  - Text formatting (bold, italic, underline)
  - Text and highlight colors with color picker
  - Alignment (left, center, right, justify)
  - Lists (bullet and numbered)
  - Headings (H1, H2) and paragraphs
  - Image resizing with drag handles
  - Page break insertion
  - No external dependencies or API keys required!

- **AI Document Editing**: Use Gemini AI to edit, rewrite, and format your documents
  - Intelligent content preservation with smart merge algorithm
  - Detects and handles partial AI responses
  - Style and formatting retention
  - Image protection during edits
  - Handles large documents with automatic content recovery

- **Word Document Import**: Upload .docx files with formatting preservation using Mammoth.js
  - Fonts, colors, and styles maintained
  - Tables and lists preserved
  - Embedded images with base64 encoding

- **Export Options**: 
  - Export to Word (.docx) using html-docx-js
  - Export to PDF using jsPDF

- **A4 Page Layout**: Professional multi-page document view with proper margins and page numbers

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your Gemini API key in `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Usage

### Basic Workflow

1. **Upload a Word Document**: Click or drag a .docx file to upload
2. **Edit Manually**: 
   - Select text first, then use the formatting toolbar
   - Change fonts (19 options) and sizes (8pt-72pt)
   - Apply colors using the color picker
   - Use bold, italic, underline, and alignment buttons
   - Insert lists, headings, and page breaks
   - Double-click images to reset size
3. **AI Editing**: Use the chat panel to ask AI to edit your document
   - Example: "Make the title bold and centered"
   - Example: "Add a summary paragraph at the beginning"
   - Example: "Change all headings to blue color"
   - Example: "Rewrite the introduction to be more formal"
4. **Export**: Click Export to download as Word or PDF

### AI Editing Tips

**For Best Results:**
- Be specific with your requests: "Make paragraph 2 bold" works better than "improve formatting"
- Keep documents under 50KB for optimal AI performance
- Use AI for content changes and specific formatting tasks
- Use manual toolbar for bulk formatting on large documents

**AI Limitations:**
- Large documents (>100KB) may be truncated due to AI token limits
- The app includes smart merge to handle partial responses
- For very large documents, consider editing in sections

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Editor**: Custom ContentEditable-based editor with formatting toolbar
- **AI**: Gemini AI API (gemini-2.0-flash-exp)
- **DOCX Import**: Mammoth.js (CDN)
- **DOCX Export**: html-docx-js (CDN)
- **PDF Export**: jsPDF + html2canvas (CDN)
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Lucide React

All document processing libraries loaded via CDN - minimal npm dependencies!

## Configuration

### Gemini API Key

Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to `.env.local`:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

**Free Tier Limits:**
- 15 requests per minute
- 1500 requests per day
- 1,000,000 tokens per minute

### Environment Variables

```bash
# .env.local
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist` directory.

### Deploy to Vercel/Netlify

1. Set environment variable: `VITE_GEMINI_API_KEY=your_key_here`
2. Build command: `npm run build`
3. Output directory: `dist`

## Features in Detail

### Smart Merge Algorithm

The app includes an intelligent merge system that handles partial AI responses:

1. **Detects incomplete elements** - Checks if AI stopped mid-paragraph or mid-table
2. **Removes incomplete content** - Discards partial elements
3. **Replaces with complete original** - Uses the full element from original document
4. **Continues with remaining content** - Appends all remaining elements

This ensures you never lose content when AI hits token limits.

### Document Import

- Supports .docx files
- Preserves fonts, colors, and basic formatting
- Handles tables and lists
- Embeds images as base64
- Some complex formatting may be simplified

### Export Options

**Word Export (.docx):**
- Preserves formatting and styles
- Includes images
- Compatible with Microsoft Word

**PDF Export:**
- A4 page layout
- Multi-page support
- High-quality rendering

## Known Limitations

### AI Editing
- Large documents (>100KB) may be truncated due to AI model limits
- Complex formatting changes work best on smaller documents
- Use manual formatting for bulk changes on large documents

### Document Import
- Complex Word layouts may be simplified
- Some table styling may not be preserved
- Advanced Word features (track changes, comments) not supported

### Editor Features
- No real-time collaboration
- No version history
- No track changes or comments

## Troubleshooting

### AI Editing Not Working
- Check that `VITE_GEMINI_API_KEY` is set in `.env.local`
- Verify the key is valid at [Google AI Studio](https://aistudio.google.com/)
- Check browser console for error messages
- Ensure you haven't exceeded free tier limits

### Formatting Not Applying
- Make sure text is selected before applying formatting
- Click inside the document to focus the editor
- Try selecting text again and reapplying

### Document Looks Different After Import
- Some formatting loss is normal with DOCX conversion
- Manually adjust formatting after import
- Use AI to fix formatting: "Make tables have borders"

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure you're using a modern browser (Chrome, Firefox, Edge)

---

Built with ❤️ using 100% free and open-source tools
