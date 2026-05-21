import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

const anonWorkWithMessages = {
  messages: [{ id: "1", role: "user", content: "Hello" }],
  fileSystemData: { "/App.jsx": { type: "file", content: "export default () => <div/>" } },
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "new-project-id" });
  });

  afterEach(() => {
    cleanup();
  });

  describe("initial state", () => {
    test("starts with isLoading false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("sets isLoading true during sign-in and false after", async () => {
      let resolveSignIn!: (v: any) => void;
      (signInAction as any).mockReturnValue(
        new Promise((res) => { resolveSignIn = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => { result.current.signIn("user@test.com", "password123"); });
      expect(result.current.isLoading).toBe(true);

      await act(async () => { resolveSignIn({ success: false, error: "Invalid" }); });
      expect(result.current.isLoading).toBe(false);
    });

    test("calls signInAction with email and password", async () => {
      (signInAction as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@test.com", "mypassword");
      });

      expect(signInAction).toHaveBeenCalledWith("user@test.com", "mypassword");
    });

    test("returns the result from signInAction", async () => {
      const failResult = { success: false, error: "Invalid credentials" };
      (signInAction as any).mockResolvedValue(failResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@test.com", "wrong");
      });

      expect(returnValue).toEqual(failResult);
    });

    test("does not redirect on failed sign-in", async () => {
      (signInAction as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "wrong"); });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading false even when signInAction throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        try { await result.current.signIn("user@test.com", "password"); } catch {}
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading true during sign-up and false after", async () => {
      let resolveSignUp!: (v: any) => void;
      (signUpAction as any).mockReturnValue(
        new Promise((res) => { resolveSignUp = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => { result.current.signUp("new@test.com", "password123"); });
      expect(result.current.isLoading).toBe(true);

      await act(async () => { resolveSignUp({ success: false, error: "Already exists" }); });
      expect(result.current.isLoading).toBe(false);
    });

    test("calls signUpAction with email and password", async () => {
      (signUpAction as any).mockResolvedValue({ success: false, error: "Already exists" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@test.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@test.com", "password123");
    });

    test("returns the result from signUpAction", async () => {
      const failResult = { success: false, error: "Email already registered" };
      (signUpAction as any).mockResolvedValue(failResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("existing@test.com", "password123");
      });

      expect(returnValue).toEqual(failResult);
    });

    test("sets isLoading false even when signUpAction throws", async () => {
      (signUpAction as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        try { await result.current.signUp("user@test.com", "password"); } catch {}
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn — anonymous work exists", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(anonWorkWithMessages);
      (createProject as any).mockResolvedValue({ id: "saved-anon-project" });
    });

    test("creates a project with the anonymous work after sign-in", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWorkWithMessages.messages,
        data: anonWorkWithMessages.fileSystemData,
      });
    });

    test("clears anonymous work after saving it", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(clearAnonWork).toHaveBeenCalledTimes(1);
    });

    test("redirects to the new project after sign-in", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(mockPush).toHaveBeenCalledWith("/saved-anon-project");
    });

    test("does not call getProjects when anon work exists", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(getProjects).not.toHaveBeenCalled();
    });

    test("works the same for signUp", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signUp("new@test.com", "password"); });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: anonWorkWithMessages.messages })
      );
      expect(clearAnonWork).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/saved-anon-project");
    });
  });

  describe("handlePostSignIn — no anonymous work, existing projects", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([
        { id: "project-1" },
        { id: "project-2" },
      ]);
    });

    test("redirects to the most recent project", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    test("does not create a new project when one already exists", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(createProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — anonymous work with empty messages", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue({ messages: [], fileSystemData: {} });
      (getProjects as any).mockResolvedValue([{ id: "existing-project" }]);
    });

    test("skips creating project from empty anon work and falls through to existing projects", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });
  });

  describe("handlePostSignIn — no anonymous work, no existing projects", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "brand-new-project" });
    });

    test("creates a new blank project", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });

    test("redirects to the newly created project", async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@test.com", "password"); });

      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });
  });
});
