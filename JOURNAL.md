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
Images: /assets/images/photo1.jpg, /assets/images/photo2.jpg
Image alt: What the first photo shows | What the second photo shows
Image caption: A caption under the first photo | A caption under the second

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

### Images

List a story's images in `Images:`. By default they open the entry, above the first paragraph.

**Placing an image in the text.** Put `[image N]` on a line of its own, where `N` counts from the `Images:` list. That image shows there instead of at the top, and the RSS and Atom feeds show it in the same place:

```
So I captured it like a Polaroid.

[image 1]

I didn't know exactly why at the time...
```

**Alt text.** `Image alt:` describes each image for people using screen readers, in the same order as `Images:` and separated with `|`. Describe what's in the picture, not "image of".

**Captions.** `Image caption:` adds a caption under each image, same order, separated with `|`. Leave a slot empty to skip one: `Image caption: | Caption for the second image`.

**Transparent PNGs.** JPGs fill the column at a fixed height (400px, 250px on phones), cropped to fit, with rounded corners and a shadow. PNGs show whole, at their own shape, with no corners or shadow, so cutouts and scattered prints sit right on the page in light and dark mode.

**Sizes and speed.** Put originals in `assets/images/`. The build makes a full-size `.webp` (up to 1600px wide) plus 400, 800 and 1200px copies, and each page lists them so every device downloads the smallest one that's still sharp. Phones usually get the 800px copy. Nothing to do by hand; `npm run build` handles it.

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
Image alt: Optional - One description per image, separated with |
Image caption: Optional - One caption per image, separated with |
Draft: Optional - true keeps it unpublished, with a local preview in /drafts/
```

### Drafts

Add `Draft: true` to a story to work on it without publishing. The build leaves it out of the journal, both feeds, related posts and the older/newer links, and makes a preview at `/drafts/<slug>.html` with a "Draft preview" notice. Git ignores `/drafts/`, so previews never deploy. Delete the line (or set it to `false`) to publish. If a published story is marked as a draft again, its page under `/entry/` is removed.

The story file is committed like any other, so its text is visible in the repository.

### Link Previews

Entry pages carry Open Graph and Twitter card tags (title, excerpt, URL, publish date, tags and image), so shared links show a preview card. `scripts/build-share-images.js` makes a 1200x630 JPG for each entry from its first image at `/assets/share/<slug>.jpg`: photos are cropped to fill, transparent PNGs are placed whole on a paper-colored background. Entries without images use the avatar.

### Styles

Entry pages share `/css/entry.css` and the journal page uses `/css/journal.css`, so the browser downloads them once and reuses them. Edit those files directly; the generated pages just link to them.

### URL Structure

- Journal index: `/journal/`
- Individual entries: `/entry/story-slug.html`
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