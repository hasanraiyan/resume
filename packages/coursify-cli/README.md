# @coursify/cli

A command-line tool for local-first course authoring on the Coursify platform.

## Installation

```bash
npm install -g @coursify/cli
```

## Quick Start

1. **Initialize the CLI:**

   ```bash
   coursify setup init
   ```

2. **Configure your server:**

   ```bash
   coursify setup set-base-url https://your-coursify-server.com
   ```

3. **Authenticate:**

   ```bash
   coursify auth login
   ```

4. **Start creating courses:**
   ```bash
   coursify init "My Course"
   ```

## Usage

Once configured, you can use the `coursify` command:

```bash
coursify --help
```

### Commands

#### Setup (Required First)

**Initialize CLI:**

```bash
coursify setup init
```

**Configure server URL:**

```bash
coursify setup set-base-url https://your-server.com
```

**Show configuration:**

```bash
coursify setup show
```

#### Authentication

**Login to your server:**

```bash
coursify auth login
```

**Check auth status:**

```bash
coursify auth status
```

**Logout:**

```bash
coursify auth logout
```

#### Course Management

**Initialize a new course:**

```bash
coursify init "My Course Name"
```

**Add a module:**

```bash
cd my-course
coursify init-module "Introduction to Programming"
```

**Add a section:**

```bash
coursify init-section "Variables and Data Types" --module "module-1"
```

#### Validation and Publishing

**Validate course:**

```bash
coursify validate
```

**Package course:**

```bash
coursify package --output my-course.json
```

**List courses:**

```bash
coursify list
```

**Publish course:**

```bash
coursify publish --publish
```

## Options

- `-v, --verbose`: Enable verbose logging

## Course Structure

Courses are organized as follows:

```
my-course/
├── course.yml          # Course metadata
├── modules/
│   └── module-1/
│       ├── module.yml  # Module metadata
│       └── sections/
│           └── section-1/
│               ├── section.yml  # Section metadata
│               └── content.md   # Section content
```

## Requirements

- Node.js >= 18.0.0

## License

MIT
