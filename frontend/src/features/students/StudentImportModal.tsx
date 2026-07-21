import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';

interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; name?: string; reason: string }[];
}

interface StudentImportModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentImportModal({ onSuccess, onCancel }: StudentImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFile(selected);
        setResult(null);
      } else {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/students/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const importRes: ImportResult = data.data;
      setResult(importRes);

      if (importRes.created > 0) {
        toast.success(`Successfully imported ${importRes.created} student(s)!`);
        onSuccess();
      } else {
        toast.error('No students were created. Please check the errors below.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to process import file';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Description & Template Download */}
      <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500 shrink-0 mt-0.5 sm:mt-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Bulk Student Import via Excel / CSV</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload an Excel (.xlsx, .xls) or CSV file with student records to register them in bulk.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleDownloadTemplate}
          className="shrink-0 text-xs"
        >
          Download Template
        </Button>
      </div>

      {/* File Upload Dropzone */}
      {!result && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-brand-500 hover:bg-brand-500/5 transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <div className="p-3 rounded-full bg-muted text-muted-foreground">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                {file ? file.name : 'Click to select or drop your Excel / CSV file'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB — Ready to import`
                  : 'Supported formats: .xlsx, .xls, .csv (Max 10 MB)'}
              </p>
            </div>

            {file && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-500">
                <FileText className="w-3.5 h-3.5" />
                {file.name}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<Upload className="w-4 h-4" />}
              loading={loading}
              disabled={!file || loading}
              onClick={handleUpload}
            >
              Start Import
            </Button>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-2xs font-bold text-muted-foreground uppercase">Total Rows</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{result.totalRows}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Imported</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {result.created}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase font-bold">Skipped / Errors</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {result.skipped}
              </p>
            </div>
          </div>

          {/* Error List */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Skipped Rows Details ({result.errors.length})
              </h5>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Row {err.row}</span>
                      {err.name && <span className="text-muted-foreground"> ({err.name})</span>}:{' '}
                      <span className="text-red-500 font-medium">{err.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom actions after import */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Upload Another File
            </Button>

            <Button type="button" variant="primary" size="sm" onClick={onCancel}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
