# Favicon Options for Group Bot Automator

I've created three different favicon designs for your automation platform:

## 1. **favicon.svg** (Default - Gears Theme)
- **Design**: Interconnected gears representing automation and mechanical processes
- **Colors**: Blue (#3B82F6) with green accent (#10B981)
- **Theme**: Traditional automation with mechanical gears
- **Best for**: Classic automation/bot platforms

## 2. **favicon-bot.svg** (Bot Theme)
- **Design**: Modern robot head with antenna and status indicator
- **Colors**: Dark background (#1E293B) with blue bot (#3B82F6) and green status (#10B981)
- **Theme**: Modern AI/bot automation
- **Best for**: AI-powered automation platforms

## 3. **favicon-workflow.svg** (Workflow Theme)
- **Design**: Connected nodes representing workflow automation
- **Colors**: Dark background (#0F172A) with green start, blue process, red end
- **Theme**: Workflow and process automation
- **Best for**: Workflow-based automation platforms

## How to Use

### Option 1: Use SVG (Recommended)
The SVG favicon is already set up in `index.html` and will scale perfectly on all devices.

### Option 2: Convert to PNG
If you need PNG versions, you can:

1. **Online Converter**: Use tools like:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png
   - https://www.svgviewer.dev/

2. **Command Line** (if you have ImageMagick):
   ```bash
   convert favicon.svg favicon-32x32.png
   convert favicon.svg -resize 16x16 favicon-16x16.png
   convert favicon.svg -resize 180x180 apple-touch-icon.png
   ```

3. **Browser**: Open the SVG in a browser, take a screenshot, and resize

### Option 3: Change the Favicon
To use a different design, simply rename one of the other SVG files to `favicon.svg`:

```bash
# To use the bot theme
cp favicon-bot.svg favicon.svg

# To use the workflow theme
cp favicon-workflow.svg favicon.svg
```

## Current Setup
- **Primary**: `favicon.svg` (gears theme)
- **Fallback**: `favicon.ico` (original)
- **Manifest**: `site.webmanifest` for PWA support
- **Meta tags**: Updated for better SEO and social sharing

## Customization
You can modify the SVG files to:
- Change colors by updating the fill/stroke values
- Adjust sizes by modifying the viewBox
- Add more elements or change the design
- Use your brand colors

The SVG format allows for easy customization and perfect scaling across all devices. 