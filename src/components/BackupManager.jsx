import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import BackupService from '../services/BackupService';

const BackupManager = ({ isOpen, onClose, currentUser }) => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadBackups();
    }
  }, [isOpen, user]);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const backupList = await BackupService.listBackups();
      setBackups(backupList);
    } catch (err) {
      setError('Failed to load backups');
      console.error('Error loading backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setIsLoading(true);
      setCurrentOperation('Creating backup...');
      setProgress(0);

      const backup = await BackupService.createBackup({
        onProgress: (progress) => setProgress(progress),
        includeSettings: true,
        includeData: true,
        includeMedia: false
      });

      setBackups(prev => [backup, ...prev]);
      setCurrentOperation('Backup created successfully!');
      setTimeout(() => setCurrentOperation(''), 2000);
    } catch (err) {
      setError('Failed to create backup');
      console.error('Error creating backup:', err);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      setIsLoading(true);
      setCurrentOperation('Restoring backup...');
      setProgress(0);

      await BackupService.restoreFromBackup(backupId, {
        onProgress: (progress) => setProgress(progress)
      });

      setCurrentOperation('Backup restored successfully!');
      setTimeout(() => setCurrentOperation(''), 2000);
    } catch (err) {
      setError('Failed to restore backup');
      console.error('Error restoring backup:', err);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      await BackupService.deleteBackup(backupId);
      setBackups(prev => prev.filter(backup => backup.id !== backupId));
    } catch (err) {
      setError('Failed to delete backup');
      console.error('Error deleting backup:', err);
    }
  };

  const exportBackup = async (backupId) => {
    try {
      const backupData = await BackupService.exportBackup(backupId);
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flagfit-backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export backup');
      console.error('Error exporting backup:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Backup Manager</h2>
          <Button onClick={onClose} variant="outline">✕</Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {currentOperation && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {currentOperation}
            {progress > 0 && (
              <Progress value={progress} className="mt-2" />
            )}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <Button 
            onClick={createBackup}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Creating...' : 'Create New Backup'}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Backups</h3>
          
          {isLoading && backups.length === 0 ? (
            <div className="text-center py-8">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No backups found. Create your first backup to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <Card key={backup.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Backup {backup.id}</h4>
                          <Badge variant={backup.type === 'auto' ? 'secondary' : 'default'}>
                            {backup.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Created: {formatDate(backup.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Size: {formatSize(backup.size)} | Items: {backup.itemCount}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => restoreBackup(backup.id)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Restore
                        </Button>
                        <Button
                          onClick={() => exportBackup(backup.id)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Export
                        </Button>
                        <Button
                          onClick={() => deleteBackup(backup.id)}
                          disabled={isLoading}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupManager; 