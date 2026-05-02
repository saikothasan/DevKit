# DevKit Design System - Visual Reference Guide

## Quick Reference

### Typography Quick Chart
```
Display    | Syne, 800 | H1: 3.5rem | H2: 2.625rem | H3: 2rem
Body       | DM Sans   | Regular: 1rem | Small: 0.9375rem
Code       | JetBrains | 0.9375rem
Labels     | DM Sans   | 0.875rem, 600w, uppercase
```

### Color Palette Quick Reference
```
PRIMARY:    #F38020 (Orange base)
SUCCESS:    #10B981 (Green)
WARNING:    #F59E0B (Amber)
ERROR:      #EF4444 (Red)
INFO:       #06B6D4 (Cyan)

TEXT:       #0F172A (light) / #F8FAFC (dark)
BORDER:     #E2E8F0 (light) / #334155 (dark)
BG:         #F8FAFC (light) / #0F172A (dark)
```

### Spacing Scale
```
8px  → 0.5rem    | 12px → 0.75rem   | 16px → 1rem
20px → 1.25rem   | 24px → 1.5rem    | 32px → 2rem
```

### Components Quick Reference

#### Buttons
```html
<!-- Primary CTA -->
<button class="btn btn-primary">Action</button>

<!-- Secondary Option -->
<button class="btn btn-secondary">Cancel</button>

<!-- Text Link -->
<button class="btn btn-tertiary">Link</button>

<!-- Large Button -->
<button class="btn btn-primary btn-lg">Big Action</button>
```

#### Cards
```html
<!-- Standard Card -->
<div class="card">
  <div class="card-header"><h3>Title</h3></div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Interactive Card -->
<div class="card card-interactive">Content</div>

<!-- Elevated Card -->
<div class="card card-elevated">Content</div>
```

#### Forms
```html
<div class="form-group">
  <label class="form-label form-label-required">Email</label>
  <input type="email" class="input-styled" />
  <span class="form-hint">We'll never share</span>
</div>
```

#### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-error">Error</span>
<span class="badge-mono">CODE</span>
```

#### Typography
```html
<h1>Main Heading</h1>
<h2>Section Heading</h2>
<p class="subtitle">Large secondary text</p>
<p>Regular paragraph text</p>
<p class="caption">SMALL LABEL TEXT</p>
```

### Responsive Breakpoints
- Mobile: 0-640px
- Tablet: 641-1024px
- Desktop: 1025px+

### Focus & Accessibility
- Focus outline: 2px solid primary
- Outline offset: 2px
- Always visible, never hidden
- Contrast minimum: 4.5:1

### Animations
- Fast: 150ms (interactions)
- Standard: 200ms (default)
- Slow: 300ms (transitions)
- Easing: cubic-bezier(0.2, 0, 0.38, 0.9)

### Shadow System
- Default card: 0 4px 12px rgba(0,0,0,0.08)
- Hover card: 0 10px 40px rgba(243,128,32,0.08)
- Button primary: 0 4px 12px rgba(243,128,32,0.25)

---

## Common Patterns

### Section with Title
```html
<section class="section">
  <h2 class="section-title">Section Title</h2>
  <p class="section-description">Description text</p>
  <!-- Content -->
</section>
```

### Feature Card
```html
<div class="card card-interactive">
  <div class="card-body space-y-normal">
    <h3>Feature Title</h3>
    <p>Feature description</p>
    <button class="btn btn-primary btn-sm">Learn More</button>
  </div>
</div>
```

### Form Section
```html
<div class="space-y-relaxed">
  <div class="form-group">
    <label class="form-label">Field Label</label>
    <input class="input-styled" />
  </div>
  <button class="btn btn-primary">Submit</button>
</div>
```

### Data Display
```html
<div class="data-grid">
  <span class="data-label">Label:</span>
  <span class="data-value">Value</span>
</div>
```

---

## CSS Variables Available

### Colors
`--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`
`--primary-base`, `--primary-light`, `--primary-dark`, `--primary-tint`, `--primary-ring`
`--success-base`, `--warning-base`, `--error-base`, `--info-base`
`--background`, `--surface`, `--border-default`

### Spacing
All spacing uses CSS unit values: 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 3rem

### Radius
`--radius-sm` (0.5rem), `--radius-md` (0.75rem), `--radius-lg` (1rem)

---

## Implementation Tips

1. **Always use CSS variables** for colors
2. **Maintain line-height** for readability (1.6-1.75)
3. **Use semantic text classes** (subtitle, caption)
4. **Group related spacing** with gap utilities
5. **Keep focus rings visible** - accessibility first
6. **Use card system** for contained content
7. **Apply form-group** around label+input
8. **Test responsive** at all breakpoints
9. **Verify contrast** before shipping
10. **Use professional button variants** appropriately

---

*Last updated: 2026-05-02*
