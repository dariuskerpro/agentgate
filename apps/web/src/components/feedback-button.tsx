"use client";

import React, { useState } from "react";
import { FeedbackModal } from "./feedback-modal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="feedback-fab"
        onClick={() => setOpen(true)}
        type="button"
        aria-label="Send feedback"
      >
        &#9889;
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
