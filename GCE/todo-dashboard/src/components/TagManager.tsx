import React, { useState } from "react";
import type { Tag } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Plus, X, Edit2, Check, Palette } from "lucide-react";
import "../styles/TagManager.css";

interface TagManagerProps {
  tags: Tag[];
  onUpdateTags: (tags: Tag[]) => void;
  onClose: () => void;
}

const DEFAULT_COLOR = "#4285F4";

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onUpdateTags,
  onClose,
}) => {
  const [localTags, setLocalTags] = useState<Tag[]>(tags);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const addTag = () => {
    if (!newTagName.trim()) return;
    setLocalTags([
      ...localTags,
      { id: uuidv4(), name: newTagName.trim(), color: newTagColor },
    ]);
    setNewTagName("");
  };

  const deleteTag = (id: string) => {
    setLocalTags(localTags.filter((t) => t.id !== id));
  };

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const saveEditing = () => {
    if (!editingId || !editingName.trim()) return;
    setLocalTags(
      localTags.map((t) =>
        t.id === editingId ? { ...t, name: editingName.trim() } : t,
      ),
    );
    setEditingId(null);
  };

  const updateTagColor = (id: string, color: string) => {
    setLocalTags(localTags.map((t) => (t.id === id ? { ...t, color } : t)));
  };

  const handleSave = () => {
    onUpdateTags(localTags);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="tag-manager">
        <div className="form-header">
          <h2>Manage Tags</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="new-tag-form">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name..."
            onKeyDown={(e) => e.key === "Enter" && addTag()}
          />
          <div className="color-picker-wrapper">
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="color-input"
            />
            <Palette size={16} className="color-icon" />
          </div>
          <button className="add-tag-btn" onClick={addTag}>
            <Plus size={18} />
          </button>
        </div>

        <ul className="tag-list">
          {localTags.map((tag) => (
            <li key={tag.id}>
              {editingId === tag.id ? (
                <div className="tag-edit-row">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                    autoFocus
                  />
                  <button className="save-edit-btn" onClick={saveEditing}>
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="tag-preview"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <div className="tag-actions">
                    <div className="color-picker-wrapper small">
                      <input
                        type="color"
                        value={tag.color}
                        onChange={(e) => updateTagColor(tag.id, e.target.value)}
                        className="color-input"
                      />
                    </div>
                    <button onClick={() => startEditing(tag)}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteTag(tag.id)}>
                      <X size={14} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <button className="submit-btn" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};
