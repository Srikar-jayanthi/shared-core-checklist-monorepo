# Shared-Core Cross-Platform Checklist App

A production-grade, Clean Architecture monorepo implementing a cross-platform checklist application targeting Web (React + Vite) and Desktop (Electron), sharing 100% of the core business logic, state management, and domain models via a pure, framework-agnostic package (`@checklist/core`).

---

## 🏛️ Architecture Overview

The system strictly follows **Clean Architecture** and the **Dependency Inversion Principle (DIP)**:

```
+-------------------------------------------------------------+
|                     Monorepo Workspace                      |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |    @checklist/web     |     |  @checklist/desktop   |   |
|   |   (React Web Shell)   |     |    (Electron Shell)   |   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             |               |
|               |    Imports and Subscribes   |               |
|               +------------->+<-------------+               |
|                              |                              |
|                   +----------v----------+                   |
|                   |   @checklist/core   |                   |
|                   |    (Pure Logic)     |                   |
|                   +----------+----------+                   |
|                              |                              |
+------------------------------|------------------------------+
                               |
                Core Internals | (Zero UI Frameworks)
                               v
            +------------------------------------+
            | - Domain Models (Task, FilterType) |
            | - State Manager (Observer Pattern) |
            | - Storage Port (IStorageAdapter)   |
            +------------------------------------+
```

### Key Architectural Rules
1. **Purity of Core**: `@checklist/core` contains zero UI dependencies (`react`, `vue`, `electron`, `tauri`, etc.). All business rules (adding, toggling, deleting, filtering tasks) are executed in pure TypeScript.
2. **Ports & Adapters (Hexagonal Architecture)**:
   - **Port**: `@checklist/core` defines `IStorageAdapter` specifying `saveTasks(tasks: Task[]): Promise<void>` and `loadTasks(): Promise<Task[]>`.
   - **Web Adapter**: `packages/web/src/storage/LocalStorageAdapter.ts` implements persistence using browser `window.localStorage`.
   - **Desktop Adapter**: `packages/desktop/src/storage/FileStorageAdapter.ts` implements persistence using native file-system storage (`tasks.json`).
3. **Reactive State Manager**: `ChecklistStore` implements the Observer pattern (`subscribe(callback)` / `notify()`), allowing external shells to hook in via React's `useSyncExternalStore` or native listeners.

---

## 📁 Repository Structure

```
.
├── package.json                 # Monorepo workspaces definition ("packages/*")
├── verify-solution.mjs          # Automated end-to-end specification validator
├── README.md                    # Architecture and operational documentation
└── packages/
    ├── core/                    # Framework-agnostic business logic
    │   ├── package.json         # @checklist/core (zero UI dependencies)
    │   ├── tsconfig.json
    │   ├── src/
    │   │   ├── index.ts         # Public exports (models, store, interfaces)
    │   │   ├── types.ts         # Task, IStorageAdapter, FilterType definitions
    │   │   └── store.ts         # ChecklistStore with Observer and caching
    │   └── tests/
    │       └── store.test.ts    # Vitest unit test suite (10 test cases)
    ├── web/                     # Web UI shell (React 18 + Vite)
    │   ├── package.json         # @checklist/web (depends on @checklist/core)
    │   ├── vite.config.ts
    │   ├── tsconfig.json
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx         # Injects LocalStorageAdapter into ChecklistStore
    │       ├── App.tsx          # UI with required Playwright data-testids
    │       ├── index.css        # Clean dark-mode stylesheet
    │       ├── hooks/
    │       │   └── useChecklist.ts # useSyncExternalStore adapter hook
    │       └── storage/
    │           └── LocalStorageAdapter.ts # IStorageAdapter browser implementation
    └── desktop/                 # Desktop UI shell (Electron)
        ├── package.json         # @checklist/desktop (depends on @checklist/core)
        ├── tsconfig.json
        └── src/
            ├── main.ts          # Electron main process with IPC bridge
            ├── preload.ts       # Secure renderer preload script
            ├── index.html       # Native desktop interface
            └── storage/
                └── FileStorageAdapter.ts # IStorageAdapter native filesystem implementation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm**: v9.0.0 or higher (supports workspaces)

### 1. Installation
Install all workspace dependencies from the root:
```bash
npm install
```

### 2. Running Core Unit Tests
Execute the isolated unit tests for `@checklist/core`:
```bash
npm test --workspace=@checklist/core
# or
npm test
```

### 3. Building All Packages
Compile TypeScript and bundle all packages across the workspace:
```bash
npm run build
```

Individual builds:
```bash
npm run build --workspace=@checklist/core
npm run build --workspace=@checklist/web
npm run build --workspace=@checklist/desktop
```

### 4. Running the Web Application
Start the Vite local development server:
```bash
npm run dev --workspace=@checklist/web
# or
npm run dev --workspace=packages/web
# or
npm run dev:web
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Running the Desktop Application
Start the Electron desktop shell:
```bash
npm start --workspace=@checklist/desktop
# or
npm start --workspace=packages/desktop
# or
npm run dev:desktop
```

---

## 🧪 Automated Testing & Evaluation

### Playwright `data-testid` Mapping
The Web UI incorporates all required attributes for automated end-to-end evaluation:

| UI Component | Element | `data-testid` |
| :--- | :--- | :--- |
| Task Input | `<input>` | `data-testid="task-input"` |
| Add Task Button | `<button>` | `data-testid="add-task-btn"` |
| Task Row | `<li>` | `data-testid="task-item"` |
| Completion Checkbox | `<input type="checkbox">` | `data-testid="task-checkbox"` |
| Delete Task Button | `<button>` | `data-testid="delete-task-btn"` |
| All Filter | `<button>` | `data-testid="filter-all"` |
| Active Filter | `<button>` | `data-testid="filter-active"` |
| Completed Filter | `<button>` | `data-testid="filter-completed"` |

### Automated Specification Verification
You can run the full multi-point audit script at any time:
```bash
node verify-solution.mjs
```

This verifies:
1. Monorepo workspace configuration in root `package.json` (`"workspaces": ["packages/*"]`).
2. Core package purity (strictly 0 UI dependencies in `dependencies` and `devDependencies`).
3. Web workspace dependency on `@checklist/core`.
4. Desktop workspace dependency on `@checklist/core`.
5. Physical implementation of `IStorageAdapter` port in `LocalStorageAdapter.ts`.
6. Presence of all 8 required `data-testid` attributes.
7. Isolated unit test execution for `@checklist/core` (`vitest`).
8. Full workspace build compilation (`tsc` + `vite build`).
