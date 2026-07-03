I think the biggest mistake would be building this like a spreadsheet. Students won't keep using an app that takes 5 minutes every day. The UX has to let them finish in **10–20 seconds**.

## Product Requirements Document (PRD)

# Project Name

**Attenda** (Working Name)

**Tagline:** Track your college life, not just your attendance.

---

# 1. Vision

Build the easiest attendance tracking app for college students.

The app should work whether the student has:

- Biometric attendance
- Subject-wise attendance
- Fixed timetable
- Random/unplanned classes
- Frequent holidays
- Cancelled lectures

The goal is to reduce daily attendance logging to **less than 20 seconds** while still providing accurate statistics and predictions.

---

# 2. Core Principles

## 1. Offline First

Everything works without internet.

---

## 2. One-Time Setup

Students should configure the semester only once.

---

## 3. Daily Logging <20 Seconds

Opening the app should immediately allow users to finish today's attendance.

---

## 4. Reality Over Rules

Colleges don't follow perfect schedules.

The app must support:

- Cancelled lectures
- Extra lectures
- Teacher absence
- Unexpected holidays
- Time-table changes

without breaking attendance calculations.

---

# 3. Semester

A user may have multiple semesters.

Example

Semester VI

Fields

- Semester Name
- Start Date
- End Date
- Required Attendance %
- Weekly Holidays
- Institution Name (optional)
- Notes

Statistics

- Working Days
- Holidays
- Total Subjects
- Total Lectures
- Attendance %

---

# 4. Subjects

Each semester contains subjects.

Fields

- Subject Name
- Faculty Name
- Color
- Credits (optional)
- Required Attendance %
- Is Active

Statistics

- Total Classes
- Present
- Absent
- Cancelled
- Attendance %

---

# 5. Timetable

The timetable is optional.

Users create weekly schedules.

Example

Monday

9–10

Operating Systems

10–11

DBMS

11–12

CN

2–3

Operating Systems

Notice that Operating Systems appears twice.

The system must support unlimited lectures.

---

# 6. Daily Attendance Flow (Primary UX)

When opening the app, users land directly on **Today**.

---

### Step 1

```
Friday
3 July

College

○ Present

○ Absent

○ Holiday

○ College Closed
```

If the user marks **Absent**, all scheduled lectures are automatically marked **Absent**, but each one can still be edited individually.

If the user marks **Present**, scheduled lectures are pre-filled as **Present**. This minimizes effort while allowing corrections.

---

### Step 2

Scheduled lectures are shown.

```
09:00
OS

✓ Present

10:00
DBMS

✓ Present

11:00
CN

✓ Present

2:00
OS

✓ Present
```

Users can tap any lecture to change its status.

---

### Possible lecture statuses

- Present
- Absent
- Cancelled
- Didn't Happen
- Holiday
- College Closed
- Medical Leave (future)

---

### Step 3

Bottom of screen

```
+ Add Extra Class
```

For surprise lectures.

---

### Step 4

Tap

Save

Done.

Entire process should take around 15 seconds.

---

# 7. Editing Past Days

Users can open any previous day.

Everything remains editable.

Example

15 July

College

Present

OS

Present

DBMS

Cancelled

CN

Absent

Machine Learning

Extra Class

---

# 8. Calendar

Each day has indicators.

Example

Green

Present

Red

Absent

Blue

Holiday

Gray

College Closed

Dot indicators show how many lectures were recorded.

---

# 9. Holidays

The system supports four holiday sources.

## Weekly Holidays

Example

Sunday

---

## Manual Holidays

Example

Durga Puja

---

## College Holidays

Example

Sports Day

---

## Imported Holidays

Future feature.

The app can fetch public holidays based on country/state, but users can enable, disable, or edit them because college calendars differ.

---

# 10. Attendance Calculations

Two separate attendance metrics.

## College Attendance

Days Present

Days Absent

Working Days

Attendance %

---

## Subject Attendance

Present Lectures

Absent Lectures

Cancelled Lectures

Extra Lectures

Attendance %

---

Cancelled lectures never affect attendance.

Extra lectures count toward attendance if attended.

---

# 11. Dashboard

Opening the dashboard should answer the questions students ask most.

```
College Attendance

82%

Subjects

OS

91%

DBMS

74%

⚠ Below Target

CN

86%

Today's Classes

4

Remaining Working Days

68

Safe Bunks

3

Need Attention

DBMS
```

---

# 12. Predictions

Examples

"If you skip tomorrow"

College

81.5%

OS

89%

DBMS

72%

---

"If you attend the next five lectures"

College

84%

DBMS

76%

---

"You can safely miss"

College

3 days

OS

4 lectures

CN

6 lectures

---

# 13. Reports

Semester Report

Monthly Report

Subject Report

Attendance Trend

Export to PDF

Export to CSV

---

# 14. Notifications

Daily Reminder

"You haven't marked today's attendance."

Low Attendance Warning

"DBMS has dropped below 75%."

Semester Ending Reminder

---

# 15. Analytics

Most Missed Subject

Best Attendance

Attendance Heatmap

Monthly Trends

Current Streak

Longest Attendance Streak

---

# 16. Settings

Attendance Target

Theme

Backup

Export

Import

Language

Reminder Time

---

# 17. Future Features

Cloud Sync

Cross-device Sync

Biometric Import (if colleges expose data)

Faculty Timetable Sharing

Friend Groups

Widgets

Wear OS Support

Semester GPA

Exam Planner

Assignment Tracker

---

# 18. MVP Scope

### Include

- Semester management
- Subject management
- Optional timetable
- College attendance
- Subject attendance
- Multiple lectures per day
- Calendar
- Holiday management
- Daily logging
- Dashboard
- Reports
- Predictions
- Safe bunk calculator
- Offline storage
- Local backups

### Exclude

- Accounts
- Cloud sync
- AI features
- Public holiday integration
- Timetable sharing
- Social features

---

## UX Recommendation: Make It Feel Effortless

The app should not open to a dashboard—it should open to **Today**, because that's the action users perform most often.

A good navigation structure would be:

- **Today** → Mark attendance (primary screen)
- **Calendar** → View and edit history
- **Analytics** → Charts, reports, safe bunks, predictions
- **Semester** → Subjects, timetable, holidays, settings

This puts the most frequent task one tap away and keeps everything else organized.

One enhancement I'd strongly recommend is an **"Auto Complete Today"** action. When the user taps **Present**, the app automatically marks all scheduled lectures as **Present**. If one lecture was cancelled or missed, the user only changes that single item. On a normal day, logging attendance becomes a **two-tap interaction**: open the app → tap **Present** → save. That's the kind of UX that keeps users coming back every day.
