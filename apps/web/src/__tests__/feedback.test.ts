import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Feedback components", () => {
  it("FeedbackButton component exports correctly", async () => {
    const mod = await import("../components/feedback-button.js");
    expect(mod.FeedbackButton).toBeDefined();
    expect(typeof mod.FeedbackButton).toBe("function");
  });

  it("FeedbackModal component exports correctly", async () => {
    const mod = await import("../components/feedback-modal.js");
    expect(mod.FeedbackModal).toBeDefined();
    expect(typeof mod.FeedbackModal).toBe("function");
  });
});

describe("Feedback form validation", () => {
  function validateFeedback(data: {
    issueType: string;
    description: string;
    email?: string;
  }): string[] {
    // Re-implement validation logic inline to test the rules
    const errors: string[] = [];
    if (!data.description || data.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters");
    }
    if (!data.issueType) {
      errors.push("Issue type is required");
    }
    return errors;
  }

  it("requires description with min 10 chars", () => {
    const errors = validateFeedback({ issueType: "Bug", description: "short" });
    expect(errors).toContain("Description must be at least 10 characters");
  });

  it("rejects empty description", () => {
    const errors = validateFeedback({ issueType: "Bug", description: "" });
    expect(errors).toContain("Description must be at least 10 characters");
  });

  it("accepts valid description", () => {
    const errors = validateFeedback({
      issueType: "Bug",
      description: "This is a valid bug report with enough detail",
    });
    expect(errors).toHaveLength(0);
  });

  it("requires issue type", () => {
    const errors = validateFeedback({
      issueType: "",
      description: "This is a valid description",
    });
    expect(errors).toContain("Issue type is required");
  });

  it("email is optional", () => {
    const errors = validateFeedback({
      issueType: "Suggestion",
      description: "This is a valid suggestion with enough detail",
    });
    expect(errors).toHaveLength(0);
  });
});

describe("Feedback form submission", () => {
  it("builds correct mailto payload", () => {
    const data = {
      issueType: "Bug",
      description: "The button does not work correctly on mobile",
      email: "user@example.com",
    };

    const subject = `[AgentGate Feedback] ${data.issueType}`;
    const body = [
      `Issue Type: ${data.issueType}`,
      `Description: ${data.description}`,
      `Email: ${data.email}`,
    ].join("\n\n");

    const mailto = `mailto:dkerpalprofessional@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    expect(mailto).toContain("mailto:dkerpalprofessional@gmail.com");
    expect(mailto).toContain(encodeURIComponent("[AgentGate Feedback] Bug"));
    expect(mailto).toContain(encodeURIComponent("Issue Type: Bug"));
    expect(mailto).toContain(
      encodeURIComponent(
        "The button does not work correctly on mobile"
      )
    );
    expect(mailto).toContain(encodeURIComponent("Email: user@example.com"));
  });

  it("builds payload without email when not provided", () => {
    const data = {
      issueType: "Suggestion",
      description: "Add dark mode toggle to the settings page",
      email: "",
    };

    const subject = `[AgentGate Feedback] ${data.issueType}`;
    const bodyParts = [
      `Issue Type: ${data.issueType}`,
      `Description: ${data.description}`,
    ];
    if (data.email) {
      bodyParts.push(`Email: ${data.email}`);
    }
    const body = bodyParts.join("\n\n");

    const mailto = `mailto:dkerpalprofessional@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    expect(mailto).not.toContain("Email:");
  });
});

describe("FeedbackModal state management", () => {
  it("exports validateFeedback utility", async () => {
    const mod = await import("../components/feedback-modal.js");
    expect(mod.validateFeedback).toBeDefined();
    expect(typeof mod.validateFeedback).toBe("function");
  });

  it("exports buildMailtoLink utility", async () => {
    const mod = await import("../components/feedback-modal.js");
    expect(mod.buildMailtoLink).toBeDefined();
    expect(typeof mod.buildMailtoLink).toBe("function");
  });

  it("validateFeedback returns errors for invalid input", async () => {
    const { validateFeedback } = await import(
      "../components/feedback-modal.js"
    );
    const errors = validateFeedback({ issueType: "", description: "short", email: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validateFeedback returns empty array for valid input", async () => {
    const { validateFeedback } = await import(
      "../components/feedback-modal.js"
    );
    const errors = validateFeedback({
      issueType: "Bug",
      description: "This is a perfectly valid description",
      email: "",
    });
    expect(errors).toHaveLength(0);
  });

  it("buildMailtoLink returns a mailto: string", async () => {
    const { buildMailtoLink } = await import(
      "../components/feedback-modal.js"
    );
    const link = buildMailtoLink({
      issueType: "Bug",
      description: "Something is broken on the landing page",
      email: "test@test.com",
    });
    expect(link).toMatch(/^mailto:/);
    expect(link).toContain("dkerpalprofessional");
  });

  it("buildMailtoLink omits email field when empty", async () => {
    const { buildMailtoLink } = await import(
      "../components/feedback-modal.js"
    );
    const link = buildMailtoLink({
      issueType: "Other",
      description: "Just a general comment about the site",
      email: "",
    });
    expect(link).not.toContain("Email%3A");
  });
});
