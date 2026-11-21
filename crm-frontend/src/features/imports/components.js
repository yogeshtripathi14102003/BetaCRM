'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { useUploadImport } from './hooks';

const MAX_MB = 10;

export function ImportUploader() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const upload = useUploadImport();

  const pick = (e) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) return setFile(null);
    if (!/\.(csv|xlsx)$/i.test(f.name)) return setError('Sirf .csv ya .xlsx file chalegi');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File ${MAX_MB}MB below only allowed`);
    return setFile(f);
  };

  const submit = () =>
    upload.mutate(file, {
      onSuccess: () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      },
    });

  return (
    <Card title="please import Leads " description="CSV or  Excel (max 10MB). Columns: name, phone, email, source, course.">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={pick}
          aria-label="Import file"
          className="file:bg-brand-soft file:text-brand block text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:opacity-80"
        />
        <Button onClick={submit} loading={upload.isPending} disabled={!file}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>
      <Alert type="error" className="mt-3">
        {error}
      </Alert>
    </Card>
  );
}
