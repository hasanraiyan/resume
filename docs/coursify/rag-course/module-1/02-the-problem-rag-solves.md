---
title: The Problem RAG Solves
summary: Understand the limitations of LLMs — knowledge cutoffs, hallucinations, and lack of source attribution — and how RAG addresses each one with engineering precision.
learningGoals:
  - Identify the three primary LLM limitations addressed by RAG.
  - Explain how retrieval reduces the frequency of hallucinations.
  - Describe the importance of source attribution in enterprise AI.
estimatedDuration: 20 mins
status: complete
---

# Blocks

## [MdBlock]

### Why Standard LLMs Fail the Enterprise

While LLMs are impressive, they are often unsuitable for professional or high-stakes environments out of the box. Engineers face three "deal-breaker" problems when deploying standard models:

1.  **The Knowledge Cut-off**: Models have an expiration date. If your product launched last week, GPT-4 has never heard of it.
2.  **Hallucinations**: Models are optimized to be helpful and fluent, not necessarily truthful. When they don't know an answer, they often "hallucinate" a plausible-sounding but false one.
3.  **Lack of Transparency**: A standard LLM cannot tell you _where_ it got its information. It just "knows" it (or thinks it does).

RAG is designed to solve all three.

---

## [VideoBlock]

url: https://youtu.be/M_Fz7Vj_6K8
title: Addressing LLM Hallucinations with RAG

---

## [MdBlock]

### Engineering Truth: How RAG Fixes These Issues

By shifting the model from "Memory Mode" to "Search Mode," RAG transforms the reliability of the system:

- **Zero-Day Knowledge**: You can add a document to your database today, and the RAG system can answer questions about it one second later. No retraining required.
- **Groundedness**: By providing the exact text snippets needed to answer the question, we give the model a "fact-checker" in its own prompt.
- **Source Attribution**: Because we know which documents were retrieved, we can provide citations (e.g., "According to page 4 of the HR Manual..."), building trust with the user.

---

## [StepByStepBlock]

title: From Hallucination to Grounded Truth
showNumbering: true

- step: Identify the Gap
  content: The system detects that the user is asking about a specific internal fact that isn't in the model's base training.
- step: Fetch the Facts
  content: The system queries the vector database for the most semantically relevant text chunks.
- step: Constraint Setting
  content: The system instructs the LLM: "Use ONLY the following context to answer the question. If you don't know the answer, say you don't know."
- step: Verification
  content: The system generates the answer and provides a link or reference to the source document for user verification.

---

## [QuizBlock]

title: Hallucination & Attribution Check

- question: What is a 'hallucination' in the context of LLMs?
  type: multiple_choice
  options:
  - When the model takes too long to respond.
  - When the model generates a factually incorrect but fluent-sounding answer.
  - When the model refuses to answer a question.
  - When the model uses too many emojis.
    correctAnswer: When the model generates a factually incorrect but fluent-sounding answer.
    explanation: Hallucinations occur when models "fill in the gaps" of their knowledge with made-up information.

- question: How does RAG provide 'Source Attribution'?
  type: multiple_choice
  options:
  - By guessing which website the info came from.
  - By keeping track of exactly which document chunks were retrieved and provided to the model.
  - By asking the model to cite its sources from memory.
  - By only using Wikipedia as a source.
    correctAnswer: By keeping track of exactly which document chunks were retrieved and provided to the model.
    explanation: Since the RAG system explicitly fetches document fragments, it can present those fragments (and their metadata) as citations.

---

## [ResourceBlock]

url: https://help.openai.com/en/articles/6825458-hallucinations-in-llms
title: Understanding Hallucinations (OpenAI Guide)
type: article
