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
Image alt: What the first image shows | What the second image shows
Image caption: Caption under the first image | Caption under the second
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
- **Image alt** (optional): A short description of each image for people using screen readers, in the same order as Images and separated with `|`. Describe what's in the picture, not "image of". Without it, images get a generic description.
- **Image caption** (optional): A caption shown under each image, same order as Images, separated with `|`. Leave a slot empty to skip an image.
- **Subtitle** (optional): Appears below the main title

## Images

Put image files in `/assets/images/` and list them in `Images:` (e.g. `/assets/images/my-photo.jpg`). They open the entry by default.

To put an image partway through the text instead, add `[image 1]` on a line of its own where it should go. The number counts from the `Images:` list, so `[image 2]` is the second one.

PNGs with a transparent background show whole, with no rounded corners or shadow. JPGs are cropped to a fixed height.

The build makes smaller copies of every image for phones and picks the right one for each device, so use the largest original you have.

## Building

After adding or editing stories, run:

```bash
npm run sync    # Parse stories and regenerate all files
npm run build   # Full build with git info
npm run list    # List all stories
```

## Workflow

1. Create new `.txt` file in this folder
2. Run `npm run sync` to regenerate the journal, entries and RSS
3. Commit and push to deploy

That's it! Your stories are now live on your blog.