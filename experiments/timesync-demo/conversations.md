# Conversation Flows

This document maps out all conversation scenarios in the TimeSync punch correction messenger demo. Each scenario shows the decision tree, user input patterns recognized, and system responses.

---

## How to Read This Document

- **State Names**: Shown in `code blocks` - these are the conversation states in the code
- **User Input**: What the user types (examples shown)
- **→**: Leads to next state or action
- **✓**: Conversation completes successfully
- **Recognized Patterns**: What the AI looks for in user input

---

## Scenario 1: Missing Punch Out

**Initial Message**: "Hey! I noticed you didn't punch out yesterday (Monday, Feb 2) at 5:00 PM. Want me to add that for you?"

**State**: `initial`

```
initial
├─ User: "yes" / "y" / "add it"
│  └─ ✓ Complete: "Added punch out at 5:00 PM"
│
├─ User: "no" / "different time"
│  └─ awaiting_time
│     ├─ User: "4:30 PM" / "5:15" / "430pm"
│     │  └─ ✓ Complete: "Recorded punch out at [time]"
│     │
│     ├─ User: "don't remember" / "forgot"
│     │  └─ ✓ Complete: "Flagged for manager review"
│     │     └─ Manager Notification: "Will reach out about punch time"
│     │
│     └─ User: [invalid]
│        └─ Retry: "Please specify time like '4:30 PM'"
│
└─ User: "didn't work" / "not work"
   └─ ✓ Complete: "Noted you didn't work on Feb 2"
```

**Recognized Patterns**:
- **Yes**: y, ye, yea, yeah, yep, yes, yup, sure, ok, okay, k
- **No**: n, no, nope, nah, not, different, another, wrong
- **Time**: 5:30pm, 530pm, 5pm, 5p, 17:30, noon, midnight
- **Didn't Work**: didn't work, wasn't there, day off, called out

---

## Scenario 2: Extended Break

**Initial Message**: "Hi there! Your break on Feb 3 was 1 hour 15 minutes, but it should be 30 minutes. What happened?"

**State**: `break_scenario`

```
break_scenario
├─ User: "forgot to end break" / "forgot"
│  └─ awaiting_break_time
│     ├─ User: "12:30" / "1pm" / "1230"
│     │  └─ ✓ Complete: "Updated break end to [time], total 30 min"
│     │
│     └─ User: [invalid]
│        └─ Retry: "Please provide valid time like '12:30 PM'"
│
├─ User: "approved" / "extended" / "got approval"
│  └─ awaiting_approval
│     └─ User: [manager name]
│        └─ ✓ Complete: "[Name] approved extended break"
│
├─ User: "system error" / "error"
│  └─ ✓ Complete: "Logged system error, break corrected to 30 min"
│
└─ User: [unclear]
   └─ Retry: "Could you clarify what happened?"
```

**Recognized Patterns**:
- **Forgot**: forgot, end break
- **Approved**: approved, extended, got approval
- **System Error**: system, error

---

## Scenario 3: Missing Punch In

**Initial Message**: "Good morning! I don't see a punch in for today. Your shift starts at 8:00 AM. Should I add that?"

**State**: `punch_in_scenario`

```
punch_in_scenario
├─ User: "yes" / "8:00"
│  └─ ✓ Complete: "Added punch in at 8:00 AM"
│
├─ User: "no" / "different"
│  └─ awaiting_punch_in_time
│     ├─ User: "8:15" / "745am" / "7:45"
│     │  └─ ✓ Complete: "Recorded punch in at [time]"
│     │
│     └─ User: [invalid]
│        └─ Retry: "Need a time like '8:30 AM' or '9:00'"
│
└─ User: "late" / "running late"
   └─ awaiting_arrival_time
      ├─ User: "8:30" / "9am"
      │  └─ ✓ Complete: "Recorded punch in at [time]"
      │
      └─ User: [invalid]
         └─ Retry: "Need a time like '8:30 AM'"
```

---

## Scenario 4: Early Arrival

**Initial Message**: "Hey! You punched in at 7:45 AM but your shift starts at 8:00 AM. Did someone ask you to come in early?"

**State**: `early_punch_scenario`

```
early_punch_scenario
├─ User: "yes" / "approved"
│  └─ awaiting_early_approval
│     └─ User: [manager name]
│        └─ ✓ Complete: "[Name] approved early start, 7:45 AM valid"
│
├─ User: "no" / "adjust" / "change to 8:00"
│  └─ ✓ Complete: "Adjusted punch to 8:00 AM"
│
└─ User: "manager" / "check" / "let me check"
   └─ ✓ Complete: "Flagged for manager review"
      └─ Manager Notification: "Will reach out to discuss"
```

---

## Scenario 5: Missing Meal Break

**Initial Message**: "I see you worked 10.5 hours Thursday without a meal break. Did you take a break and forget to clock it?"

**State**: `meal_break_scenario`

```
meal_break_scenario
├─ User: "yes" / "forgot"
│  └─ awaiting_meal_times
│     ├─ User: "12:00 to 12:30" / "started noon ended 12:30"
│     │  └─ ✓ Complete: "Added meal break 12:00-12:30"
│     │
│     ├─ User: "12:00" [only one time]
│     │  └─ Retry: "What time did break end?"
│     │
│     └─ User: [invalid]
│        └─ Retry: "Need start AND end like '12:00 PM to 12:30 PM'"
│
├─ User: "no" / "no break"
│  └─ ✓ Complete: "Flagged for compliance review"
│     └─ Warning: "10+ hours requires meal break in most states"
│     └─ Manager Notification: "Manager and HR notified"
│
└─ User: "system error" / "error"
   └─ ✓ Complete: "Logged system error, IT will investigate"
```

**Recognized Patterns**:
- **Multiple Times**: Regex matches 2+ times in message
- **Time Formats**: "12:00 PM to 12:30 PM", "started noon ended 12:30"

---

## Scenario 6: Duplicate Punches

**Initial Message**: "I see two punch outs - one at 5:00 PM and one at 5:02 PM on Feb 1. Which time is right?"

**State**: `duplicate_punch_scenario`

```
duplicate_punch_scenario
├─ User: "5:00" / "5pm" / "5p"
│  └─ ✓ Complete: "Kept 5:00 PM, removed 5:02 PM"
│
├─ User: "5:02" / "502pm" / "502p"
│  └─ ✓ Complete: "Kept 5:02 PM, removed 5:00 PM"
│
├─ User: "5:15" / "515pm" / "different time"
│  └─ ✓ Complete: "Removed both, recorded [entered time]"
│
└─ User: "neither" / "different" [no time given]
   └─ Retry: "What was the correct time?"
```

**Special Feature**: Advanced time parsing
- Extracts time from natural input: "5p" → "5:00 PM"
- Matches extracted time against known duplicates
- Accepts any valid time format as alternative

---

## Scenario 7: Overtime Approval

**Initial Message**: "Hi! You worked 43.5 hours this week - that's overtime! Did your manager say that's okay?"

**State**: `overtime_scenario`

```
overtime_scenario
├─ User: "yes" / "approved"
│  └─ awaiting_overtime_approval
│     └─ User: [manager name]
│        └─ ✓ Complete: "[Name] approved overtime, 43.5 hours valid"
│
├─ User: "check" / "need to check"
│  └─ ✓ Complete: "Flagged for manager approval"
│     └─ Manager Notification: "Will get notification when reviewed"
│
└─ User: "40" / "should be 40"
   └─ awaiting_ot_adjustment
      └─ User: [day name]
         └─ ✓ Complete: "Adjusted [day] to bring week to 40 hours"
```

---

## Scenario 8: Location Verification

**Initial Message**: "Hey! You punched in 15 miles from your usual spot. Were you at a different work site today?"

**State**: `location_scenario`

```
location_scenario
├─ User: "no" / "gps error" / "mistake"
│  └─ ✓ Complete: "Logged GPS issue, verified at usual location"
│
├─ User: "remote" / "home" / "wfh"
│  └─ ✓ Complete: "Marked as working remotely"
│
├─ User: "yes" [only]
│  └─ awaiting_location_details
│     └─ User: [location name]
│        └─ ✓ Complete: "Logged location as [name]"
│
└─ User: [location name directly]
   └─ ✓ Complete: "Logged location as [name]"
   (if 2+ words or 10+ characters)
```

**Smart Detection**:
- Accepts location name in first response: "downtown office"
- Only asks for details if unclear: just "yes" or "different"

---

## Scenario 9: Unscheduled Day

**Initial Message**: "I see you punched in on Saturday, but you're usually off weekends. Is this right?"

**State**: `unscheduled_scenario`

```
unscheduled_scenario
├─ User: "yes"
│  └─ ✓ Complete: "Kept Saturday punches, hours recorded"
│
├─ User: "no" / "wrong" / "mistake"
│  └─ ✓ Complete: "Removed Saturday punches"
│
├─ User: "manager asked" / "requested"
│  └─ awaiting_unscheduled_approval
│     └─ User: [manager name]
│        └─ ✓ Complete: "[Name] requested Saturday work, approved"
│
├─ User: "picking up shift" / "extra shift"
│  └─ ✓ Complete: "Added Saturday to schedule, punches valid"
│
└─ User: [unclear]
   └─ Retry: "Should I keep Saturday punches? (yes/no)"
```

---

## Scenario 10: PTO Confusion

**Initial Message**: "Hey! You have punches for today, but you also requested time off for Feb 3. Are you working or taking the day off?"

**State**: `pto_scenario`

```
pto_scenario
├─ User: "working" / "cancel pto"
│  └─ ✓ Complete: "Canceled PTO, recording work hours"
│
├─ User: "pto" / "day off" / "remove punches"
│  └─ ✓ Complete: "Removed punches, kept PTO active"
│
└─ User: "half day" / "half"
   └─ awaiting_half_day_time
      ├─ User: "12:00" / "1pm"
      │  └─ ✓ Complete: "Set PTO as half day, work until [time]"
      │
      └─ User: [invalid]
         └─ Retry: "What time working until? ('12:00 PM' or '1:00')"
```

---

## Natural Language Input Parser

The system recognizes natural, conversational input through the `parseUserInput()` function:

### Time Recognition
```
Formats recognized:
- "5:30pm" → "5:30 PM"
- "530pm" → "5:30 PM"
- "5pm" → "5:00 PM"
- "5p" → "5:00 PM"
- "17:30" → "17:30"
- "noon" → "12:00 PM"
- "midnight" → "12:00 AM"
```

### Yes/No Recognition
```
Yes: y, ye, yea, yeah, yep, yes, yup, sure, ok, okay, k, 
     correct, right, add it, do it, go ahead, sounds good

No: n, no, nope, nah, not, different, another, wrong, incorrect
```

### Special Patterns
```
Didn't Work: didnt work, wasn't there, day off, called out
Uncertain: don't remember, can't remember, not sure, forgot, idk, dunno
```

---

## Adding New Scenarios

To add a new conversation scenario:

### 1. Add Scenario Object
```javascript
{
    message: 'Your opening message\n\n<i style="opacity: 0.6; font-size: 13px;">Hint text</i>',
    state: 'your_scenario_state'
}
```

### 2. Add to Scenario Selector
```html
<option value="X">Your Scenario Name</option>
```

### 3. Add Case to processResponse()
```javascript
case 'your_scenario_state':
    if (input.isYes()) {
        completeScenario('Success message', 'success', 'Badge Text');
    } else if (input.contains('keyword')) {
        addMessage('Follow-up question', 'received');
        conversationState = 'awaiting_more_info';
    } else {
        addMessage('Clarification message', 'received');
    }
    break;

case 'awaiting_more_info':
    // Handle follow-up response
    completeScenario('Final message', 'success', 'Badge Text');
    break;
```

### 4. Design Your Flow
```
your_scenario_state
├─ User input pattern A
│  └─ Action/Response
├─ User input pattern B
│  └─ awaiting_more_info
│     └─ User provides info
│        └─ ✓ Complete
└─ Fallback
   └─ Retry message
```

---

## Tips for Natural Conversations

### ✅ DO:
- Use conversational language ("Hey!", "Got it!", "Perfect!")
- Provide examples in hints
- Accept multiple input formats
- Give helpful error messages
- Use manager notifications for escalations

### ❌ DON'T:
- Use corporate jargon
- Force exact text matches
- Make users guess what to type
- Leave users stuck without guidance
- Require perfect formatting

---

## State Management

**Conversation States**:
- Each scenario starts with an initial state
- States transition based on user input
- `complete` state shows success badge
- `ended` state triggers new scenario

**Special States**:
- `awaiting_[something]`: Waiting for specific user input
- `complete`: Scenario resolved, showing final message
- `ended`: Clean slate, ready for next scenario

---

## Testing Your Changes

1. **Hard refresh** browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Test with various inputs:
   - "yes", "y", "sure" (all should work)
   - "5pm", "5p", "500pm" (time formats)
   - Typos: "yea", "nope", "idk"
3. Check console for errors
4. Verify manager notifications appear when expected
5. Test scenario loop (does it restart properly?)

---

## Code Structure Reference

```
parseUserInput(text)
├─ isYes() → boolean
├─ isNo() → boolean
├─ extractTime() → string | null
├─ contains(words) → boolean
├─ indicatesDidntWork() → boolean
├─ indicatesUncertain() → boolean
└─ extractName() → string

processResponse(userMessage)
└─ switch(conversationState)
   ├─ case 'scenario_state'
   └─ case 'awaiting_state'

completeScenario(message, status, statusText)
└─ Shows success badge
└─ Triggers new scenario after delay

addMessage(text, type, options)
└─ Displays message bubble
└─ Handles manager notifications
```

---

## Quick Reference: Input Patterns

| Pattern | Matches |
|---------|---------|
| `input.isYes()` | y, yes, sure, ok, k, etc. |
| `input.isNo()` | n, no, nope, nah, different, wrong |
| `input.extractTime()` | Any time format (5p, 530pm, 5:30 PM) |
| `input.contains('word')` | Case-insensitive substring match |
| `input.contains(['a','b'])` | Matches if ANY word found |
| `input.indicatesUncertain()` | idk, forgot, don't remember |
| `input.indicatesDidntWork()` | didn't work, day off, called out |
| `input.extractName()` | Capitalized words (for names) |

---

*Last Updated: February 2026*