import { addDays, todayISO } from '../lib/dates.js'

/*
  Demo board shown on first visit. Due dates are relative to today so the
  demo always has some overdue, some due soon, and some later tasks.
*/
export function createSampleBoard(today = todayISO()) {
  const day = (n) => addDays(today, n)
  const stamp = new Date().toISOString()

  const list = [
    ['todo', 's1', 'Sketch the onboarding flow', 'Three screens: welcome, pick a template, invite teammates.', 'high', day(2), ['design', 'ux']],
    ['todo', 's2', 'Write release notes for v1.4', '', 'medium', day(5), ['docs']],
    ['todo', 's3', 'Audit colour contrast in dark mode', 'Check all text against WCAG AA (4.5:1).', 'medium', null, ['a11y', 'design']],
    ['todo', 's4', 'Research offline sync options', 'Compare IndexedDB wrappers and service-worker caching.', 'low', day(14), ['research']],
    ['doing', 's5', 'Fix login redirect loop', 'Happens when the session cookie expires mid-request.', 'high', day(-2), ['bug', 'auth']],
    ['doing', 's6', 'Build the settings page', 'Profile, notifications and theme sections.', 'medium', day(1), ['frontend']],
    ['doing', 's7', 'Record the Day 4 demo video', '', 'low', day(0), ['content']],
    ['done', 's8', 'Set up CI with preview deploys', 'Every pull request now gets its own Vercel URL.', 'medium', day(-3), ['devops']],
    ['done', 's9', 'Migrate icons to inline SVG', '', 'low', null, ['frontend']],
    ['done', 's10', 'Customer interview notes', 'Five interviews, summary shared in the team doc.', 'high', day(-6), ['research', 'ux']],
  ]

  const tasks = {}
  const columns = {
    'col-todo': { id: 'col-todo', title: 'To do', isDone: false, taskIds: [] },
    'col-doing': { id: 'col-doing', title: 'In progress', isDone: false, taskIds: [] },
    'col-done': { id: 'col-done', title: 'Done', isDone: true, taskIds: [] },
  }

  for (const [col, id, title, description, priority, dueDate, labels] of list) {
    const taskId = `task-${id}`
    tasks[taskId] = { id: taskId, title, description, priority, dueDate, labels, createdAt: stamp }
    columns[`col-${col}`].taskIds.push(taskId)
  }

  return { version: 1, tasks, columns, columnOrder: ['col-todo', 'col-doing', 'col-done'] }
}
