---
title: What is RAG? (Retrieval-Augmented Generation)
summary: Define RAG and understand the three core problems it solves for LLMs: outdated knowledge, hallucination reduction, and source attribution.
learningGoals:
  - Define Retrieval-Augmented Generation.
  - Identify the three core problems RAG solves.
  - Explain the metaphor of "Parametric" vs. "Source" knowledge.
estimatedDuration: 15 mins
status: complete
---

# Blocks

## [MdBlock]

### The Bridge Between Training and Reality

Large Language Models (LLMs) are like geniuses living in a room without windows. They have read everything in the world up to a certain date (their **Training Cut-off**), but they cannot see what is happening outside _right now_. If you ask them about your company's latest internal memo or yesterday's news, they will either guess or confidently lie.

**Retrieval-Augmented Generation (RAG)** is the bridge that connects these models to the real world. It allows the model to "look out the window" by searching a specific set of documents before it answers your question.

> Think of RAG as giving an LLM an "Open Book" exam. Instead of relying on memory alone, it can consult a library of facts to provide an accurate answer.

---

## [VideoBlock]

url: https://youtu.be/T-D1OfcDW1M
title: What is RAG? Retrieval Augmented Generation Explained

---

## [MdBlock]

### Parametric vs. Source Knowledge

To understand RAG, we must distinguish between two types of knowledge in an AI system:

1.  **Parametric Knowledge**: This is "baked" into the model's weights during training. It represents the model's general intelligence and understanding of language. It is static and expensive to update.
2.  **Source Knowledge**: This is external data provided to the model at the moment you ask a question. This is dynamic, easy to update, and can be private to your organization.

**RAG works by converting your private data into Source Knowledge.**

---

## [StepByStepBlock]

title: The Core RAG Value Loop
showNumbering: true

- step: Information Retrieval
  content: When a user asks a question, the system first "retrieves" relevant documents from a private database.
- step: Prompt Augmentation
  content: The system "augments" the user's question by attaching the retrieved text to it.
- step: Grounded Generation
  content: The LLM "generates" an answer based _only_ on the provided context, ensuring the output is grounded in facts.

---

## [QuizBlock]

title: Knowledge Check: RAG Definition

- question: What does the 'R' in RAG stand for?
  type: multiple_choice
  options:
  - Recursive
  - Retrieval
  - Relational
  - Reinforcement
    correctAnswer: Retrieval
    explanation: RAG stands for Retrieval-Augmented Generation, highlighting the process of fetching external data to inform the model.

- question: Why is 'Parametric Knowledge' difficult to update?
  type: multiple_choice
  options:
  - Because it is stored in a simple text file.
  - Because it requires retraining the entire model or performing expensive fine-tuning.
  - Because the model is too small.
  - Because it only works in English.
    correctAnswer: Because it requires retraining the entire model or performing expensive fine-tuning.
    explanation: Parametric knowledge is the intelligence embedded in the model's neural weights; changing it means updating those weights.

---

## [ResourceBlock]

url: https://arxiv.org/abs/2005.11401
title: Original RAG Research Paper (Meta AI)
type: doc
