# Project Context – R-Squared Software Solutions LLC

## 1. Business Overview

**Company Name:** R-Squared Software Solutions LLC  
**Owner:** Sole member / founder  
**Location:** Ohio, USA  
**Status:** LLC formed, EIN obtained, business bank account planned/active  

### Purpose of the Business
R-Squared Software Solutions LLC was created to:
- Own and protect intellectual property developed outside of employment
- Build and sell a **commercial, configurable software platform**
- Avoid hard-coding customer-specific logic so the product can be licensed to multiple companies
- Create long-term value beyond a single internal tool

The company exists specifically to support the development, licensing, and potential sale of a **product configurator platform**.

---

## 2. The Configurator Project – High-Level Vision

### What the Product Is
A **configurable product platform** focused initially on **pump station configuration**, with:
- Categories → Subcategories → Options → Attributes
- Dynamic option availability and requirements
- Rule-driven behavior without hard-coded logic
- Data-driven dropdowns, matrices, and expressions
- A modern UI with a left-side option navigator and inline editing

Although inspired by Infor CPQ, this product intentionally **does not replicate Infor’s top-down rule execution model**.

### Why This Product Exists
- Existing CPQ tools (Infor, etc.) are rigid, opaque, and hard to customize
- Business rules change frequently and should be editable by non-developers
- Configuration should be **reactive**, not procedural
- Options should invalidate downstream options naturally instead of rerunning an entire wizard
- The product must be sellable to **other companies with different business logic**

---

## 3. Architectural Principles (Agreed Upon)

### Core Concepts
- **Option-centric**, not wizard-centric
- Rules are **data + expressions**, not code
- The system is **reactive**: changes propagate only where needed
- One reusable table component (`DataTable`) across the entire app
- Strong separation between:
  - Data model
  - Rules/expressions
  - UI rendering

### Configuration Hierarchy
# Project Context – R-Squared Software Solutions LLC

## 1. Business Overview

**Company Name:** R-Squared Software Solutions LLC  
**Owner:** Sole member / founder  
**Location:** Ohio, USA  
**Status:** LLC formed, EIN obtained, business bank account planned/active  

### Purpose of the Business
R-Squared Software Solutions LLC was created to:
- Own and protect intellectual property developed outside of employment
- Build and sell a **commercial, configurable software platform**
- Avoid hard-coding customer-specific logic so the product can be licensed to multiple companies
- Create long-term value beyond a single internal tool

The company exists specifically to support the development, licensing, and potential sale of a **product configurator platform**.

---

## 2. The Configurator Project – High-Level Vision

### What the Product Is
A **configurable product platform** focused initially on **pump station configuration**, with:
- Categories → Subcategories → Options → Attributes
- Dynamic option availability and requirements
- Rule-driven behavior without hard-coded logic
- Data-driven dropdowns, matrices, and expressions
- A modern UI with a left-side option navigator and inline editing

Although inspired by Infor CPQ, this product intentionally **does not replicate Infor’s top-down rule execution model**.

### Why This Product Exists
- Existing CPQ tools (Infor, etc.) are rigid, opaque, and hard to customize
- Business rules change frequently and should be editable by non-developers
- Configuration should be **reactive**, not procedural
- Options should invalidate downstream options naturally instead of rerunning an entire wizard
- The product must be sellable to **other companies with different business logic**

---

## 3. Architectural Principles (Agreed Upon)

### Core Concepts
- **Option-centric**, not wizard-centric
- Rules are **data + expressions**, not code
- The system is **reactive**: changes propagate only where needed
- One reusable table component (`DataTable`) across the entire app
- Strong separation between:
  - Data model
  - Rules/expressions
  - UI rendering

### Configuration Hierarchy
Category
└─ SubCategory
└─ Option
└─ Attribute(s)


### Option Behavior
Options can be:
- Available
- Not Available (blocked)
- Required

Option availability and requirement can depend on:
- Other options being selected / not selected
- Attribute values anywhere in the configuration

### Attribute Behavior
Attributes can be:
- Visible / hidden
- Required / optional
- Constrained by dynamic value sets
- Backed by static lists or dynamic matrix queries

---

## 4. Data Model (Conceptual)

### Core Tables
- categories
- subcategories
- options
- attributes
- option_lists
- option_list_items

### Supporting Tables (planned or in progress)
- matrices
- matrix_columns
- matrix_rows
- matrix_values
- configurations
- configuration_selected_options
- configuration_attribute_values

---

## 5. Expressions & Functions

### Expression Language
A safe, limited expression language similar to Excel / CPQ formulas:
- Arithmetic and comparisons
- Boolean logic
- IF expressions
- Collection helpers (COUNT, MAX, etc.)
- Matrix lookup helpers

Expressions are stored as strings and evaluated against a configuration context.

### Built-In Function Categories
- Math
- Strings
- Booleans
- Collections
- Matrix lookups
- Option list generation

---

## 6. UI Direction

### Runtime Configurator
- Left-side drawer listing Categories and Subcategories
- Options shown in expected completion order
- Status indicators:
  - Not configured
  - Configured
  - Required / error
  - Blocked
- Changing upstream selections invalidates downstream options as needed

### Admin / Builder UI
- Category & Subcategory management (completed)
- Option List editor (in progress)
- Inline editable tables with:
  - Clipboard paste
  - File import
  - Validation
  - Consistent UX
- Future:
  - Option builder
  - Rule builder
  - Matrix editor

---

## 7. What Has Been Completed

### Business Setup
- LLC formation completed
- EIN obtained
- Operating Agreement created
- Business bank account planning discussed

### Backend
- Prisma enabled
- Core schema created
- Category and Subcategory CRUD implemented
- API foundation in place

### Frontend
- Category and Subcategory forms completed
- Option List editor in progress
- Inline editable table implemented
- Clipboard paste and import implemented

### Architecture Decisions
- DataTable is the single table abstraction
- Other table components identified as legacy / candidates for removal
- Agreement to componentize DataTable logic to reduce file size and improve reuse

---

## 8. Current Focus (In Progress)

### DataTable Refactor
- Extract column definition builder
- Extract column filter menu logic
- Extract shared utilities (unique filter values)
- Keep DataTable as orchestration-only

### Option List Editor
- Default styling and UX polish
- Validation improvements
- Consistent toolbar behavior
- Preparation for reuse in matrices and rule builders

---

## 9. Upcoming Work (Planned)

### Near-Term
- Finish DataTable componentization
- Finalize Option List editor UX
- Implement matrix data model
- Add matrix query engine

### Mid-Term
- Build Option Builder UI
- Add availability / required rule definitions
- Implement expression evaluator
- Connect rules to runtime configurator

### Long-Term
- Output generation (JSON / XML)
- Integration APIs
- Multi-tenant support
- Licensing & customer onboarding
- Documentation and SOPs

---

## 10. Strategic Reminder

This project is:
- A **product**, not a one-off internal tool
- Designed for resale, licensing, or acquisition
- Built with maintainability, extensibility, and clarity as first-class goals

When in doubt:
- Prefer data over code
- Prefer composition over duplication
- Prefer clarity over cleverness
