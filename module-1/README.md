# Module 1

Exercises for Module 1 of "Claude Code: Software Engineering with Generative AI Agents".
This file keeps the prompts used in each exercise for revision.

## Boilerplate prompt

Every prompt in this module follows the same structure: a goal, then sections in CAPS, then a
closing instruction. Copy this template and fill in the brackets. Leave out any section that
doesn't apply.

```text
I want you to [build / add] [FEATURE OR APP] for [WHO / PURPOSE].
[One or two sentences of vision: how it should feel and what success looks like.]

VERSION CONTROL:
- Before you start, create a new branch called "[branch-name]" (from [base branch])
- Make all your changes in this branch
- Commit your changes when complete

[CORE FEATURES / REQUIREMENTS]:
- [Feature 1]
- [Feature 2]
- [Feature 3]

TECHNICAL REQUIREMENTS:
- [Framework + version]
- [Language, styling, state management]
- [Validation, persistence, other constraints]

DESIGN REQUIREMENTS:
- [Look and feel, colour scheme]
- [Responsiveness, feedback, loading/error states]

IMPLEMENTATION APPROACH:
[How to approach it: simple vs. sophisticated, what to optimise for, what to avoid.
If this is one of several variants, say how it must differ from the others.]

PROCESS:
1. [Set up / create branch]
2. [Implement]
3. [Test that it works]
4. [Commit with a descriptive message]

[Closing: what "done" means, e.g. "Provide instructions on how to run and test it."
Optionally: "Be creative and surprise me with…"]
```

**Why it works:**
- **Goal and vision first:** the agent knows the purpose before it reads the details.
- **CAPS sections:** they make the requirements easy to scan and hard to skip.
- **Explicit version control and process steps:** they turn a request into a checklist the agent
  can follow and you can verify.
- **The implementation approach:** it controls ambition (simple, advanced or creative). This is
  what produced three very different results from the same feature request in exercise 2.
- **A closing deliverable:** it makes "done" observable, for example with run and test
  instructions.

## Exercises

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Next.js expense tracker built from one detailed prompt | [`exercise-01-expense-tracker/`](exercise-01-expense-tracker/) on `main` |
| 2 | The same data-export feature built three ways | Branches `feature-data-export-v1`, `-v2` and `-v3` |

---

## Exercise 1: Build the expense tracker

> I want you to create a modern, professional NextJS expense tracking application. Here's my vision:
>
> APPLICATION OVERVIEW:
> Build a complete expense tracking web app that helps users manage their personal finances. The app should feel modern, intuitive, and professional.
>
> CORE FEATURES:
> - Add expenses with date, amount, category, and description
> - View expenses in a clean, organized list
> - Filter expenses by date range and category
> - Dashboard with spending summaries and basic analytics
> - Categories: Food, Transportation, Entertainment, Shopping, Bills, Other
> - Data persistence using localStorage for this demo
>
> TECHNICAL REQUIREMENTS:
> - NextJS 14 with App Router
> - TypeScript for type safety
> - Tailwind CSS for styling with a modern, clean design
> - Responsive design that works on desktop and mobile
> - Use React hooks for state management
> - Form validation for expense inputs
> - Date picker for expense dates
> - Currency formatting for amounts
>
> DESIGN REQUIREMENTS:
> - Clean, modern interface with a professional color scheme
> - Intuitive navigation and user experience
> - Visual feedback for user actions
> - Loading states and error handling
> - Mobile-responsive design
>
> SPECIFIC FUNCTIONALITY:
> - Expense form with validation
> - Expense list with search and filter capabilities
> - Summary cards showing total spending, monthly spending, top categories
> - Basic charts or visual representations of spending patterns
> - Export functionality (at least CSV)
> - Delete and edit existing expenses
>
> Please create this as a complete, production-ready application. Set up the project structure, implement all features, and make sure everything works together seamlessly. Focus on creating something that looks professional and that I could actually use to track my expenses.
>
> When you're done, provide instructions on how to run the application and test all features.

---

## Exercise 2: One feature, three implementations

The same "data export" feature, prompted three different ways on three branches cut from the
same starting point. Compare the branches to see how the **IMPLEMENTATION APPROACH** section
shapes the result.

### Version 1: Simple (`feature-data-export-v1`)

> I want to add data export functionality to my expense tracker. For this first version, implement a SIMPLE approach.
>
> VERSION CONTROL:
> - Before you start, create a new branch called "feature-data-export-v1"
> - Make all your changes in this branch
> - Commit your changes when complete
>
> VERSION 1 REQUIREMENTS:
> - Add an "Export Data" button to the main dashboard
> - When clicked, export all expenses as a CSV file
> - Include columns: Date, Category, Amount, Description
> - Use a simple, straightforward implementation
> - Keep the UI minimal - just a button that triggers the download
>
> IMPLEMENTATION APPROACH:
> Focus on simplicity and getting it working quickly. Don't overthink the user experience - just make it functional. Use standard browser APIs for file download.
>
> PROCESS:
> 1. Create and checkout the new branch "feature-data-export-v1"
> 2. Implement the CSV export functionality
> 3. Add the export button to the dashboard
> 4. Test that it works correctly
> 5. Commit your changes with a descriptive message
>
> Remember: This is Version 1 of 3 - keep it simple and functional.

**Result:** one button on the dashboard and a small CSV helper.

### Version 2: Advanced, local (`feature-data-export-v2`)

> Excellent work on Version 1! Now I want you to implement the SAME data export feature in a completely different way.
>
> VERSION CONTROL:
> - Switch back to the original branch (before any export functionality)
> - Create a new branch called "feature-data-export-v2"
> - This should be a completely fresh implementation
>
> VERSION 2 REQUIREMENTS:
> Implement an ADVANCED export system with these features:
> - Export modal/dialog with multiple options
> - Multiple export formats: CSV, JSON, and PDF
> - Date range filtering for exports (start date, end date)
> - Category filtering for exports (select specific categories)
> - Preview of data before export (show table of what will be exported)
> - Custom filename input field
> - Export summary showing how many records will be exported
> - Loading states during export process
>
> IMPLEMENTATION APPROACH:
> This version should feel like a professional business application export feature. Think about what a power user would want - lots of control and options. Use a modal or drawer interface, not just a simple button.
>
> Make this implementation completely different from Version 1:
> - Different UI components and patterns
> - Different user experience flow
> - More sophisticated code architecture
> - Professional polish and attention to detail
>
> PROCESS:
> 1. Switch back to original branch
> 2. Create and checkout: git checkout -b feature-data-export-v2
> 3. Implement the advanced export system
> 4. Test all the functionality thoroughly
> 5. Commit your changes
>
> Show me what's possible with a more sophisticated approach. Be creative!

**Result:** a slide-over "Export Center" with CSV, JSON and PDF formats, date and category
filters, a live preview and file-name cleaning.

### Version 3: Cloud-integrated (`feature-data-export-v3`)

> Great work on Version 2! Now let's try a third completely different approach to the same export feature.
>
> VERSION CONTROL:
> - Switch back to the original branch (clean state, no export features)
> - Create branch "feature-data-export-v3"
>
> VERSION 3 REQUIREMENTS:
> Implement a CLOUD-INTEGRATED export system with these features:
> - Email export functionality (simulated - show UI flow)
> - Google Sheets integration mockup (show what the flow would look like)
> - Automatic backup scheduling options (UI for setting up recurring exports)
> - Export history tracking (show previous exports with timestamps)
> - Sharing capabilities - generate shareable links or QR codes
> - Export templates (different formats for different purposes: "Tax Report", "Monthly Summary", "Category Analysis")
> - Integration mockups with popular tools (Dropbox, OneDrive, etc.)
> - Cloud storage options and sync status indicators
>
> IMPLEMENTATION APPROACH:
> Think like a modern SaaS application - focus on connectivity, sharing, and integration with other services. Even if we're simulating some integrations, make the UI and user flow feel like a real cloud service.
>
> This should feel completely different from both Version 1 (simple) and Version 2 (advanced local):
> - Modern cloud service aesthetic
> - Focus on sharing and collaboration
> - Integration-first mindset
> - Background processing concepts
> - Service connectivity themes
>
> Be creative and surprise me with innovative features around data export, sharing, and cloud integration that I might not have thought of!
>
> PROCESS:
> 1. Switch to the original branch
> 2. Create and checkout: git checkout -b feature-data-export-v3
> 3. Implement the cloud-integrated export system
> 4. Make it feel modern, connected, and innovative
> 5. Commit your changes
>
> Think big picture - how would a company like Notion or Airtable approach this feature?

**Result:** a `/share` hub with templates, simulated integrations, a background task panel,
automations, export history, and share links with QR codes that work without a server.

### Comparing the versions

```bash
git diff feature-data-export-v1 feature-data-export-v2 --stat
git diff feature-data-export-v2 feature-data-export-v3 --stat
```
