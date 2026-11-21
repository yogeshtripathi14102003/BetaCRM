'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useUpdateActivity, useDeleteActivity } from './hooks';

// Backend ka `canEdit` hi decide karta hai ki buttons dikhein ya nahi (role ka if frontend me nahi)
export default function ActivityActions({ activity }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');

  const update = useUpdateActivity();
  const remove = useDeleteActivity();

  // Hooks ke baad hi return (React rules). Na edit na delete allowed ho to kuch nahi dikhega
  if (!activity?.canEdit && !activity?.canDelete) return null;

  const openEdit = () => {
    // Har baar latest values se form bharo
    setTitle(activity.title || '');
    setDescription(activity.description || '');
    setOpen(true);
  };

  const onSave = () =>
    update.mutate(
      { id: activity.id, title: title.trim(), description: description.trim() },
      { onSuccess: () => setOpen(false) },
    );

  const onDelete = () => {
    if (window.confirm('you want to delete this activity?')) remove.mutate(activity.id);
  };

  return (
    <>
      <div className="flex gap-2">
        {activity.canEdit && (
          <Button size="sm" variant="outline" onClick={openEdit}>Edit</Button>
        )}
        {activity.canDelete && (
          <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={onDelete}>Delete</Button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Edit activity</h2>

            <div className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={200} />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={update.isPending || !description.trim()} onClick={onSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}