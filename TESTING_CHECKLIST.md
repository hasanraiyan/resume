# AI Assistant Testing Checklist

Use this checklist to verify all features are working correctly.

## ✅ Pre-Testing Setup

- [ ] MongoDB is running and connected
- [ ] Environment variables are set (OPENAI_API_KEY, MONGODB_URI)
- [ ] Development server is running (`npm run dev`)
- [ ] Browser console is open for debugging
- [ ] Admin analytics dashboard is accessible

---

## 🤖 Proactive Engagement Tests

### Test 1: Projects Page Time Trigger
- [ ] Navigate to `/projects`
- [ ] Wait 15 seconds without interaction
- [ ] **✓ Pass:** Chat opens automatically with message about exploring work
- [ ] Check console for: `proactive_message_sent` event
- [ ] Verify analytics: `/admin/analytics` shows event

### Test 2: Home Page Time Trigger
- [ ] Navigate to `/` (home page)
- [ ] Wait 20 seconds
- [ ] **✓ Pass:** Chat opens with welcome message
- [ ] Check analytics dashboard

### Test 3: Project Detail Scroll Trigger
- [ ] Navigate to `/projects/[any-project-slug]`
- [ ] Scroll to 70% of page height
- [ ] **✓ Pass:** Chat opens with project-specific message
- [ ] Message mentions the project name
- [ ] Check console for `scroll_based` trigger type

### Test 4: User Response Tracking
- [ ] Trigger any proactive message
- [ ] Type and send a response
- [ ] **✓ Pass:** Normal conversation continues
- [ ] Check console for: `user_responded_to_proactive` event
- [ ] Verify in analytics dashboard under Recent Events

---

## 🔧 Tool-Calling Tests

### Test 5: getProjectDetails Tool
**Test Query:** "What were the key results of the Analytics Dashboard project?"

- [ ] Open chat
- [ ] Send the query above
- [ ] Check console for: `🔧 Step 1: Sending request with tools enabled`
- [ ] Check console for: `🔧 Step 2: Model requested tool calls`
- [ ] Check console for: `🔧 Executing tool: getProjectDetails`
- [ ] **✓ Pass:** Response includes specific, detailed project information
- [ ] **✓ Pass:** Information matches database content
- [ ] Verify in analytics: `toolsUsed` includes `getProjectDetails`

### Test 6: searchPortfolio Tool
**Test Query:** "Show me all your React projects"

- [ ] Open chat
- [ ] Send the query above
- [ ] Check console for tool execution logs
- [ ] **✓ Pass:** Response lists multiple React-related projects
- [ ] **✓ Pass:** Search results are relevant
- [ ] Check analytics: `toolsUsed` includes `searchPortfolio`

### Test 7: Multiple Tool Calls
**Test Query:** "Tell me about your e-commerce experience and the details of your fashion store project"

- [ ] Send the query above
- [ ] **✓ Pass:** AI might use both `searchPortfolio` and `getProjectDetails`
- [ ] Check analytics: `toolsCount` is 2 or more

### Test 8: No Tool Usage
**Test Query:** "Hello! What's your name?"

- [ ] Send the query above
- [ ] **✓ Pass:** AI responds without using tools
- [ ] Check console: No tool execution logs
- [ ] Check analytics: `toolsCount` is 0

### Test 9: Tool Error Handling
**Test Query:** "Tell me about the project-that-does-not-exist"

- [ ] Send the query above
- [ ] **✓ Pass:** AI gracefully handles the missing project
- [ ] **✓ Pass:** Suggests using search or asks for clarification
- [ ] Check analytics: Tool result shows `hasError: true`

---

## 📊 Analytics Dashboard Tests

### Test 10: Proactive Engagement Metrics
- [ ] Navigate to `/admin/analytics`
- [ ] After running proactive tests, refresh dashboard
- [ ] **✓ Pass:** "Proactive Engagement" card shows data:
  - [ ] Total proactive messages count
  - [ ] Response rate percentage
  - [ ] Top triggers listed
  - [ ] Progress bar displays correctly

### Test 11: Tool Usage Metrics
- [ ] After running tool tests, refresh analytics
- [ ] **✓ Pass:** "AI Tool Usage" card shows data:
  - [ ] Total interactions using tools
  - [ ] Percentage of conversations with tools
  - [ ] Breakdown by tool name (getProjectDetails, searchPortfolio)
  - [ ] Success rate per tool
  - [ ] Visual progress bars

### Test 12: Recent Events Log
- [ ] Check Recent Events section
- [ ] **✓ Pass:** Events show:
  - [ ] `pageview` events in green
  - [ ] `chatbot_interaction` events in slate
  - [ ] Custom events (proactive) in blue
  - [ ] Timestamps are correct
  - [ ] Event names display (e.g., `proactive_message_sent`)

### Test 13: Chatbot Analytics Summary
- [ ] Check "Chatbot Interactions" metric card
- [ ] **✓ Pass:** Shows total interactions count
- [ ] Check "AI Conversion Rate" card
- [ ] **✓ Pass:** Shows percentage of conversations with CTA

---

## 🔍 Edge Cases & Error Handling

### Test 14: Rapid Page Navigation
- [ ] Navigate quickly between pages
- [ ] **✓ Pass:** Proactive triggers don't fire multiple times
- [ ] **✓ Pass:** Triggers reset properly on page change

### Test 15: Chat Already Open
- [ ] Manually open chat
- [ ] Wait for time trigger duration
- [ ] **✓ Pass:** No duplicate proactive message appears

### Test 16: OpenAI API Error
- [ ] Temporarily use invalid API key (in .env.local)
- [ ] Send a message
- [ ] **✓ Pass:** User sees error message
- [ ] **✓ Pass:** Error is logged to console
- [ ] Restore valid API key

### Test 17: Database Connection Error
- [ ] Stop MongoDB temporarily
- [ ] Try to use tools
- [ ] **✓ Pass:** Error is handled gracefully
- [ ] **✓ Pass:** User receives informative message
- [ ] Restart MongoDB

### Test 18: Long Conversation Context
- [ ] Have a 10+ message conversation
- [ ] Use tools multiple times
- [ ] **✓ Pass:** Context is maintained
- [ ] **✓ Pass:** Tool calls still work correctly

---

## 🎯 Integration Tests

### Test 19: Full User Journey
Simulate a real visitor:

1. [ ] Land on home page, wait 20s → proactive message
2. [ ] Ask: "What technologies do you work with?"
3. [ ] Ask: "Show me your React projects" → searchPortfolio tool
4. [ ] Navigate to `/projects/[specific-project]`
5. [ ] Scroll 70% → proactive project message
6. [ ] Ask: "What were the results?" → getProjectDetails tool
7. [ ] Check analytics dashboard
8. [ ] **✓ Pass:** All events tracked correctly
9. [ ] **✓ Pass:** User experience is smooth throughout

### Test 20: Multiple Sessions
- [ ] Clear browser storage
- [ ] Repeat several tests
- [ ] **✓ Pass:** New session IDs are created
- [ ] **✓ Pass:** Analytics distinguishes sessions
- [ ] **✓ Pass:** Proactive triggers work in new sessions

---

## 📱 Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome/Edge - All tests pass
- [ ] Firefox - All tests pass
- [ ] Safari - All tests pass

### Mobile Browsers
- [ ] Mobile Chrome - Proactive triggers work
- [ ] Mobile Safari - Scroll triggers work
- [ ] Responsive UI - Chat widget displays correctly

---

## ⚡ Performance Checks

### Test 21: Load Time
- [ ] Measure page load time with chatbot
- [ ] **✓ Pass:** No significant performance impact
- [ ] Check Network tab for API calls

### Test 22: Tool Response Time
- [ ] Time tool execution (check console logs)
- [ ] **✓ Pass:** getProjectDetails < 1 second
- [ ] **✓ Pass:** searchPortfolio < 2 seconds

### Test 23: Analytics Write Performance
- [ ] Send multiple messages rapidly
- [ ] **✓ Pass:** All events are logged
- [ ] **✓ Pass:** No dropped events

---

## 🎨 UI/UX Checks

### Test 24: Proactive Message Display
- [ ] Trigger proactive message
- [ ] **✓ Pass:** Message appears smoothly
- [ ] **✓ Pass:** Styling matches design
- [ ] **✓ Pass:** Chat opens automatically

### Test 25: Tool Response Formatting
- [ ] Use tools and check response formatting
- [ ] **✓ Pass:** Markdown renders correctly
- [ ] **✓ Pass:** Lists and bullet points display well
- [ ] **✓ Pass:** Links are clickable (if included)

---

## 📋 Summary Report

After completing all tests, fill out:

**Date Tested:** _______________

**Total Tests:** 25

**Tests Passed:** ___ / 25

**Tests Failed:** ___

**Critical Issues:** (List any blocking issues)
- 
- 

**Minor Issues:** (List any non-blocking issues)
- 
- 

**Performance Notes:**
- Average tool response time: ___
- Proactive trigger accuracy: ___
- Analytics latency: ___

**Recommendations:**
- 
- 

---

## 🐛 Common Issues & Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Proactive triggers don't fire | `proactiveTriggersEnabled` is false | Set to `true` in ChatbotWidget.js |
| Tools return empty results | MongoDB text indexes missing | Run `db.projects.createIndex({...})` |
| API returns 401 | Invalid OpenAI API key | Check `.env.local` file |
| Analytics not updating | Cache issue | Hard refresh analytics dashboard |
| Slug not found | Project slug format mismatch | Verify slug format (lowercase-with-hyphens) |

---

**Testing Status:** ⏳ In Progress / ✅ Complete

**Next Steps After Testing:**
1. Deploy to staging environment
2. Monitor production analytics
3. Gather user feedback
4. Iterate on trigger timing and messages
