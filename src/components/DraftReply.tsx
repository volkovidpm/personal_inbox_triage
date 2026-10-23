import { useState } from "react";
import { formatDuration } from "../lib/format";
import type { DraftResult } from "../lib/types";

export function DraftReply({ draft }: { draft: DraftResult }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(draft.text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };
  return (
    <div className="it-draft">
      <div className="it-draft__label">
        <span>Черновик ответа · Claude{draft.source === "recorded" ? " · запись" : ""}</span>
        <span className="it-draft__time">{formatDuration(draft.ms)}</span>
      </div>
      <p className="it-draft__text">{draft.text}</p>
      <div className="it-draft__actions">
        <button className="it-btn it-btn--secondary" type="button" onClick={copy}>
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>
    </div>
  );
}
