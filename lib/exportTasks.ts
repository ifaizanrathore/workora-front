import { Task } from '@/types';

/**
 * Export tasks to CSV format and download
 */
export function exportTasksToCSV(tasks: Task[], filename?: string) {
  const headers = [
    'Name',
    'Status',
    'Priority',
    'Assignees',
    'Due Date',
    'Tags',
    'Date Created',
    'Date Updated',
    'List',
    'Time Estimate (hrs)',
    'Time Spent (hrs)',
    'Description',
  ];

  const rows = tasks.map((task) => {
    const dueDate = task.due_date
      ? new Date(Number(task.due_date)).toLocaleDateString()
      : '';
    const dateCreated = task.date_created
      ? new Date(Number(task.date_created)).toLocaleDateString()
      : '';
    const dateUpdated = task.date_updated
      ? new Date(Number(task.date_updated)).toLocaleDateString()
      : '';
    const assignees = task.assignees
      ?.map((a) => a.username || a.email || '')
      .filter(Boolean)
      .join('; ') || '';
    const tags = task.tags
      ?.map((t) => t.name)
      .filter(Boolean)
      .join('; ') || '';
    const priority = task.priority?.priority || 'none';
    const timeEstimate = task.time_estimate
      ? (task.time_estimate / 3600000).toFixed(1)
      : '';
    const timeSpent = task.time_spent
      ? (task.time_spent / 3600000).toFixed(1)
      : '';
    const description = (task.text_content || task.description || '')
      .replace(/[\n\r]+/g, ' ')
      .slice(0, 200);

    return [
      task.name,
      task.status?.status || '',
      priority,
      assignees,
      dueDate,
      tags,
      dateCreated,
      dateUpdated,
      task.list?.name || '',
      timeEstimate,
      timeSpent,
      description,
    ];
  });

  // Build CSV content
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n');

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `workora-tasks-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
