import { useEffect, useRef, useState } from "react";

interface EditableTitleProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  placeholder?: string;
}

export function EditableTitle({
  value,
  onCommit,
  className = "",
  inputClassName = "",
  ariaLabel,
  placeholder,
}: EditableTitleProps) {
  const [editing, setEditing] = useState<{ draft: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing({ draft: value })}
        aria-label={ariaLabel}
        className={`text-left ${className}`}
      >
        {value || <span className="text-gray-400">{placeholder ?? "Untitled"}</span>}
      </button>
    );
  }

  function commit(draft: string) {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    setEditing(null);
  }

  return (
    <input
      ref={inputRef}
      value={editing.draft}
      placeholder={placeholder}
      onChange={(e) => setEditing({ draft: e.target.value })}
      onBlur={() => commit(editing.draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(editing.draft);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setEditing(null);
        }
      }}
      className={inputClassName}
    />
  );
}
