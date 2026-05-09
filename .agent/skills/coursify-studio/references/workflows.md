# Coursify Authoring Workflows

## High-Quality Section Design

A premium section should follow this flow:

1. **Context**: A short, engaging summary.
2. **Visual**: A `VideoBlock` (if available).
3. **Core Content**: 1-3 `MdBlock`s with clear headings, bold terms, and clean formatting.
4. **Assessment**: A `QuizBlock` with 3-5 challenging questions.
5. **Resources**: A `ResourceBlock` for further reading.

## Publication Logic (Strict)

1. **Hierarchical Visibility**:
   - A Section is ONLY visible if its `status` is `complete` AND its parent Module's `status` is `complete` AND the Course `status` is `published`.
2. **Metadata Accuracy**:
   - Section/Module counts on the homepage only include items that meet the visibility criteria above.

## Search Optimization

- Always use `tags` on the Course model for better discoverability.
- Use `learningGoals` in Sections to help the AI Tutor find relevant content.
