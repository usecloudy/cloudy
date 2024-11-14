import { NextRequest, NextResponse } from "next/server";

import { parseSuggestions } from ".";

const text = `I'll suggest updates to reflect the new functionality added to the \`makeHumanizedTime\` function.

<suggestion>
<reasoning>
The function signature has been updated with new options parameters that should be documented.
</reasoning>
<selected_snippet>
## Function Signature

\`\`\`typescript
makeHumanizedTime(date: Date | string, options?: { hoursOnly?: boolean }): string
\`\`\`

## Parameters

- \`date\`: A Date object or date string to format
- \`options\`: Optional configuration object
  - \`hoursOnly\`: When true, shows only hours for same-day times
</selected_snippet>
<replacement_snippet>
## Function Signature

\`\`\`typescript
makeHumanizedTime(
  date: Date | string,
  options?: {
    hoursOnly?: boolean;
    includeSeconds?: boolean;
    locale?: Locale;
  }
): string
\`\`\`

## Parameters

- \`date\`: A Date object or date string to format
- \`options\`: Optional configuration object
  - \`hoursOnly\`: When true, shows only hours for same-day times
  - \`includeSeconds\`: When true, includes seconds in the time difference for sub-hour times
  - \`locale\`: Optional locale object for internationalized formatting
</replacement_snippet>
</suggestion>

<suggestion>
<reasoning>
The function now handles future dates, which should be documented in the output formats section.
</reasoning>
<selected_snippet>
## Output Formats

The function returns different formats based on the time elapsed:

1. **Very Recent** (≤ 30 seconds)

   \`\`\`typescript
   makeHumanizedTime(new Date()) // "just now"
   \`\`\`
</selected_snippet>
<replacement_snippet>
## Output Formats

The function returns different formats based on the time elapsed:

1. **Future Dates**
   \`\`\`typescript
   makeHumanizedTime(futureDate) // "in 2 hours" or "in a few seconds"
   \`\`\`

2. **Very Recent** (≤ 30 seconds)
   \`\`\`typescript
   makeHumanizedTime(new Date()) // "just now"
   \`\`\`
</replacement_snippet>
</suggestion>

<suggestion>
<reasoning>
Need to add documentation for the new includeSeconds option in the examples.
</reasoning>
<selected_snippet>
### Basic Examples

\`\`\`typescript
// Current time formatting
const now = new Date();
makeHumanizedTime(now); // "just now"

// Past time formatting
const pastDate = new Date('2024-01-01T12:30:00');
makeHumanizedTime(pastDate); // Format depends on current date

// Using hoursOnly option
makeHumanizedTime(pastDate, { hoursOnly: true }); // "12:30 PM"
\`\`\`
</selected_snippet>
<replacement_snippet>
### Basic Examples

\`\`\`typescript
// Current time formatting
const now = new Date();
makeHumanizedTime(now); // "just now"

// Past time formatting
const pastDate = new Date('2024-01-01T12:30:00');
makeHumanizedTime(pastDate); // Format depends on current date

// Using hoursOnly option
makeHumanizedTime(pastDate, { hoursOnly: true }); // "12:30 PM"

// Including seconds for precise timing
makeHumanizedTime(pastDate, { includeSeconds: true }); // "2 minutes 30 seconds ago"

// Using custom locale
import { fr } from 'date-fns/locale';
makeHumanizedTime(pastDate, { locale: fr }); // French formatted output
\`\`\`
</replacement_snippet>
</suggestion>

<suggestion>
<reasoning>
Adding new implementation notes to cover the new functionality.
</reasoning>
<selected_snippet>
## Implementation Notes

- The function automatically handles both Date objects and date strings
- Time formatting uses 12-hour clock format (AM/PM)
- Year is only shown for dates from previous years
- In UI components, it's commonly used with optional chaining (\`??\`) to handle fallback dates
- The \`hoursOnly\` option is useful for compact displays like cards and lists
- The function is typically used in secondary or tertiary text elements for timestamp displays
</selected_snippet>
<replacement_snippet>
## Implementation Notes

- The function automatically handles both Date objects and date strings
- Time formatting uses 12-hour clock format (AM/PM)
- Year is only shown for dates from previous years
- In UI components, it's commonly used with optional chaining (\`??\`) to handle fallback dates
- The \`hoursOnly\` option is useful for compact displays like cards and lists
- The function is typically used in secondary or tertiary text elements for timestamp displays
- Supports future dates with appropriate "in X time" formatting
- Can include seconds for more precise time differences
- Internationalization support through the \`locale\` option
- Uses absolute time differences for consistent formatting of past and future dates
</replacement_snippet>
</suggestion>`;

export const POST = async (req: NextRequest) => {
	return NextResponse.json(parseSuggestions(text));
};
