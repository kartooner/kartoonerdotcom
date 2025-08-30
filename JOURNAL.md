# Journal CMS Documentation

A simple, file-based journal system that converts Markdown stories into a beautiful blog with RSS/Atom feeds.

## Features

- **File-based content** - Write stories in simple text files
- **Enhanced Markdown support** - Rich formatting with tables, code blocks, and more
- **Theme support** - Dark/light mode with consistent styling
- **Progressive images** - Skeleton loading for better UX
- **RSS/Atom feeds** - Automatic feed generation
- **Responsive design** - Works on all devices
- **Archive system** - Organized by year

## Getting Started

### Writing Stories

Create text files in the `/stories` folder with this format:

```
/stories/2025-08-29-my-story-title.txt
```

### Story File Format

```
Title: Your Story Title
Subtitle: Optional subtitle for extra context
Date: 2025-08-29T12:00:00Z
Tags: personal, thoughts, life
Excerpt: Brief description for feeds and archive
Images: /img/photo1.jpg, /img/photo2.jpg

Your story content goes here using Markdown...

This is a paragraph with **bold text** and *italic text*.

## Headings work great

You can use all the Markdown features listed below.
```

### Commands

```bash
# Sync stories from /stories folder and build everything
npm run build

# Alternative commands
node journal-cms.js sync     # Same as npm run build
node journal-cms.js list     # List all entries
node journal-cms.js add      # Interactive entry creation
node journal-cms.js generate # Rebuild from existing JSON
```

## Markdown Support

### Headers

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

### Text Formatting

```markdown
**Bold text** or __bold text__
*Italic text* or _italic text_
~~Strikethrough text~~
`Inline code`
```

### Links

```markdown
[Link text](https://example.com)
[Internal link](/about)
```

### Lists

**Unordered lists:**
```markdown
- Item 1
- Item 2
- Item 3

* Alternative syntax
+ Another alternative
```

**Ordered lists:**
```markdown
1. First item
2. Second item
3. Third item
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines

> Quote with attribution
> — Author Name
```

### Code Blocks

**Fenced code blocks:**
````markdown
```javascript
function hello() {
    console.log("Hello World!");
}
```

```python
def hello():
    print("Hello World!")
```
````

**Indented code blocks:**
```markdown
    // Code indented with 4 spaces
    const x = 42;
    console.log(x);
```

### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Data A   | Data B   | Data C   |
```

### Horizontal Rules

```markdown
---
***
___
```

## File Structure

```
/
├── stories/                 # Your story files
│   ├── 2025-08-29-story.txt
│   └── 2025-08-30-story.txt
├── journal/                 # Generated journal pages
│   └── index.html
├── entry/                   # Generated individual entry pages
│   ├── story.html
│   └── another-story.html
├── archive.html             # Generated archive page
├── journal-feed.xml         # RSS feed
├── journal-atom.xml         # Atom feed
├── journal-entries.json     # Processed entries
├── journal-cms.js           # The CMS script
└── JOURNAL.md               # This documentation
```

## Styling Features

### Progressive Images

Images automatically get skeleton loading animations:

```markdown
Images: /img/photo.jpg
```

### Theme Support

All Markdown elements automatically adapt to dark/light themes:

- **Code blocks** - Subtle backgrounds that change with theme
- **Tables** - Bordered styling with theme-aware colors  
- **Links** - Accent color with smooth hover effects
- **Text** - Consistent typography and colors

### Responsive Design

- **Tables** scroll horizontally on mobile
- **Code blocks** have proper overflow handling
- **Images** scale to container width
- **Typography** remains readable on all screen sizes

## Advanced Usage

### Custom Styling

The system uses CSS variables for theming:

```css
--bg-color          /* Background color */
--text-color        /* Main text color */
--heading-color     /* Heading text color */
--accent-color      /* Links and highlights */
--skills-color      /* Secondary text color */
--font-secondary    /* Heading font family */
```

### Metadata Options

All metadata fields are optional except `Title`:

```
Title: Required - The post title
Subtitle: Optional - Appears below title in italic
Date: Optional - Defaults to file creation time
Tags: Optional - Comma-separated list
Excerpt: Optional - Uses first 100 chars if empty
Images: Optional - Comma-separated image URLs
```

### URL Structure

- Journal index: `/journal/`
- Individual entries: `/entry/story-slug.html`
- Archive: `/archive.html`
- RSS feed: `/journal-feed.xml`
- Atom feed: `/journal-atom.xml`

## Markdown Examples

### Complete Story Example

```
Title: Learning Something New
Subtitle: Reflections on continuous growth and curiosity
Date: 2025-08-29T14:30:00Z
Tags: learning, growth, development
Excerpt: Exploring what it means to stay curious and keep learning throughout life
Images: /img/learning.jpg

# The Joy of Discovery

There's something magical about that **"aha!" moment** when you finally understand a concept that's been puzzling you.

## Why Learning Matters

Learning isn't just about acquiring new skills—it's about:

- Staying curious about the world
- Building confidence through mastery  
- Connecting ideas in unexpected ways
- *Growing* as a person

> The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.
> — Brian Herbert

## Code Example

Sometimes the best way to learn is by doing:

```javascript
function learn(topic) {
    return practice(topic)
        .then(understand)
        .then(apply)
        .then(teach);
}
```

### Learning Resources Comparison

| Resource Type | Cost | Time Investment | Effectiveness |
|---------------|------|-----------------|---------------|
| Books         | Low  | High           | High          |
| Online Courses| Medium| Medium         | High          |
| Tutorials     | Free | Low            | Medium        |
| Practice      | Free | High           | Very High     |

---

The key is finding what works for you and staying consistent. Every expert was once a beginner.
```

This example showcases all the supported Markdown features in a natural, readable story format.

## Technical Notes

### HTML Safety

All Markdown content is properly escaped to prevent XSS attacks while still allowing rich formatting.

### Performance

- **Lazy loading** for images
- **Skeleton loading** for better perceived performance
- **Responsive images** coming soon
- **Minimal JavaScript** footprint

### Browser Support

Works in all modern browsers with graceful fallbacks for older ones.

The journal system is designed to be simple, powerful, and maintainable—perfect for personal blogs and content sites.