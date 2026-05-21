import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/styles.css" })).toBe("Editing styles.css");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" })).toBe("Reading index.ts");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/lib/utils.ts" })).toBe("Undoing edit in utils.ts");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/old.tsx" })).toBe("Renaming old.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/temp.js" })).toBe("Deleting temp.js");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "run" })).toBe("some_other_tool");
});

test("getToolLabel: missing path falls back to generic phrase for create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: missing path falls back to generic phrase for str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace" })).toBe("Editing file");
});

test("getToolLabel: missing path falls back to generic phrase for view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view" })).toBe("Reading file");
});

test("getToolLabel: missing path falls back to generic phrase for rename", () => {
  expect(getToolLabel("file_manager", { command: "rename" })).toBe("Renaming file");
});

test("getToolLabel: missing path falls back to generic phrase for delete", () => {
  expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

// --- ToolInvocationBadge component tests ---

test("ToolInvocationBadge renders friendly label text", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "create", path: "src/App.jsx" },
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolInvocationBadge shows green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "create", path: "src/App.jsx" },
        result: "Success",
      }}
    />
  );

  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge shows spinner when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "create", path: "src/App.jsx" },
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        state: "partial-call",
        args: { command: "str_replace", path: "src/Card.tsx" },
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).toBeDefined();
});
