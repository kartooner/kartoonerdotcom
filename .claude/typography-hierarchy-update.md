# Typography Hierarchy Update - About Page

## Visual Hierarchy Adjustment

Updated the about page typography to establish clear visual hierarchy with the **bio section as the primary focal point**.

## New Typography Scale

### **Hero Section (Bio + Avatar) - MOST PROMINENT**

#### Bio First Paragraph (Hero Text):
- **Font**: Cartridge Rough (display font)
- **Size**: `var(--text-2xl)` → **25-31.25px** (fluid)
- **Line-height**: 1.4 (tighter for display text)
- **Purpose**: Primary attention-grabber, sets the tone

#### Bio Secondary Paragraphs:
- **Font**: Manrope (body font)
- **Size**: `var(--text-lg)` → **18-21.6px** (fluid)
- **Line-height**: 1.6 (comfortable reading)
- **Purpose**: Supporting bio content, still prominent

#### Avatar:
- **Size**: 280px desktop, 200px mobile
- **Border**: 4px accent color
- **Position**: 4 columns (33% of grid)

---

### **Secondary Sections - LESS PROMINENT**

#### Section Headings (Career, Reading, Movies):
- **Font**: Cartridge Rough
- **Size**: `var(--text-2xl)` → **25-31.25px** (fluid)
- **Note**: Same size as bio hero text BUT less visual weight due to:
  - Accent color (not body text color)
  - More spacing around them
  - Positioned lower on page

#### Section Intro Text:
- **Font**: Manrope
- **Size**: `var(--text-sm)` → **14-15px** (fluid)
- **Color**: Skills color (muted)
- **Purpose**: Subtle context, doesn't compete with bio

#### Book/Movie Titles:
- **Font**: Manrope
- **Size**: `var(--text-lg)` → **18-21.6px** (fluid)
- **Purpose**: Same size as bio secondary paragraphs, maintains consistency

#### Book/Movie Descriptions:
- **Font**: Manrope
- **Size**: `var(--text-sm)` → **14-15px** (fluid)
- **Purpose**: Supporting detail, subtle and readable

---

## Visual Weight Comparison

```
MOST PROMINENT:
├─ Bio Hero Text (2xl, Cartridge Rough, dark text)
├─ Avatar (large, bordered, left column)
└─ Bio Secondary (lg, Manrope, dark text)

MEDIUM PROMINENCE:
├─ Section Headings (2xl, Cartridge Rough, accent color)
└─ Book/Movie Titles (lg, Manrope, standard text)

LEAST PROMINENT:
├─ Section Intros (sm, muted color)
└─ Book/Movie Descriptions (sm, standard text)
```

## Responsive Behavior

### Mobile (≤768px):
- **Bio Hero**: Scales down to `var(--text-xl)` (20.25-25.9px)
- **Bio Secondary**: Maintains `var(--text-lg)` (18-21.6px)
- **Section Headings**: Maintain `var(--text-2xl)` (25-31.25px)
- **Everything else**: Scales naturally with fluid typography

## Result

The bio section now clearly dominates the visual hierarchy:
1. ✅ **Largest text** on the page (bio hero paragraph)
2. ✅ **Most visual weight** (dark text + display font + prominent position)
3. ✅ **Avatar draws attention** (large, bordered, positioned first)
4. ✅ **Sections below are supportive** (smaller intro text, muted colors)
5. ✅ **Clear reading flow** from hero → secondary bio → other content

This creates a natural reading pattern where visitors immediately focus on your personal story and avatar, then can explore additional content below.
