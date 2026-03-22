"use client";

import React, { useState, useRef, useEffect } from "react";

interface FeedbackData {
  issueType: string;
  description: string;
  email: string;
}

export function validateFeedback(data: FeedbackData): string[] {
  const errors: string[] = [];
  if (!data.description || data.description.trim().length < 10) {
    errors.push("Description must be at least 10 characters");
  }
  if (!data.issueType) {
    errors.push("Issue type is required");
  }
  return errors;
}

export function buildMailtoLink(data: FeedbackData): string {
  const subject = `[AgentGate Feedback] ${data.issueType}`;
  const bodyParts = [
    `Issue Type: ${data.issueType}`,
    `Description: ${data.description}`,
  ];
  if (data.email) {
    bodyParts.push(`Email: ${data.email}`);
  }
  const body = bodyParts.join("\n\n");
  return `mailto:dkerpalprofessional@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [issueType, setIssueType] = useState("Bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setErrors([]);
      setSuccess(false);
    }
  }, [open]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: FeedbackData = { issueType, description, email };
    const validationErrors = validateFeedback(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    const mailto = buildMailtoLink(data);
    window.open(mailto, "_blank");
    setSuccess(true);
    setDescription("");
    setEmail("");
    setIssueType("Bug");
  }

  if (!open) return null;

  if (success) {
    return (
      <div
        className="feedback-modal-overlay"
        ref={overlayRef}
        onClick={handleOverlayClick}
      >
        <div className="feedback-modal">
          <button className="feedback-modal-close" onClick={onClose} type="button">
            &times;
          </button>
          <div className="feedback-success">
            <span className="feedback-success-icon">&#10003;</span>
            <h3>Thanks for your feedback!</h3>
            <p>Your email client should have opened with the details. Hit send to deliver it.</p>
            <button className="feedback-btn" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="feedback-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={onClose} type="button">
          &times;
        </button>
        <h3 className="feedback-modal-title">Send Feedback</h3>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <label className="feedback-label">
            Issue Type
            <select
              className="feedback-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="Bug">Bug</option>
              <option value="Suggestion">Suggestion</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="feedback-label">
            Description <span className="feedback-required">*</span>
            <textarea
              className="feedback-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or suggestion (min 10 chars)..."
              rows={4}
            />
          </label>
          <label className="feedback-label">
            Email <span className="feedback-optional">(optional)</span>
            <input
              className="feedback-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </label>
          {errors.length > 0 && (
            <ul className="feedback-errors">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <button className="feedback-btn" type="submit">
            Send Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
