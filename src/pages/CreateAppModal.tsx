import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { TargetPlatform } from '../types';
import { createApp } from '../services/appsService';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Smartphone, Check, AlertCircle } from 'lucide-react';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface EnvRow {
  name: string;
  suffix: string;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [basePackageName, setBasePackageName] = useState('com.example.app');
  const [platforms, setPlatforms] = useState<TargetPlatform[]>(['android', 'ios']);
  const [environments, setEnvironments] = useState<EnvRow[]>([
    { name: 'Development', suffix: '.development' },
    { name: 'Staging', suffix: '.staging' },
    { name: 'Production', suffix: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (p: TargetPlatform) => {
    if (p === 'universal') {
      setPlatforms(['universal']);
      return;
    }
    const withoutUniversal = platforms.filter(x => x !== 'universal');
    if (withoutUniversal.includes(p)) {
      if (withoutUniversal.length > 1) {
        setPlatforms(withoutUniversal.filter(x => x !== p));
      }
    } else {
      setPlatforms([...withoutUniversal, p]);
    }
  };

  const updateEnv = (index: number, field: keyof EnvRow, value: string) => {
    const updated = [...environments];
    const cleanValue = field === 'suffix' ? value.toLowerCase() : value;
    updated[index] = { ...updated[index], [field]: cleanValue };
    setEnvironments(updated);
  };

  const addEnvRow = () => {
    setEnvironments([...environments, { name: 'Internal', suffix: '.internal' }]);
  };

  const removeEnvRow = (index: number) => {
    if (environments.length <= 1) return;
    setEnvironments(environments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !basePackageName.trim()) {
      setError('App Name and Base Package Name are required');
      return;
    }

    if (!user) {
      setError('You must be signed in to create an application.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const cleanBase = basePackageName.trim().toLowerCase();
      await createApp(
        {
          name: name.trim(),
          basePackageName: cleanBase,
          platforms,
          environments: environments.map(e => ({
            name: e.name.trim(),
            suffix: (e.suffix || '').trim().toLowerCase(),
          })),
        },
        user.uid
      );
      setName('');
      setBasePackageName('com.example.app');
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create app');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Application"
      description="Register a new React Native application with multi-environment isolation."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              App Name <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. ShopSphere Driver"
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Base Package Name / Bundle ID <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              required
              value={basePackageName}
              onChange={e => setBasePackageName(e.target.value.toLowerCase())}
              placeholder="e.g. com.example.app"
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono lowercase text-emerald-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Update Targets (Platforms) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Update Targets (Target Platforms)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'android' as TargetPlatform, label: 'Android' },
              { id: 'ios' as TargetPlatform, label: 'iOS' },
              { id: 'universal' as TargetPlatform, label: 'Universal' },
            ].map(target => {
              const selected = platforms.includes(target.id);
              return (
                <button
                  type="button"
                  key={target.id}
                  onClick={() => togglePlatform(target.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    selected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{target.label}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Environments & Respective Package Suffixes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Environments & Package Name Suffixes
              </label>
              <p className="text-[11px] text-slate-500">
                Each environment receives an isolated deployment key and computed package name.
              </p>
            </div>
            <button
              type="button"
              onClick={addEnvRow}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Environment
            </button>
          </div>

          <div className="space-y-2.5">
            {environments.map((env, index) => {
              const cleanBase = (basePackageName || 'com.example.app').trim().toLowerCase();
              const cleanSuffix = (env.suffix || '').trim().toLowerCase();
              const computedName = `${cleanBase}${cleanSuffix}`.toLowerCase();
              return (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1/2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                        Env Name
                      </span>
                      <input
                        type="text"
                        value={env.name}
                        onChange={e => updateEnv(index, 'name', e.target.value)}
                        placeholder="e.g. Staging"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="w-1/2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                        Package Suffix
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={env.suffix}
                          onChange={e => updateEnv(index, 'suffix', e.target.value.toLowerCase())}
                          placeholder="e.g. .staging or empty"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono lowercase font-semibold text-emerald-800 focus:outline-none focus:border-emerald-500"
                        />
                        {environments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEnvRow(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                            title="Remove Environment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Computed Package Name Preview */}
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono lowercase text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs">
                    <span className="text-slate-400 font-sans text-[10px]">Computed Package:</span>
                    <span className="text-emerald-700 font-semibold lowercase">{computedName.toLowerCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {submitting ? 'Registering App...' : 'Create Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
