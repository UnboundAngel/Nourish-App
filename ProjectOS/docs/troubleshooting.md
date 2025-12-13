# Troubleshooting Guide

This document outlines common issues encountered during development and their solutions.

## 1. 'electron' command not recognized

**Issue:** When trying to run the application using `electron .`, the command is not found.

**Reason:** The `electron` binary might not be globally installed or in the system's PATH. It is typically installed as a development dependency within `node_modules/.bin/`.

**Solution:**
1.  Ensure all project dependencies are installed by running:
    ```bash
    npm install
    ```
2.  Use `npx` to execute the local `electron` binary:
    ```bash
    npx electron .
    ```

## 2. SyntaxError: Unexpected token in src/App.tsx

**Issue:** A `SyntaxError: Unexpected token` (e.g., `(276:0)`) occurs during compilation in `src/App.tsx`, often around a component definition like `<button>`.

**Reason:** This typically indicates a malformed or incomplete React component definition. In one instance, a `<button>` element was orphaned and not correctly wrapped within a component definition (`GlowButton`).

**Solution:**
Ensure that all React components are properly defined. If a component like `GlowButton` is intended, define it explicitly:

```typescript
const GlowButton = ({ type, onClick, variant, className, Icon, children }) => (
  <button 
    type={type}
    onClick={onClick}
    className={`
      relative group flex items-center justify-center gap-2 px-4 py-2 font-mono text-sm transition-all duration-300 rounded-sm
      ${variant === 'primary' 
        ? 'bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]'
        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-red-400 hover:border-red-900/30'}
      ${className}
    `}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);
```

## 3. Identifier '...' has already been declared in src/App.tsx

**Issue:** A compilation error like `Identifier 'getLanguage' has already been declared` occurs in `src/App.tsx`.

**Reason:** This error signifies duplicate declarations of a variable, function, or interface within the same scope. This can happen due to accidental copy-pasting of code blocks.

**Solution:**
Review the specified line number in `src/App.tsx` and identify the duplicated code block. Remove the redundant declaration. In one instance, functions like `getLanguage` and `highlightSyntax`, along with the `CodeEditorProps` interface, were duplicated.

## 4. Black Screen on Application Start-up (after fixing compilation errors)

**Issue:** The Electron application window appears, but it's a black screen, even after resolving JavaScript compilation errors.

**Reason:** The `dist/bundle.js` file (the bundled React application) might be outdated or not generated. The `npm start` script (`electron .`) only launches the Electron process and does not automatically trigger the webpack build.

**Solution:**
Manually run webpack to ensure the latest `bundle.js` is generated before starting the Electron application:

1.  Run webpack to build the bundle:
    ```bash
    npx webpack
    ```
2.  Then, start the Electron application:
    ```bash
    npx electron .
    ```

**Recommendation for Development Workflow:**
To streamline the development process, consider adding a `dev` script to `package.json` that concurrently runs webpack in watch mode and starts Electron. This would require installing a utility like `concurrently` (e.g., `npm install --save-dev concurrently`):

```json
"scripts": {
  "start": "electron .",
  "build": "electron-builder",
  "dev": "concurrently \"npx webpack --watch\" \"npx electron .\""
},
```
Then you can run `npm run dev` to start both processes.

```