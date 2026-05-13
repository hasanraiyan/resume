---
title: 'LangChain Document Loaders'
summary: 'Learn how to connect to hundreds of data sources using LangChain. This section covers the mechanics of loaders and the standard Document schema used by engineers.'
learningGoals:
  - 'Explain the role of a Document Loader in the RAG ecosystem.'
  - 'Implement a PDF Loader in Python using best practices.'
  - "Differentiate between 'Lazy' and 'Batch' loading for massive datasets."
estimatedDuration: '25 mins'
status: 'complete'
---

# Blocks

## [MdBlock]

### Standardizing the Raw Data

Information lives in many places: Notion pages, Postgres databases, PDF files, and Slack threads. To build a RAG system, we need a way to pull this data into a consistent format.

In LangChain, a **Document Loader** is a specialized class that connects to a specific data source and outputs a list of **Document objects**. These objects are the universal currency of the LangChain ecosystem.

```python
from langchain_community.document_loaders import PyPDFLoader

# High-fidelity loading pattern
loader = PyPDFLoader("data/technical_manual.pdf")
docs = loader.load()

# Accessing the standard schema
print(docs[0].page_content) # The raw text
print(docs[0].metadata)     # The 'hidden' facts (source, page, etc)
```

---

## [VideoBlock]

url: https://youtu.be/K-81Z8BfRps
title: "Master LangChain Document Loaders"

---

## [MdBlock]

### The Standard Document Schema

Regardless of the source, every loader produces a **Document** object with two critical fields:

1.  **`page_content`**: The actual string of text extracted from the source.
2.  **`metadata`**: A dictionary containing extra info.

> **Metadata is your secret weapon.** By saving the "Author" or "Created Date" in metadata during loading, you can later perform **Metadata Filtering** to only search documents written by a specific person or within a specific time range.

---

## [StepByStepBlock]

title: "Building a Robust PDF Loader"
showNumbering: false

- step: "Library Selection"
  content: "Use `pip install pypdf`. This is the most popular engine for reliable text extraction from complex PDF layouts."
- step: "Implementation"
  content: "Initialize the `PyPDFLoader` with the path to your file. This object handles the conversion from binary PDF to UTF-8 text."
- step: "Memory Management"
  content: "For massive files (1000+ pages), use `loader.lazy_load()` instead of `load()`. This processes the file one page at a time to prevent your server from crashing."
- step: "Schema Inspection"
  content: "Check the `metadata` of the first document. Ensure it captured the `source` path and `page` number automatically."

---

## [QuizBlock]

- question: "Which method should you use when processing a 5,000-page document on a machine with limited RAM?"
  type: "multiple_choice"
  options:
  - "loader.load()"
  - "loader.lazy_load()"
  - "loader.delete_all()"
  - "loader.summarize()"
    correctAnswer: "loader.lazy_load()"
    explanation: "Lazy loading yields documents one by one using a generator, keeping memory usage constant regardless of file size."
    points: 1
- question: "What are the two mandatory fields in a LangChain Document object?"
  type: "multiple_choice"
  options:
  - "text and source"
  - "page_content and metadata"
  - "header and footer"
  - "string and dictionary"
    correctAnswer: "page_content and metadata"
    explanation: "Every document in LangChain follows this 2-field schema to ensure it can be passed into any splitter or vector store."
    points: 1
- question: "What happens if a Document Loader fails to extract text from a specific page?"
  type: "multiple_choice"
  options:
  - "It deletes the entire file."
  - "It usually returns an empty string for that page and may log a warning or raise an error depending on the 'on_error' strategy."
  - "It automatically translates the page using AI."
  - "It crashes the entire database."
    correctAnswer: "It usually returns an empty string for that page and may log a warning or raise an error depending on the 'on_error' strategy."
    explanation: "High-fidelity loaders are built to be resilient. They usually report failures gracefully so the rest of the ingestion pipeline can continue."
    points: 1

---

## [ResourceBlock]

url: https://python.langchain.com/docs/integrations/document_loaders/
title: "Full List of 100+ LangChain Loaders"
type: "doc"
