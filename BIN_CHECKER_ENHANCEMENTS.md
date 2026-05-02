# BIN Checker Page - API Integration & Enhancements

## Overview
The BIN Checker page has been completely redesigned with modern UI/UX and integrated with the backend APIs for comprehensive BIN extraction and validation functionality.

## API Integration

### 1. BIN Extraction API (`/api/bin-extractor/extract`)
**Purpose**: Extract BIN numbers from raw text or card data

**Request:**
```json
{
  "text": "string containing BINs",
  "extract8Digit": false  // 6-digit or 8-digit BIN extraction
}
```

**Response:**
```json
{
  "success": true,
  "meta": {
    "traceId": "uuid",
    "processingTimeMs": 45,
    "targetFormat": "6-digit"
  },
  "totalFound": 12,
  "bins": ["424242", "555555", "378282"]
}
```

**Features:**
- Fast regex-based extraction (>1000 BINs/second)
- Automatic MII validation (3-6 prefix checks)
- Deduplication using Set data structure
- 5MB payload size limit
- Asynchronous telemetry logging

### 2. BIN Lookup API (`/api/tools/check-bin`)
**Purpose**: Validate and retrieve detailed metadata for BINs from Stripe's card metadata oracle

**Request:**
```json
{
  "bin": "424242"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "brand": "Visa",
    "funding": "credit",
    "type": "credit",
    "pan_length": 16,
    "account_range_low": "4242420000000000",
    "account_range_high": "4242429999999999",
    "country": "US"
  },
  "fullResponse": { ... }
}
```

**Timeout**: 3 seconds per BIN check with automatic abort

## Frontend Enhancements

### UI Components

#### 1. Mode Toggle
- **Check BINs**: Direct input and validation
- **Extract from Text**: Extract BINs from raw data, then auto-populate input

#### 2. Extraction Mode
- Text area for pasting raw card data
- Async extraction with loading state
- Visual preview of extracted BINs (shows first 10)
- Automatic BIN field population after extraction

#### 3. Input Section
- Multi-line textarea with monospace font
- Placeholder examples for user guidance
- Clear button for quick reset
- Real-time progress indicator during checks

#### 4. Results Section
- **Copy Button**: Copy formatted results to clipboard with success feedback
- **Export Button**: Download results as CSV with full metadata
- **Expandable Details**: Collapse/expand individual BIN information
- **Status Icons**: Visual indicators (✓ Found, ✗ Not Found, ! Error)
- **Badges**: Brand, Funding type, Country tags with color coding
- **Performance Metrics**: Response time per BIN in milliseconds

#### 5. Stats Cards
- **Checked**: Total BINs processed
- **Found**: Valid BINs with metadata
- **Not Found**: BINs not in global ledger
- Responsive grid layout (2 columns mobile, 1 column desktop)

### Data Display

#### Collapsed View
```
424242  ✓ Visa  credit  US  45ms
```

#### Expanded View
- Brand, Funding, Type
- PAN Length, Range Low, Range High
- Full metadata from Stripe

### Performance Optimizations

1. **Client-side**:
   - Abort controller for request cancellation
   - Batch processing with progress updates
   - Memoized state updates
   - CSS animations with GPU acceleration

2. **Backend**:
   - Pre-compiled regex patterns
   - Set-based deduplication (O(1) lookup)
   - Lazy iteration using matchAll
   - Timeout-based request control (2-3 seconds per API call)

### State Management

```typescript
interface CheckedBin {
  raw: string;           // Original BIN
  status: CheckStatus;   // Found | Not Found | Error
  brand?: string;        // Card brand (Visa, Mastercard, etc.)
  country?: string;      // Issuing country
  funding?: string;      // Card funding type (credit, debit, prepaid)
  length?: number;       // PAN length
  rangeLow?: string;     // Account range low
  rangeHigh?: string;    // Account range high
  fullData?: any;        // Full metadata from Stripe
  time: number;          // Response time in ms
}

interface ExtractionMode {
  isActive: boolean;     // Toggle between modes
  text: string;          // Raw input text
  extractedBins: string[]; // Extracted BINs
  isExtracting: boolean; // Loading state
}
```

## Styling & Design

### Color Scheme
- **Primary**: Orange gradient (#F38020 → #FB923C)
- **Success**: Green (#10B981) for found BINs
- **Error**: Red (#EF4444) for errors
- **Semantic Tokens**: Uses CSS variables for consistency

### Typography
- **Display**: Syne font (headings)
- **Body**: DM Sans (content)
- **Code**: JetBrains Mono (BINs, monospace)

### Responsive Behavior
- **Mobile (< 640px)**: Stacked layout, full-width inputs
- **Tablet (640-1024px)**: 2-column grid for stats
- **Desktop (> 1024px)**: 5-column layout with 3:2 split

## User Workflows

### Workflow 1: Manual BIN Checking
1. Click "Check BINs" mode (default)
2. Paste or manually enter BINs (one per line)
3. Click "Start Lookup"
4. View results with expand/collapse
5. Copy results or export as CSV

### Workflow 2: Automated Extraction
1. Click "Extract from Text" mode
2. Paste raw card data, logs, or text
3. Click "Extract BINs"
4. System automatically populates BIN input field
5. Click "Start Lookup" to validate extracted BINs

## API Usage Examples

### JavaScript/TypeScript

**Extract BINs:**
```typescript
const res = await fetch('/api/bin-extractor/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your text with BINs here...',
    extract8Digit: false
  })
});
const data = await res.json();
```

**Check BIN:**
```typescript
const res = await fetch('/api/tools/check-bin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bin: '424242' })
});
const data = await res.json();
```

## Error Handling

### Client-side
- Abort signals for request cancellation
- Graceful error state tracking
- Status icons and messages
- Network error resilience

### Server-side
- Request timeout (2-3 seconds)
- Payload size validation (5MB max)
- Input validation with Zod schemas
- Upstream API failure fallback

## Performance Metrics

### Extraction
- Processing speed: >1000 BINs/second
- Memory efficiency: O(n) with deduplication
- Max payload: 5MB

### BIN Lookup
- Per-BIN timeout: 3 seconds
- Concurrent requests: Sequential to prevent rate limiting
- Average response time: 45-200ms per BIN

### UI/UX
- Animation duration: 200-500ms
- Progress updates: Real-time
- Export generation: <100ms for 1000 results

## Security Considerations

1. **Input Validation**:
   - Regex constraints: `^[0-9]{6,}$`
   - Type validation with Zod
   - Payload size limits

2. **API Security**:
   - Request timeouts prevent hanging
   - Stripe API key management (edge internal)
   - CORS protection with Hono

3. **Data Privacy**:
   - No storage of extracted/checked BINs
   - Client-side processing preference
   - Asynchronous telemetry only

## Future Enhancements

1. **Batch Processing**:
   - Queue management for 10,000+ BINs
   - Progress persistence
   - Resume capability

2. **Advanced Filtering**:
   - Filter by brand, country, funding type
   - Search within results
   - Sorting options

3. **Analytics**:
   - Extraction success rates
   - Most common BIN patterns
   - Geographic distribution

4. **Integration**:
   - Webhook support for extracted BINs
   - CSV import functionality
   - API rate limit information

## Troubleshooting

### Common Issues

**"Payload Too Large" Error**
- Reduce text size to <5MB
- Split large datasets into chunks

**"Network execution failed or timed out"**
- Check internet connection
- Reduce concurrent BIN checks
- Retry individual BINs

**No results found**
- Verify BIN format (6+ digits, numbers only)
- Check text input for valid BINs
- Stripe ledger may not contain the BIN

## References

- [Stripe Card Metadata API](https://stripe.com/docs/api)
- [BIN (Bank Identification Number)](https://en.wikipedia.org/wiki/Payment_card_number#Issuer_identification_number)
- [Luhn Algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm)
