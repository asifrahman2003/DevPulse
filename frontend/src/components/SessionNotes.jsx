// components/SessionNotes.jsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Trash2,
  StickyNote,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
} from "lucide-react";
import { getNoteForToday, saveNoteForToday, clearNoteForToday } from "../utils/storage";

const FONT_OPTIONS = [
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "Menlo",
  "Consolas",
  "Courier New",
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "4" },
  { label: "XL", value: "5" },
];

function hasMeaningfulContent(html = "") {
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length > 0;
}

export default function SessionNotes() {
  const editorRef = useRef(null);
  const [note, setNote] = useState("");
  const [fontColor, setFontColor] = useState("#3b2f26");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existingNote = getNoteForToday();
    setNote(existingNote);
    if (editorRef.current) {
      editorRef.current.innerHTML = existingNote || "";
    }
  }, []);

  const syncEditorState = () => {
    if (!editorRef.current) return;
    setNote(editorRef.current.innerHTML);
  };

  const runEditorCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    syncEditorState();
  };

  const handleSave = () => {
    const nextValue = hasMeaningfulContent(note) ? note : "";
    saveNoteForToday(nextValue);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    clearNoteForToday();
    setNote("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const glow = "hover:shadow-[0_0_0_2px_var(--chrono-primary)] hover:shadow-[0_0_12px_2px_var(--chrono-primary)] transition duration-300";

  return (
    <motion.div
      className={`bg-[var(--chrono-notes-bg,#fff6e6)] border border-[var(--chrono-primary)] rounded-xl shadow-md p-5 mt-6 mb-6 w-full max-w-5xl mx-auto ${glow}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3 text-[var(--chrono-secondary)]">
        <StickyNote size={18} />
        <h3 className="section-title">Session Notes</h3>
      </div>

      <div className="panel-soft rounded-xl p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            onChange={(event) => runEditorCommand("fontName", event.target.value)}
            defaultValue="JetBrains Mono"
            className="field-input max-w-40"
            aria-label="Font Family"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          <select
            onChange={(event) => runEditorCommand("fontSize", event.target.value)}
            defaultValue="3"
            className="field-input max-w-32"
            aria-label="Font Size"
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1 text-xs text-gray-600 px-2">
            Color
            <input
              type="color"
              value={fontColor}
              onChange={(event) => {
                setFontColor(event.target.value);
                runEditorCommand("foreColor", event.target.value);
              }}
              className="w-7 h-7 border border-neutral-300 rounded cursor-pointer bg-transparent"
              aria-label="Font Color"
            />
          </label>

          <button
            type="button"
            onClick={() => runEditorCommand("bold")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Bold"
          >
            <Bold size={14} />
          </button>

          <button
            type="button"
            onClick={() => runEditorCommand("italic")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Italic"
          >
            <Italic size={14} />
          </button>

          <button
            type="button"
            onClick={() => runEditorCommand("underline")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Underline"
          >
            <Underline size={14} />
          </button>

          <button
            type="button"
            onClick={() => runEditorCommand("insertUnorderedList")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Bulleted List"
          >
            <List size={14} />
          </button>

          <button
            type="button"
            onClick={() => runEditorCommand("insertOrderedList")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Numbered List"
          >
            <ListOrdered size={14} />
          </button>

          <button
            type="button"
            onClick={() => runEditorCommand("removeFormat")}
            className="action-btn-secondary text-xs !px-2 !py-1.5"
            aria-label="Clear Formatting"
          >
            <Eraser size={14} />
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncEditorState}
          data-placeholder="Jot down what you're focused on today, what worked, and what you'll do next..."
          className="rich-editor w-full min-h-[180px] p-3 rounded border border-neutral-300 text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[var(--chrono-primary)]"
          aria-label="Session Notes Rich Text Editor"
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <motion.button
          type="button"
          onClick={handleClear}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-btn-danger text-sm"
        >
          <Trash2 size={16} />
          Clear
        </motion.button>

        <motion.button
          type="button"
          onClick={handleSave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-btn text-sm"
        >
          <Save size={16} />
          Save
        </motion.button>

        {saved && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-green-600 text-sm ml-2"
          >
            Saved!
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
