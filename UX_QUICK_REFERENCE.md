# DevKit - UX Quick Reference Card

**Fast lookup guide for common UX decisions**

---

## Typography Quick Reference

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|------------|
| **H1** | Syne | 2.5rem | 800 | 1.25 |
| **H2** | Syne | 2rem | 800 | 1.25 |
| **H3** | Syne | 1.5rem | 700 | 1.25 |
| **H4** | DM Sans | 1.25rem | 700 | 1.4 |
| **Body** | DM Sans | 1rem | 400 | 1.65 |
| **Small** | DM Sans | 0.875rem | 400 | 1.6 |
| **Caption** | DM Sans | 0.8125rem | 500 | 1.5 |
| **Code** | JetBrains Mono | 0.9rem | 400 | 1.6 |

---

## Spacing Scale

| Name | Value | Pixels | When to Use |
|------|-------|--------|------------|
| Tight | 0.5rem | 8px | Button gaps, small spacing |
| Compact | 0.875rem | 14px | Form field gaps |
| Normal | 1.25rem | 20px | Section spacing |
| Relaxed | 1.5rem | 24px | Card padding |
| Loose | 2rem | 32px | Large section gaps |

---

## Color Quick Reference

| Name | Hex | Use Case |
|------|-----|----------|
| **Primary (Orange)** | #F38020 | CTAs, brands, primary actions |
| **Primary Light** | #FB923C | Hover states, lighter emphasis |
| **Primary Dark** | #E5720F | Dark hover, active states |
| **Success** | #10B981 | Confirmations, valid states |
| **Error** | #EF4444 | Errors, destructive actions |
| **Warning** | #F59E0B | Warnings, caution |
| **Info** | #06B6D4 | Information, help text |
| **Text Primary** | #0F172A | Main body text |
| **Text Secondary** | #475569 | Secondary text |
| **Text Tertiary** | #78909C | Supporting text |
| **Text Muted** | #94A3B8 | Disabled, subtle text |

---

## Button Quick Reference

```tsx
// Primary CTA
<button className="btn btn-primary">
  Check BIN (Instant)
</button>

// Secondary Action
<button className="btn btn-secondary">
  Save Draft
</button>

// Tertiary (Text)
<button className="btn btn-tertiary">
  Learn More
</button>

// Large Button
<button className="btn btn-primary btn-lg">
  Generate Cards
</button>

// Small Button
<button className="btn btn-sm">
  Copy
</button>
```

---

## Form Field Quick Reference

```tsx
<div className="form-group">
  <label className="form-label form-label-required">
    Email Address
  </label>
  <input className="input-styled" type="email" />
  <div className="form-hint">
    We use this to verify your account
  </div>
  <div className="form-error" hidden>
    Email must include @ symbol
  </div>
</div>
```

---

## States Quick Reference

### Loading
```tsx
<LoadingState 
  title="Checking BINs"
  progress={{ current: 3, total: 10 }}
/>
```
**Use when**: Async operation > 500ms

### Error
```tsx
<ErrorState
  title="Connection Failed"
  message="Network error. Check your connection."
  action={{ label: "Retry", onClick: retry }}
/>
```
**Use when**: Network error, validation error, server error

### Empty
```tsx
<EmptyState
  title="No Messages"
  description="Start a conversation to see messages here"
  action={{ label: "Send Message", onClick: send }}
/>
```
**Use when**: No data to display

### Success
```tsx
<SuccessState
  title="Email Verified"
  message="Your account is now fully set up"
  action={{ label: "Continue", onClick: next }}
/>
```
**Use when**: Task completed successfully

---

## Microcopy Cheat Sheet

### Button Labels
```
✅ "Check BIN (Instant)"    ❌ "Submit"
✅ "Generate Test Cards"    ❌ "OK"
✅ "Export as CSV"          ❌ "Go"
✅ "Delete Account"         ❌ "Remove"
```

### Error Messages
```
✅ "Email must include @ symbol"     ❌ "Invalid email"
✅ "Network disconnected. Retry?"    ❌ "Error"
✅ "Wait 60 seconds before trying"   ❌ "Too many requests"
```

### Help Text
```
✅ "We use this to verify you"       ❌ "Required"
✅ "6+ digits, no letters"           ❌ "Enter BIN"
✅ "Search by email or username"     ❌ "Find user"
```

### Form Labels
```
✅ "Email Address"                   ❌ "Contact"
✅ "Phone Number (Optional)"         ❌ "Phone"
✅ "Password (8+ characters)"        ❌ "Pass"
```

---

## Accessibility Checklist (Per Page)

- [ ] **One H1** per page
- [ ] **Heading hierarchy** correct (no skips)
- [ ] **All images** have alt text
- [ ] **All form fields** have labels
- [ ] **All buttons** have clear labels
- [ ] **Focus visible** on interactive elements
- [ ] **Color contrast** 4.5:1+ (text), 3:1+ (large text)
- [ ] **Touch targets** 44×44px minimum
- [ ] **No keyboard traps**
- [ ] **Tab order** logical

---

## Responsive Breakpoints

| Device | Width | Strategy |
|--------|-------|----------|
| Mobile | < 640px | Stack vertical, single column |
| Tablet | 640-1024px | 2 columns, adjusted spacing |
| Desktop | > 1024px | Full layout, expanded spacing |

---

## Common Mistakes & Fixes

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| No alt text on images | `alt="Description of image"` |
| Placeholder as label | Use `<label>` element |
| No focus indicator | Add `outline: 2px solid var(--primary)` |
| Color-only error indication | Add error icon + text |
| Removed form labels | Keep labels visible |
| Generic "Error" message | "Email must include @" |
| Tiny touch targets | 44×44px minimum |
| No loading state | Show progress (3 of 10) |

---

## Component Imports

```tsx
// Form patterns
import { FormField } from '@/components/UXPatterns';

// State patterns
import { LoadingState, ErrorState, EmptyState, SuccessState } from '@/components/UXPatterns';

// Layout
import { CardSection } from '@/components/UXPatterns';

// Notifications
import { Toast } from '@/components/UXPatterns';

// Loading placeholders
import { SkeletonLoader } from '@/components/UXPatterns';
```

---

## CSS Classes Quick Reference

### Typography
```css
.text-lg        /* 1.125rem */
.text-base      /* 1rem */
.text-sm        /* 0.9375rem */
.text-xs        /* 0.8125rem */

.text-bold      /* font-weight: 700 */
.text-semibold  /* font-weight: 600 */
.text-normal    /* font-weight: 400 */

.tracking-tight   /* letter-spacing: -0.02em */
.tracking-wide    /* letter-spacing: 0.025em */
.tracking-widest  /* letter-spacing: 0.1em */
```

### Components
```css
.btn              /* Button base */
.btn-primary      /* Primary button */
.btn-secondary    /* Secondary button */
.btn-tertiary     /* Text button */

.card             /* Card container */
.card-header      /* Card header */
.card-body        /* Card body */
.card-footer      /* Card footer */

.badge            /* Badge base */
.badge-primary    /* Primary badge */
.badge-success    /* Success badge */
.badge-error      /* Error badge */

.input-styled     /* Styled input */
.form-group       /* Form group container */
.form-label       /* Form label */
.form-error       /* Error message */
.form-hint        /* Help text */
```

### Layout
```css
.space-y-normal   /* Vertical gap */
.space-x-normal   /* Horizontal gap */
.p-comfortable    /* Padding */
.m-normal         /* Margin */
```

---

## Design Token CSS Variables

```css
/* Colors */
--primary-base: #F38020
--primary-light: #FB923C
--primary-dark: #E5720F
--primary-tint: rgba(243, 128, 32, 0.08)
--primary-ring: rgba(243, 128, 32, 0.12)

--success-base: #10B981
--error-base: #EF4444
--warning-base: #F59E0B
--info-base: #06B6D4

--text-primary: #0F172A
--text-secondary: #475569
--text-tertiary: #78909C
--text-muted: #94A3B8

--surface: #FFFFFF
--surface-hover: #FAFBFC
--surface-active: #F3F7FB

--border-default: #E2E8F0
--border-focus: #CBD5E1

/* Fonts */
--font-sans: 'DM Sans', sans-serif
--font-display: 'Syne', sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Radius */
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 16px
```

---

## Testing Checklist (Quick)

### Keyboard
- [ ] Tab through entire page
- [ ] Focus always visible
- [ ] Can exit all modals/dropdowns
- [ ] No traps

### Colors
- [ ] Text on bg: 4.5:1 contrast
- [ ] Large text: 3:1 contrast
- [ ] Not color-only for meaning

### Mobile
- [ ] Touch targets 44×44px
- [ ] Responsive layout works
- [ ] No horizontal scroll
- [ ] Performance < 3s

### Forms
- [ ] All fields have labels
- [ ] Errors clearly visible
- [ ] Help text provided
- [ ] Error recovery clear

---

## Resources

| Task | Resource |
|------|----------|
| Full UX Guide | PROFESSIONAL_UX_IMPLEMENTATION.md |
| Strategy & Research | UX_IMPROVEMENT_STRATEGY.md |
| Writing Guide | MICROCOPY_GUIDELINES.md |
| Accessibility | ACCESSIBILITY_WCAG_GUIDE.md |
| Design Tokens | PROFESSIONAL_DESIGN_SYSTEM.md |
| Components | UXPatterns.tsx |

---

## One-Page Quick Start

1. **Use the typography scale** (H1-H6, body, caption)
2. **Use the color system** (primary, semantic colors)
3. **Use the spacing scale** (8px base)
4. **Use the components** (buttons, forms, cards)
5. **Follow accessibility** (labels, contrast, keyboard)
6. **Use clear microcopy** (specific, helpful, friendly)
7. **Show feedback** (loading, error, success, empty)
8. **Test mobile** (44×44px, thumb zone, responsive)

---

**Keep this card handy. Reference the full guides for details.**
