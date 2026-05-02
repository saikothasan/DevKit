# DevKit - WCAG 2.2 AA Accessibility Guide

Complete checklist and implementation guide for WCAG 2.2 AA compliance across DevKit.

---

## 1. Executive Summary

DevKit targets **WCAG 2.2 Level AA** compliance, meeting legal requirements and best practices for accessibility.

| Category | Status | Coverage |
|----------|--------|----------|
| Perceivable | ✅ In Progress | Images, color, text |
| Operable | ✅ In Progress | Keyboard, navigation, focus |
| Understandable | ✅ In Progress | Language, instructions, errors |
| Robust | ✅ In Progress | HTML, ARIA, compatibility |

---

## 2. Perceivable - Users Can See/Hear Content

### 2.1 Color Contrast (WCAG AA)

**Requirement**: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)

#### Current Implementation
```css
/* Check all text colors against backgrounds */
--text-primary: #0F172A on white = 15.5:1 ✅
--text-secondary: #475569 on white = 8.3:1 ✅
--text-tertiary: #78909C on white = 5.1:1 ⚠️ (only use for secondary text)
--text-muted: #94A3B8 on white = 3.9:1 ❌ (don't use for critical info)
```

#### Audit Checklist
- [ ] All body text: 4.5:1 minimum
- [ ] Large text (18pt+): 3:1 minimum
- [ ] Links: Distinguishable from surrounding text
- [ ] Buttons: 3:1 against background
- [ ] Form errors: Visible even in grayscale
- [ ] Borders: Sufficient contrast with background

#### Tools
- **WebAIM Contrast Checker**: webaim.org/resources/contrastchecker
- **Accessible Colors**: accessible-colors.com
- **Chrome DevTools**: Inspect > Accessibility tab

#### Implementation
```html
<!-- Good: High contrast -->
<p style="color: var(--text-primary); background: white;">
  Important information
</p>

<!-- Bad: Low contrast on muted text -->
<p style="color: var(--text-muted); background: white;">
  Can't read this
</p>

<!-- Good: Error with icon + color -->
<div style="color: var(--error-base);">
  ❌ Email format incorrect
</div>

<!-- Bad: Color alone -->
<div style="color: var(--error-base);">
  Email format incorrect (no icon)
</div>
```

---

### 2.2 Images & Graphics

**Requirement**: All images have alternative text

#### Alt Text Rules

| Situation | Alt Text | Example |
|-----------|----------|---------|
| Decorative image | Empty string `alt=""` | Spacer, design element |
| Informative icon | Short description | `alt="Check mark"` |
| Functional icon | Action description | `alt="Delete message"` |
| Complex diagram | Detailed description | Describe key information |
| Photo | Describe content | `alt="Team meeting in office"` |
| Logo | Company name | `alt="DevKit logo"` |
| Chart/graph | Data summary | `alt="Growth 45% YoY"` |

#### Examples
```html
<!-- Good: Describes image -->
<img src="loading-spinner.svg" alt="Loading" />

<!-- Good: Action description -->
<button>
  <img src="trash-icon.svg" alt="Delete" />
</button>

<!-- Good: Informative text -->
<img src="team-photo.jpg" 
  alt="DevKit team members collaborating in office" />

<!-- Bad: Filename as alt text -->
<img src="screenshot-2024.png" alt="screenshot-2024" />

<!-- Bad: Decorative image with text -->
<img src="spacer.png" alt="spacer" /> <!-- Should be alt="" -->

<!-- Bad: No alt text -->
<img src="important-chart.png" />
```

#### Icons in Code
```tsx
// Good: Label with icon
<button aria-label="Copy to clipboard">
  <Icon name="copy" />
</button>

// Bad: Icon with no label
<button>
  <Icon name="copy" />
</button>

// Good: Icon + visible text
<button>
  <Icon name="trash" /> Delete
</button>

// Good: SVG with title
<svg>
  <title>Loading spinner</title>
  <circle cx="50" cy="50" r="40" />
</svg>
```

---

### 2.3 Readable Text

**Requirement**: Text is readable and resizable

#### Font Size
```css
/* Minimum 14px for body text */
body { font-size: 16px; } ✅
button { font-size: 14px; } ✅
label { font-size: 12px; } ❌ Too small

/* Use relative units for scaling */
body { font-size: clamp(14px, 5vw, 18px); } ✅
```

#### Line Height
```css
/* Minimum 1.4× for body text */
p { line-height: 1.65; } ✅
caption { line-height: 1.4; } ✅

/* Headings can be tighter */
h1 { line-height: 1.25; } ✅
```

#### Line Length
- Body text: 60-80 characters per line (optimal)
- Headings: can be longer
- Use max-width to control

```css
main {
  max-width: 80ch; /* ~80 characters */
}
```

#### Letter Spacing
- Default: Use browser default
- Headlines: Can use negative letter-spacing (-0.02em to -0.03em)
- Avoid: letter-spacing > 0.12em (makes text hard to read)

---

### 2.4 Audio/Video

**Requirement**: Video has captions; audio has transcript

#### Video Captions
```html
<!-- Good: Video with captions -->
<video>
  <source src="tutorial.mp4" />
  <track kind="captions" src="captions.vtt" />
</video>

<!-- Bad: No captions -->
<video>
  <source src="tutorial.mp4" />
</video>
```

#### Audio Transcript
```html
<!-- Good: Audio with transcript link -->
<audio src="podcast.mp3"></audio>
<a href="#transcript">Read transcript</a>

<section id="transcript">
  <h3>Podcast Transcript</h3>
  <p>[Host]: Welcome to DevKit...</p>
</section>

<!-- Bad: No transcript -->
<audio src="podcast.mp3"></audio>
```

---

## 3. Operable - Users Can Navigate & Interact

### 3.1 Keyboard Navigation

**Requirement**: All functionality available via keyboard

#### Tab Order
```html
<!-- Good: Logical tab order (left→right, top→bottom) -->
<input type="email" /> <!-- Tab 1 -->
<input type="password" /> <!-- Tab 2 -->
<button>Login</button> <!-- Tab 3 -->

<!-- Bad: Illogical tab order -->
<!-- When native order is wrong, explicitly set -->
<button tabindex="3">Submit</button> <!-- Avoid this -->
<input type="text" tabindex="1" />
<input type="text" tabindex="2" />
```

#### Focus Visible
```css
/* Good: Always visible focus indicator */
button:focus-visible {
  outline: 2px solid var(--primary-base);
  outline-offset: 2px;
}

/* Bad: Removing focus outline */
button:focus {
  outline: none; /* Never do this */
}

/* Good: Custom focus styles */
button:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-ring);
  border-color: var(--primary-base);
}
```

#### Skip Links
```html
<!-- Good: Skip to main content -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<header>...</header>
<nav>...</nav>

<main id="main-content">
  <!-- Page content here -->
</main>

<!-- CSS to hide but make visible to keyboards -->
<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary-base);
    color: white;
    padding: 8px;
    text-decoration: none;
  }
  
  .skip-link:focus {
    top: 0; /* Show on focus */
  }
</style>
```

#### Interactive Elements
```html
<!-- Good: Focusable elements -->
<button>Click me</button>
<a href="/page">Link</a>
<input type="text" />

<!-- Bad: Non-focusable interactive -->
<div onclick="doSomething()">Click me</div> ← Can't tab to this

<!-- Good: Make custom elements focusable -->
<div role="button" tabindex="0" onclick="doSomething()">
  Click me
</div>

<!-- Better: Use semantic elements -->
<button onclick="doSomething()">Click me</button>
```

---

### 3.2 Focus Management

**Requirement**: Focus should move logically through page

#### Dialog/Modal Focus
```tsx
// Good: Trap focus inside dialog
export function Modal({ isOpen, onClose }) {
  const firstButtonRef = useRef();
  const lastButtonRef = useRef();
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstButtonRef.current) {
        e.preventDefault();
        lastButtonRef.current.focus();
      } else if (!e.shiftKey && document.activeElement === lastButtonRef.current) {
        e.preventDefault();
        firstButtonRef.current.focus();
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div role="dialog" onKeyDown={handleKeyDown}>
      <button ref={firstButtonRef}>First button</button>
      <input type="text" />
      <button ref={lastButtonRef}>Last button</button>
    </div>
  );
}
```

---

### 3.3 Touch Targets

**Requirement**: Interactive elements are 44×44px minimum (mobile), 24×24px desktop

#### Touch Target Sizes
```css
/* Mobile: 48×48dp (Material) or 44×44px (Apple) */
@media (max-width: 768px) {
  button, a, input {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Maintain minimum spacing */
  button + button {
    margin-left: 8px; /* Gap between targets */
  }
}

/* Desktop: Can be smaller but still easy to click */
button {
  padding: 8px 16px; /* At least 32×32px with padding */
  min-height: 24px;
  min-width: 24px;
}
```

#### Spacing Between Targets
```css
/* Minimum 8px gap to prevent accidental taps */
button {
  margin-right: 8px;
}

/* Or use gap in flexbox */
.button-group {
  display: flex;
  gap: 8px;
}
```

---

## 4. Understandable - Users Understand Content

### 4.1 Clear Language

**Requirement**: Content is written in clear, simple language

#### Readability Guidelines
```
❌ Bad: "Utilize this functionality to effectuate the extraction of numerical identifiers"
✅ Good: "Extract card numbers from text"

❌ Bad: "Invalid input detected"
✅ Good: "Email must include @ symbol. Example: name@company.com"

❌ Bad: "Please ascertain your identity via the email received"
✅ Good: "Check your email and click the link to confirm your identity"
```

**Target**: Flesch Reading Ease > 60 (high school level)

#### Testing Tools
- **Hemingway Editor**: hemingwayapp.com (free)
- **Grammarly**: grammarly.com
- **Readability Checker**: readability-score.com

---

### 4.2 Headings & Structure

**Requirement**: Page has proper heading hierarchy (H1→H2→H3)

#### Correct Structure
```html
<!-- Good: Logical hierarchy -->
<h1>DevKit - BIN Checker</h1>
  <h2>Enter BIN</h2>
    <h3>Single BIN</h3>
    <h3>Multiple BINs</h3>
  <h2>Results</h2>
    <h3>Found Results</h3>
    <h3>Failed Results</h3>

<!-- Bad: Skipping levels -->
<h1>Title</h1>
<h3>Subheading</h3> <!-- ← Should be H2 -->

<!-- Bad: Multiple H1s per page -->
<h1>Page Title</h1>
<main>
  <h1>Another H1</h1> <!-- ← Only one H1 per page -->
</main>
```

#### Semantic HTML
```html
<!-- Good: Semantic structure -->
<header>
  <nav>Navigation</nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
  </article>
</main>

<aside>
  <h2>Related</h2>
</aside>

<footer>
  Footer content
</footer>

<!-- Bad: Divs everywhere -->
<div id="header">
  <div id="nav">Navigation</div>
</div>

<div id="main">
  <div id="article">
    <h1>Article Title</h1>
  </div>
</div>
```

---

### 4.3 Form Labels & Instructions

**Requirement**: Form fields have associated labels and clear instructions

#### Form Field Markup
```html
<!-- Good: Label associated with input -->
<label for="email">Email Address</label>
<input id="email" type="email" />

<!-- Good: Help text linked via aria-describedby -->
<label for="password">Password</label>
<input 
  id="password"
  type="password"
  aria-describedby="pwd-hint"
/>
<div id="pwd-hint">
  Minimum 8 characters, 1 number
</div>

<!-- Bad: No label -->
<input type="email" placeholder="Email" />

<!-- Bad: Label not associated -->
<label>Email</label>
<input type="email" />

<!-- Bad: Placeholder as label -->
<input type="email" placeholder="Email Address" />
```

#### Error Messages
```html
<!-- Good: Error linked to input -->
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Email must include @ symbol
</div>

<!-- Bad: Error not associated -->
<input type="email" />
<span>Email required</span>

<!-- Bad: Role alert missing -->
<span>Email required</span>
```

---

## 5. Robust - Works with Assistive Technology

### 5.1 ARIA (Accessible Rich Internet Applications)

**Requirement**: Custom components have proper ARIA roles and attributes

#### Common ARIA Patterns

```html
<!-- Dialog/Modal -->
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
</div>

<!-- Tabs -->
<div role="tablist">
  <button 
    role="tab" 
    aria-selected="true" 
    aria-controls="panel1"
  >
    Tab 1
  </button>
  <div id="panel1" role="tabpanel">Panel 1</div>
</div>

<!-- Dropdown Menu -->
<button aria-haspopup="true" aria-expanded="false">
  Menu
</button>

<!-- Icon Button (no visible text) -->
<button aria-label="Close dialog">
  ✕
</button>

<!-- Loading Spinner -->
<div aria-label="Loading" role="status" aria-live="polite">
  <Spinner />
</div>

<!-- Skip Link -->
<a href="#main-content" class="sr-only">
  Skip to main content
</a>
```

#### When to Use ARIA
- **Do**: Use ARIA to enhance semantic HTML
- **Don't**: Use ARIA instead of semantic HTML
- **Don't**: Use empty ARIA (aria-label="")

```html
<!-- Good: Semantic HTML + ARIA enhancement -->
<button aria-label="Delete message">
  <TrashIcon />
</button>

<!-- Bad: ARIA instead of HTML -->
<div role="button" onclick="delete()">Delete</div>

<!-- Better: Use semantic element -->
<button onclick="delete()">Delete</button>
```

---

### 5.2 Semantic HTML

**Requirement**: Use semantic elements correctly

#### Semantic Elements
```html
<!-- Header/Navigation -->
<header>Logo, main navigation</header>
<nav>Navigation links</nav>

<!-- Main Content -->
<main>Primary page content</main>
<article>Self-contained article</article>
<section>Logical grouping</section>
<aside>Sidebar, related content</aside>

<!-- Lists -->
<ul>Unordered list</ul>
<ol>Ordered list</ol>
<dl>Definition list</dl>

<!-- Emphasis -->
<strong>Important text</strong>
<em>Emphasized text</em>

<!-- Footer -->
<footer>Copyright, links</footer>
```

---

### 5.3 Testing with Assistive Technology

#### Screen Reader Testing
- **NVDA** (Windows, free): nvaccess.org
- **JAWS** (Windows, paid): freedomscientific.com
- **VoiceOver** (Mac/iOS, built-in): Hold Command+F5
- **TalkBack** (Android, built-in): Settings > Accessibility

#### Testing Checklist
- [ ] Can you navigate with Tab key only?
- [ ] Does screen reader announce everything?
- [ ] Are all images described?
- [ ] Are form fields labeled correctly?
- [ ] Are errors announced?
- [ ] Are interactive elements announced as buttons/links?

---

## 6. Implementation Checklist

### Per Page
- [ ] One `<h1>` per page
- [ ] Heading hierarchy correct (no skips)
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] All buttons have clear labels
- [ ] Focus visible on all interactive elements
- [ ] Color contrast 4.5:1 minimum
- [ ] Touch targets 44×44px minimum
- [ ] No keyboard traps
- [ ] Tab order logical

### Forms Specifically
- [ ] Labels associated with inputs (`for` attribute)
- [ ] Error messages linked via `aria-describedby`
- [ ] Help text linked via `aria-describedby`
- [ ] Form validated with `novalidate` if custom
- [ ] Error messages have `role="alert"`
- [ ] Required fields marked visually + text
- [ ] Placeholder not used as label

### Interactive Elements
- [ ] Icons have aria-label if no text
- [ ] Dropdowns have `aria-expanded`
- [ ] Modals have `aria-modal` and focus trap
- [ ] Loading states have `aria-live="polite"`
- [ ] Skip links present

---

## 7. Common Mistakes

| ❌ Mistake | ✅ Fix | Why |
|-----------|--------|-----|
| `<div onclick="">` | `<button>` | Semantic + keyboard support |
| No alt text | `alt="Description"` | Screen reader access |
| Color only error | Color + icon + text | Color-blind users |
| Removed focus outline | Keep outline or style it | Keyboard users need it |
| Placeholder as label | Actual `<label>` | Won't disappear on input |
| Multiple H1s | One H1 per page | Screen reader navigation |
| `aria-label` on `<div>` | Use semantic element | ARIA is enhancement, not replacement |

---

## 8. Tools & Resources

### Automated Testing
- **axe DevTools**: axe.dev (Chrome/Firefox extension)
- **WAVE**: wave.webaim.org (Chrome/Firefox extension)
- **Lighthouse**: Built into Chrome DevTools
- **pa11y**: pa11y.org (command-line)

### Manual Testing
- Keyboard: Tab through page, check focus
- Screen reader: Test with NVDA/JAWS/VoiceOver
- Zoom: 200% zoom should still work
- Color: Grayscale mode to test contrast

### Documentation
- **WCAG 2.2**: w3.org/WAI/WCAG22/quickref (official)
- **WAI-ARIA**: w3.org/WAI/ARIA (patterns)
- **MDN Accessibility**: developer.mozilla.org/en-US/docs/Web/Accessibility

---

## 9. Compliance Audit

### Current Status (Start Here)
- [ ] Images: All alt text audit
- [ ] Forms: All labels audit
- [ ] Colors: Contrast audit
- [ ] Keyboard: Full keyboard test
- [ ] Headings: Hierarchy audit
- [ ] ARIA: Custom component audit

### Run Tests
```bash
# Install pa11y-ci for automated testing
npm install -g pa11y-ci

# Test all pages
pa11y-ci --config .pa11yci.json
```

### Document Issues
```
Issue: Form label missing on email input
Severity: Critical (blocks keyboard users)
Location: /login page
Fix: Add <label for="email">Email</label>
Status: To-do
```

---

## 10. Team Responsibility

| Role | Responsibility |
|------|-----------------|
| **Designers** | Include accessibility in mockups, label interactions |
| **Developers** | Implement accessible HTML/ARIA, test with keyboard |
| **QA** | Test with assistive technology, audit color contrast |
| **PMs** | Prioritize accessibility in roadmap |
| **Everyone** | Learn basics, ask before implementing |

---

## 11. Resources for Learning

- **WebAIM Articles**: webaim.org/articles
- **Scott O'Hara Blog**: scottohara.me
- **Sara Soueidan**: sarasoueidan.com/blog
- **Marcy Sutton**: marcysutton.com
- **Udacity Accessibility Course**: free course

---

## Version History
- v1.0 - Initial WCAG 2.2 AA checklist
- Check back for compliance audit results
