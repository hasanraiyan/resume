# Instructional Design & Pedagogy

To build high-fidelity technical courses, the agent must move beyond "writing information" and focus on "designing learning."

## The "Concept-Context-Check" Framework

Every block sequence in a section should ideally follow this cycle:

1.  **Concept**: Introduce the technical definition or logic (usually an `MdBlock`).
2.  **Context**: Show the concept in action using a `VideoBlock` (demo) or a `StepByStepBlock` (flow).
3.  **Check**: Immediately validate understanding with a 1-2 question `QuizBlock`.

## Scaffolding Technical Content

Technical subjects (like networking) are cumulative. The agent must use "Scaffolding":

- **Anchor Point**: Start each section by briefly referencing the previous one (e.g., "Now that we understand Topologies, let's see how data physically moves across them...").
- **Progressive Complexity**: Move from concrete hardware (Physical Layer) to abstract logic (Application Layer).
- **Explicit Connections**: Use `MdBlock` to explain _why_ one concept leads to the next.

## Effective Quiz Design

Quizzes are for learning, not just testing.

- **Distractor Quality**: Wrong options in `multiple_choice` should be "plausible misconceptions" (e.g., confusing Hubs with Switches).
- **Explanatory Feedback**: Every `correctAnswer` MUST have a detailed `explanation` that reinforces the "Why."
- **Variation**: Mix `multiple_choice`, `true_false`, and `multi_select` to keep engagement high.

## Visual-First Instruction

Human brains process visuals 60,000x faster than text.

- **Diagram Placement**: Never put a complex diagram at the end. Use it early to provide a "mental map" of the topic.
- **Mermaid Selection**:
  - `graph TD/LR`: Use for hierarchies and network layouts.
  - `sequenceDiagram`: Use for protocol handshakes (TCP/TLS) or request-response cycles.
  - `stateDiagram-v2`: Use for protocol states (e.g., TCP Listen -> Syn_Sent).
