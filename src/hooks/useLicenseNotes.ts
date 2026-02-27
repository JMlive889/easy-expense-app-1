import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export interface LicenseNote {
  id: string;
  license_id: string;
  author_id: string;
  note_content: string;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_email: string;
}

export function useLicenseNotes(licenseId: string | null) {
  const [notes, setNotes] = useState<LicenseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!licenseId) {
      setLoading(false);
      setNotes([]);
      return;
    }

    fetchNotes();

    const channel = supabase
      .channel(`license_notes_${licenseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'license_notes',
          filter: `license_id=eq.${licenseId}`
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [licenseId]);

  async function fetchNotes() {
    if (!licenseId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('license_notes')
        .select(`
          id,
          license_id,
          author_id,
          note_content,
          created_at,
          updated_at,
          author:profiles!license_notes_author_id_fkey(
            full_name,
            email
          )
        `)
        .eq('license_id', licenseId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch notes error:', fetchError);
        throw new Error(`Failed to fetch notes: ${fetchError.message}`);
      }

      const formattedNotes: LicenseNote[] = (data || []).map((note: any) => ({
        id: note.id,
        license_id: note.license_id,
        author_id: note.author_id,
        note_content: note.note_content,
        created_at: note.created_at,
        updated_at: note.updated_at,
        author_name: note.author?.full_name || null,
        author_email: note.author?.email || 'Unknown'
      }));

      setNotes(formattedNotes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notes';
      console.error('Fetch notes error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function addNote(content: string): Promise<boolean> {
    if (!licenseId) {
      showToast('No license selected', 'error');
      return false;
    }

    if (!content.trim()) {
      showToast('Note content cannot be empty', 'error');
      return false;
    }

    if (content.length > 250) {
      showToast('Note must be 250 characters or less', 'error');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast('You must be logged in to add notes', 'error');
        return false;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();

      const optimisticNote: LicenseNote = {
        id: tempId,
        license_id: licenseId,
        author_id: user.id,
        note_content: content.trim(),
        created_at: now,
        updated_at: now,
        author_name: profileData?.full_name || null,
        author_email: profileData?.email || user.email || 'Unknown'
      };

      setNotes(prevNotes => [optimisticNote, ...prevNotes]);

      const { error: insertError } = await supabase
        .from('license_notes')
        .insert({
          license_id: licenseId,
          author_id: user.id,
          note_content: content.trim()
        });

      if (insertError) {
        console.error('Add note error:', insertError);
        setNotes(prevNotes => prevNotes.filter(note => note.id !== tempId));
        throw new Error(`Failed to add note: ${insertError.message}`);
      }

      showToast('Note added successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add note';
      console.error('Add note error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  async function updateNote(noteId: string, content: string): Promise<boolean> {
    if (!content.trim()) {
      showToast('Note content cannot be empty', 'error');
      return false;
    }

    if (content.length > 250) {
      showToast('Note must be 250 characters or less', 'error');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('license_notes')
        .update({ note_content: content.trim() })
        .eq('id', noteId);

      if (updateError) {
        console.error('Update note error:', updateError);
        throw new Error(`Failed to update note: ${updateError.message}`);
      }

      showToast('Note updated successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      console.error('Update note error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  async function deleteNote(noteId: string): Promise<boolean> {
    const noteToDelete = notes.find(note => note.id === noteId);

    if (!noteToDelete) {
      showToast('Note not found', 'error');
      return false;
    }

    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

    try {
      const { error: deleteError } = await supabase
        .from('license_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) {
        console.error('Delete note error:', deleteError);
        setNotes(prevNotes => [noteToDelete, ...prevNotes].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        throw new Error(`Failed to delete note: ${deleteError.message}`);
      }

      showToast('Note deleted successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      console.error('Delete note error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes
  };
}
