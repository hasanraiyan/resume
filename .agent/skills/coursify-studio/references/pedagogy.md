# Instructional Design & Pedagogy

To build high-fidelity technical courses, the agent must move beyond "writing information" and focus on "designing learning."

## The "Standardized Section Flow"

A premium section should follow this mandatory starting sequence:

1.  **Introductory context**: An `MdBlock` that provides high-level definitions and "Scaffolding" (linking current concepts to previous ones).
2.  **Visual stimulus**: A `VideoBlock` (with an unquoted title) to provide immediate engagement.

## The "Concept-Context-Check" Framework

Every block sequence in a section should follow this instructional cycle:

1.  **Concept**: Introduce the technical definition or logic (usually an `MdBlock`).
2.  **Context**: Show the concept in action using a `VideoBlock` (demo) or a `StepByStepBlock` (flow).
3.  **Check**: Immediately validate understanding with a 1-2 question `QuizBlock`.

## Scaffolding Technical Content

Technical subjects (like networking) are cumulative. The agent must use "Scaffolding":

- **Anchor Point**: Start each section by briefly referencing the previous one (e.g., "Now that we understand Topologies, let's see how data physically moves across them...").
- **Progressive Complexity**: Move from concrete hardware (Physical Layer) to abstract logic (Application Layer).
- **Explicit Connections**: Use `MdBlock` to explain _why_ one concept leads to the next.

## High-Fidelity Quiz Design

Quizzes are for learning, not just testing.

- **Literal Mapping**: For `correctAnswer`, use the **exact literal text** of the option (e.g., `"true"`, `"UDP"`). This is mandatory for the Magic Import parser.
- **Distractor Quality**: Wrong options in `multiple_choice` should be "plausible misconceptions" (e.g., confusing Hubs with Switches).
- **Explanatory Feedback**: Every `correctAnswer` MUST have a detailed `explanation` that reinforces the "Why."

## Visual-First Instruction

Human brains process visuals 60,000x faster than text.

- **Diagram Placement**: Never put a complex diagram at the end. Use it early to provide a "mental map" of the topic.
- **Mermaid Selection**:
  - `graph TD/LR`: Use for hierarchies and network layouts.
  - `sequenceDiagram`: Use for protocol handshakes (TCP/TLS) or request-response cycles.
  - `stateDiagram-v2`: Use for protocol states (e.g., TCP Listen -> Syn_Sent).
