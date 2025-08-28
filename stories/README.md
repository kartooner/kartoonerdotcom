# Stories Format

This folder contains your journal entries in simple text files that get automatically converted to your blog.

## File Naming Convention

Use the format: `YYYY-MM-DD-title.txt`

Examples:
- `2024-08-28-my-great-adventure.txt`
- `2024-12-25-christmas-reflections.txt`

## Story File Format

Each `.txt` file should start with metadata, followed by a blank line, then your content:

```
Title: Your Story Title
Date: 2024-08-28T12:00:00Z
Tags: tag1, tag2, tag3
Excerpt: Brief description that appears in archive and RSS
Images: image1.jpg, image2.jpg
Subtitle: Optional subtitle (appears below title)

Your story content goes here. You can use simple markdown:

**Bold text** and *italic text* work.

> This is a blockquote
> — Attribution goes here

- Unordered list item
- Another item
- Third item

1. Ordered list item
2. Second item  
3. Third item

Paragraphs are separated by double line breaks.
```

## Metadata Fields

- **Title** (required): The title of your story
- **Date** (required): ISO date format, used for sorting
- **Tags** (optional): Comma-separated tags
- **Excerpt** (optional): Brief description, auto-generated if not provided
- **Images** (optional): Comma-separated image URLs
- **Subtitle** (optional): Appears below the main title

## Building

After adding or editing stories, run:

```bash
npm run sync    # Parse stories and regenerate all files
npm run build   # Full build with git info
npm run list    # List all stories
```

## Workflow

1. Create new `.txt` file in this folder
2. Run `npm run sync` to regenerate blog/archive/RSS
3. Commit and push to deploy

That's it! Your stories are now live on your blog.