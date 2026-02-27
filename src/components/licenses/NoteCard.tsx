import { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { LicenseNote } from '../../hooks/useLicenseNotes';
import { Button } from '../ui/Button';
import ConfirmModal from '../ui/ConfirmModal';

interface NoteCardProps {
  note: LicenseNote;
  currentUserId: string;
  onUpdate: (noteId: string, content: string) => Promise<boolean>;
  onDelete: (noteId: string) => Promise<boolean>;
}

export function NoteCard({ note, currentUserId, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.note_content);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = note.author_id === currentUserId;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSave = async () => {
    if (!editContent.trim() || editContent.length > 250) return;

    setIsSaving(true);
    const success = await onUpdate(note.id, editContent);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.note_content);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(note.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const isEdited = note.created_at !== note.updated_at;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-white">
              {note.author_name || note.author_email}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDateTime(note.created_at)}
              {isEdited && ' (edited)'}
            </span>
          </div>
          {note.author_name && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {note.author_email}
            </span>
          )}
        </div>

        {isAuthor && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit note"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              rows={3}
              maxLength={250}
              placeholder="Edit your note..."
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${
                editContent.length > 250
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : editContent.length > 225
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {editContent.length}/250 characters
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={!editContent.trim() || editContent.length > 250 || isSaving}
              className="flex items-center gap-2 text-sm px-3 py-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="secondary"
              className="flex items-center gap-2 text-sm px-3 py-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {note.note_content}
        </p>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
