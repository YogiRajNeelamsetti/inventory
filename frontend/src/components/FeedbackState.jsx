import { AlertTriangle, Inbox, Clock3 } from "lucide-react";
import "./FeedbackState.css";

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "Updated just now";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Updated just now";
  }

  const label = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `Updated ${label}`;
};

export function LoadingState({ message = "Loading...", compact = false, fullHeight = false }) {
  const classes = ["feedback-loading"];
  if (compact) classes.push("compact");
  if (fullHeight) classes.push("full-height");

  return (
    <div className={classes.join(" ")} role="status" aria-live="polite">
      <span className="feedback-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  details,
  retryLabel = "Try again",
  onRetry,
}) {
  return (
    <div className="feedback-error" role="alert" aria-live="assertive">
      <div className="feedback-error-title">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>{title}</span>
      </div>

      {message && <div className="feedback-error-message">{message}</div>}

      {onRetry && (
        <div className="feedback-error-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      )}

      {details && <div className="feedback-error-details">{details}</div>}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Try adjusting filters or adding some records.",
  compact = false,
  actionLabel,
  onAction,
}) {
  return (
    <div className={`feedback-empty ${compact ? "compact" : ""}`.trim()}>
      <Inbox className="feedback-empty-icon" aria-hidden="true" />
      <div className="feedback-empty-title">{title}</div>
      <div className="feedback-empty-description">{description}</div>

      {actionLabel && onAction && (
        <div className="feedback-empty-action">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export function TimestampBadge({ timestamp }) {
  return (
    <span className="feedback-timestamp" aria-label={formatTimestamp(timestamp)}>
      <Clock3 size={12} aria-hidden="true" />
      {formatTimestamp(timestamp)}
    </span>
  );
}
