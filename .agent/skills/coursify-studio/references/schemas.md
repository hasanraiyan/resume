# Coursify Data Models & Schemas

```mermaid
classDiagram
    class CoursifyCourse {
        +String title
        +String slug
        +String difficulty
        +String status
        +String authoringStatus
        +String[] tags
    }
    class CoursifyModule {
        +ObjectId courseId
        +String title
        +String status
        +Number order
    }
    class CoursifySection {
        +ObjectId courseId
        +ObjectId moduleId
        +String title
        +Block[] blocks
        +String status
    }
    class Block {
        +String type
        +String title
        +Object data
        +Number order
    }

    CoursifyCourse "1" --* "many" CoursifyModule : contains
    CoursifyModule "1" --* "many" CoursifySection : contains
    CoursifySection "1" --* "many" Block : composed of

    Block <|-- MdBlock : is
    Block <|-- VideoBlock : is
    Block <|-- QuizBlock : is
    Block <|-- ResourceBlock : is
    Block <|-- StepByStepBlock : is
```

## CoursifySection

The actual learning unit containing content blocks.

```javascript
{
  courseId: ObjectId,
  moduleId: ObjectId (Optional),
  title: String,
  summary: String,
  learningGoals: [String],
  estimatedDuration: String,
  order: Number,
  status: ['planned', 'draft', 'needs_review', 'complete'],
  blocks: [BlockSchema]
}
```

### Block Types (High-Fidelity)

- **MdBlock**: Markdown content.
  - `{ type: 'MdBlock', content: String }`
- **VideoBlock**: Embedded video.
  - `{ type: 'VideoBlock', video: { url: String, title: String, platform: 'youtube' } }`
- **QuizBlock**: Interactive assessment. Supports literal answer text mapping.
  - `{ type: 'QuizBlock', title: String, quiz: { questions: [QuizQuestionSchema] } }`
- **ResourceBlock**: External high-authority links.
  - `{ type: 'ResourceBlock', resource: { url: String, title: String, type: 'video'|'article'|'doc' } }`
- **StepByStepBlock**: Procedural timelines with numbering control.
  - `{ type: 'StepByStepBlock', title: String, showNumbering: Boolean, steps: [{ title: String, content: String }] }`
  - _Note: Use literal `\n\n` within step content strings to represent newlines for correct Markdown rendering._
