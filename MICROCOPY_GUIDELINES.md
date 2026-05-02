# DevKit Microcopy Guidelines

Professional, user-friendly messaging across the platform. Every word should help users understand what to do.

---

## 1. Core Principles

### Be Clear & Direct
- Avoid jargon and technical terms
- Use the user's vocabulary
- Active voice preferred ("Check your email" not "Your email should be checked")
- Short sentences (< 15 words)

### Be Helpful & Honest
- Explain what happened, not just that something went wrong
- Provide recovery actions
- Admit errors honestly without blame
- Set accurate expectations

### Be Friendly & Human
- Conversational tone, not robotic
- Use contractions ("don't" not "do not")
- Avoid excessive punctuation or emojis
- Treat users with respect

### Be Specific
- No "Error" or "Invalid" - be specific about what's wrong
- Show examples where helpful
- Explain why information is needed
- Suggest next steps

---

## 2. Microcopy by Context

### Button Labels

#### Primary Action (CTA)
```
✅ "Check BIN (Instant)"  - Action + benefit
✅ "Generate Test Cards"
✅ "Verify Email"
✅ "Export Results"

❌ "Submit"
❌ "OK"
❌ "Go"
```

**Rule**: Describe what happens, add benefit if possible

#### Secondary Actions
```
✅ "Save Draft"
✅ "Learn More"
✅ "Skip for Now"
✅ "Cancel"

❌ "Back"
❌ "Next"
```

#### Destructive Actions
```
✅ "Delete Account (Cannot Undo)"
✅ "Logout"
✅ "Cancel Upload"

❌ "Remove"
❌ "Confirm"
```

---

### Form Labels & Hints

#### Input Labels
```html
<!-- Good: Clear, specific -->
<label>Email Address</label>
<input placeholder="name@company.com" />

<!-- Good: Explains why -->
<label>Phone Number (For Login Codes)</label>

<!-- Bad: Unclear -->
<label>Contact</label>

<!-- Bad: Placeholder as label -->
<label>Email</label>
<input placeholder="Email address" />
```

#### Help Text
```
✅ "We'll send you a confirmation code"
✅ "6-8 digits, letters optional"
✅ "Search by username or email"
✅ "You can change this later"

❌ "Required"
❌ "Enter email"
❌ "Invalid format"
```

#### Required Field Indication
```html
<!-- Good: Visual + text -->
<label>Email <span class="form-label-required">*</span></label>
<div class="form-hint">We need this to set up your account</div>

<!-- Bad: Unclear why it's required -->
<label>Email <span>*</span></label>
```

---

### Error Messages

#### Validation Errors
```
✅ "Email must include @ symbol. Example: name@company.com"
✅ "Password must be at least 8 characters"
✅ "BIN must be 6-8 digits (letters removed)"
✅ "Address not found. Try with city/state"

❌ "Invalid email"
❌ "Password too short"
❌ "Bad input"
❌ "Not found"
```

**Formula**: What's wrong + How to fix it + Example

#### Network Errors
```
✅ "Network disconnected. Check your connection and retry."
✅ "Server took too long to respond. Try again in a moment."
✅ "Too many requests. Wait a minute before trying again."

❌ "Error"
❌ "Request failed"
❌ "404"
```

#### Permission/Access Errors
```
✅ "You must be logged in to view this. Sign in first."
✅ "This tool requires a Premium account. Upgrade to access."
✅ "You don't have permission to edit this post."

❌ "Access denied"
❌ "403 Forbidden"
```

#### Empty States
```
✅ "No messages yet. Start a conversation!"
✅ "You haven't checked any BINs. Enter a BIN above to begin."
✅ "No results match your search. Try a different query."

❌ "No data"
❌ "Empty"
```

---

### Success Messages

#### Confirmation
```
✅ "Email verified! You can now log in."
✅ "BIN added to favorites ✓"
✅ "Results exported to CSV. Check your downloads."
✅ "Account deleted. You can sign up again anytime."

❌ "Success"
❌ "Done"
```

#### Encouragement (Optional)
```
✅ "Great! Your profile is 80% complete. Add a photo next."
✅ "Premium unlocked! You now have access to all tools."
✅ "All set! Check your email for next steps."

❌ "Operation successful"
```

---

### Loading States

#### During Processing
```
✅ "Checking BIN... (1 of 10)"
✅ "Generating 50 addresses..."
✅ "Verifying cards... (about 10 seconds)"

❌ "Loading..."
❌ "Processing..."
```

**Rule**: Show progress + time estimate if > 3 seconds

---

### Navigation & Instruction

#### Getting Started (First Time Users)
```
✅ "New here? Start with the Forum to see what's popular."
✅ "Try the BIN Checker tool to verify card details."
✅ "Generate realistic test addresses for your payment form."

❌ "Welcome"
❌ "Click here"
```

#### Instructional Text
```
✅ "Paste one BIN per line. You can check up to 100 at once."
✅ "Select a country to generate addresses with local formatting."
✅ "This API returns results instantly, no rate limits."

❌ "Enter data"
❌ "Choose option"
```

---

### Help & Support

#### Contextual Help
```
✅ "Why do we need your email? We use it to recover your account if you forget your password."
✅ "What's a BIN? It's the first 6-8 digits of a card number."
✅ "Premium members get unlimited checks. Learn about benefits."

❌ "?"
❌ "See help"
```

#### Tooltips (Hover)
```
✅ Hover on icon → "Copy to clipboard"
✅ Hover on badge → "VIP members can check 1000+ cards/day"
✅ Hover on field → "Email address associated with your account"

❌ Hover on icon → "Click"
```

#### Chat/Contact
```
✅ "Can't find the answer? Message our team."
✅ "Report this issue to help us improve."
✅ "Need help? Check our guide or chat with us."

❌ "Contact support"
❌ "Help"
```

---

## 3. Brand Voice Examples

### Tone: Professional but Friendly

#### Login/Auth
```
✅ "Welcome back! Sign in with your email."
✅ "Check your inbox for a sign-in link. (Takes 30 seconds)"
✅ "Password reset sent. Click the link in your email within 1 hour."

❌ "Please log in"
❌ "Authenticate"
```

#### Tool Usage
```
✅ "Paste up to 100 BINs to check them all at once."
✅ "Generate realistic test data for your payment system."
✅ "Export results as CSV to use in your reports."

❌ "Input data"
❌ "Get output"
```

#### Premium/Upsell
```
✅ "Unlock unlimited checks with Premium. See pricing."
✅ "Premium members get results in 2 seconds (vs 10 sec free)."
✅ "Try Premium free for 7 days. No credit card required."

❌ "Upgrade now"
❌ "Premium available"
```

---

## 4. Common Mistakes to Avoid

| ❌ Bad | ✅ Good | Why |
|-------|--------|-----|
| "Invalid input" | "Email must include @ symbol" | Specific > generic |
| "Error 404" | "Page not found. Return to home." | Human language |
| "Processing..." | "Checking 3 of 10 BINs..." | Show progress |
| "Click here" | "Generate test cards" | Descriptive |
| "Required" | "We need your email for login" | Explain why |
| "Confirm" | "Yes, delete my account" | Specific action |
| "Something went wrong" | "Network error. Retry?" | Explain + fix |
| "Warning" | "This action cannot be undone" | Explain consequence |

---

## 5. Localization Notes

When translating, maintain:
- Clarity (don't translate literally; translate meaning)
- Brevity (some languages need more words)
- Tone (stay friendly and professional)
- Examples (adjust for local context)

---

## 6. Accessibility in Microcopy

### Screen Readers
```html
<!-- Good: Descriptive -->
<button aria-label="Copy email address to clipboard">
  <Icon name="copy" />
</button>

<!-- Bad: Too brief -->
<button aria-label="Copy">
  <Icon name="copy" />
</button>
```

### Color Not Alone
```html
<!-- Good: Icon + color + text -->
<div style="color: red;">
  ❌ Email is invalid. Example: name@company.com
</div>

<!-- Bad: Color only -->
<input style="border: 2px solid red;" />
```

### Error Recovery
```html
<!-- Good: Clear path forward -->
<div class="form-error">
  Email must be valid.
  <a href="/forgot-password">Forgot your email?</a>
</div>

<!-- Bad: Just reports error -->
<div class="form-error">Invalid email</div>
```

---

## 7. Microcopy Checklist

Before shipping any text, ask:
- [ ] Is it clear what to do?
- [ ] Is it honest about what's happening?
- [ ] Would a new user understand?
- [ ] Is it friendly, not robotic?
- [ ] Is it specific (no "Error")?
- [ ] Does it show progress (for long tasks)?
- [ ] Is it accessible (readable, not color-only)?
- [ ] Is it consistent with brand voice?
- [ ] Is it as short as possible?
- [ ] Does it help users recover from errors?

---

## 8. Implementation Guide

### For Developers
1. Use this guide as reference while building
2. Ask: "Would a non-technical user understand this?"
3. Replace generic messages with specific ones
4. Always add examples for complex inputs
5. Test with real users before shipping

### For Designers
1. Include microcopy in wireframes
2. Specify exact button labels, not "CTA"
3. Show error messages, not just error states
4. Include help text for non-obvious fields
5. Collaborate with writers early

### For PMs/Writers
1. Review all user-facing text
2. Test with accessibility tools
3. Conduct content audit quarterly
4. Gather feedback from support team
5. Update guide as brand voice evolves

---

## 9. Tools & Resources

- **Hemingway Editor**: Check readability
- **Grammarly**: Grammar & tone
- **WAVE**: Accessibility checking
- **UserTesting**: Get real feedback
- **Google Analytics**: See what confuses users

---

## 10. Examples by Page

### Login Page
```
Page title: "Sign In to DevKit"
Email label: "Email Address"
Email hint: "We never share your email"
Password label: "Password"
Button: "Sign In"
Error (wrong password): "Email or password incorrect. Try again or reset your password."
Error (no account): "No account found. Sign up first or try a different email."
Success: "Signed in! Redirecting to your account..."
Link: "Don't have an account? Sign up for free"
```

### BIN Checker Page
```
Page title: "BIN Lookup - Verify Card Details Instantly"
Input label: "Enter BIN(s) to Check"
Input hint: "One BIN per line, 6+ digits. Letters will be removed."
Button: "Check BIN (Instant)"
Progress: "Checking 3 of 100 BINs..."
Error: "Invalid BIN format. Use 6-8 digits only."
Success: "Found! Visa card issued by Chase Bank, USA"
Empty: "No results yet. Enter a BIN above to start."
```

### Auth Error
```
Title: "Email Not Verified"
Message: "We sent a confirmation link to name@example.com. Click it to verify your email. Expires in 24 hours."
Action: "Resend confirmation email"
Link: "Wrong email? Update email address"
```

---

## Version History
- v1.0 - Initial guide with common microcopy patterns
- Check back for updates and team feedback
