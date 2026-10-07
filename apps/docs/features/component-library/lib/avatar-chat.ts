import type { Props } from './config'
import { avatarColors } from './content'

export const avatarOutfits = [
  { name: 'Resting', hat: 'none', glasses: 'none', headphones: false, bowTie: false },
  { name: 'Chef', hat: 'beret', glasses: 'none', headphones: false, bowTie: true },
  { name: 'Detective', hat: 'beret', glasses: 'square', headphones: false, bowTie: false },
  { name: 'Writer', hat: 'beret', glasses: 'round', headphones: false, bowTie: false },
  { name: 'Builder', hat: 'beanie', glasses: 'square', headphones: false, bowTie: false },
  { name: 'Music', hat: 'none', glasses: 'none', headphones: true, bowTie: false },
  { name: 'Tutor', hat: 'none', glasses: 'round', headphones: false, bowTie: true },
  { name: 'Gardener', hat: 'beanie', glasses: 'none', headphones: false, bowTie: false },
  { name: 'Designer', hat: 'beret', glasses: 'none', headphones: false, bowTie: false },
  { name: 'Director', hat: 'beret', glasses: 'shades', headphones: false, bowTie: false },
  { name: 'Coach', hat: 'none', glasses: 'shades', headphones: true, bowTie: false },
  { name: 'Traveller', hat: 'beanie', glasses: 'shades', headphones: false, bowTie: false },
  { name: 'Money', hat: 'none', glasses: 'square', headphones: false, bowTie: true },
  { name: 'Planner', hat: 'beanie', glasses: 'round', headphones: false, bowTie: false },
  { name: 'Captain', hat: 'crown', glasses: 'none', headphones: false, bowTie: true },
  { name: 'Tester', hat: 'none', glasses: 'square', headphones: false, bowTie: false },
  { name: 'Bug finder', hat: 'beanie', glasses: 'square', headphones: true, bowTie: false },
  { name: 'Guard', hat: 'crown', glasses: 'shades', headphones: false, bowTie: false },
]

export function selectedOutfit(props: Props) {
  return avatarOutfits.find((outfit) =>
    ['hat', 'glasses', 'headphones', 'bowTie'].every(
      (key) =>
        (props[key] ?? (key === 'hat' || key === 'glasses' ? 'none' : false)) ===
        outfit[key as keyof typeof outfit]
    )
  )?.name
}

export const avatarHelpers = [
  { outfit: 'Resting', group: 'General', description: 'Ready for your next task' },
  { outfit: 'Builder', group: 'Development', description: 'Interfaces and components' },
  { outfit: 'Captain', group: 'Development', description: 'Releases and checklists' },
  { outfit: 'Tester', group: 'Development', description: 'Behavior and test cases' },
  { outfit: 'Bug finder', group: 'Development', description: 'UI faults and edge cases' },
  { outfit: 'Guard', group: 'Development', description: 'Errors and recovery' },
  { outfit: 'Detective', group: 'Development', description: 'Questions and experiments' },
  { outfit: 'Designer', group: 'Development', description: 'Layout and typography' },
  { outfit: 'Chef', group: 'Everyday', description: 'Recipes and meal ideas' },
  { outfit: 'Writer', group: 'Everyday', description: 'Words and notes' },
  { outfit: 'Tutor', group: 'Everyday', description: 'Clear explanations' },
  { outfit: 'Music', group: 'Everyday', description: 'Creative routines' },
  { outfit: 'Coach', group: 'Everyday', description: 'Focus and habits' },
  { outfit: 'Planner', group: 'Everyday', description: 'Tasks and priorities' },
  { outfit: 'Traveller', group: 'Everyday', description: 'Trips and packing' },
  { outfit: 'Money', group: 'Everyday', description: 'Numbers and totals' },
  { outfit: 'Gardener', group: 'Everyday', description: 'Steady progress' },
  { outfit: 'Director', group: 'Everyday', description: 'Scenes and stories' },
]

export function avatarHelperProps(outfit: string): Props {
  const index = avatarOutfits.findIndex((item) => item.name === outfit)
  if (index < 0) return {}
  const { name: _, ...props } = avatarOutfits[index]
  return { ...props, color: avatarColors[index % avatarColors.length].value }
}

export const avatarChatExamples = [
  {
    title: 'Plan a feature',
    prompt: 'Help me plan a new feature',
    outfit: 'Planner',
    reply:
      'Start with one clear outcome.\n\n1. Describe who needs it and what they want to finish.\n2. Sketch the smallest useful interaction.\n3. Check the empty, loading and error states.\n4. Build one complete path and try it with real content.',
  },
  {
    title: 'Explain a concept',
    prompt: 'Explain component state simply',
    outfit: 'Tutor',
    reply:
      'State is the information a component remembers between renders.\n\nA toggle remembers whether it is on. A chat remembers its messages. When state changes, the interface shows the new value. Keep one owner for values that several controls share.',
  },
  {
    title: 'Review an interface',
    prompt: 'How should I review this interface?',
    outfit: 'Designer',
    reply:
      'Follow the task from beginning to end.\n\nCan someone find the next action, understand the current state and recover from a mistake? Try long labels, keyboard navigation and a narrow screen. Fix the first confusing step before adding decoration.',
  },
  {
    title: 'Find a button bug',
    prompt: 'My button does not respond',
    outfit: 'Bug finder',
    reply:
      'Let’s narrow it down.\n\nCheck whether the button is disabled, covered by another element or missing its handler. Try it with the keyboard as well as the pointer. Then inspect the console and reproduce the smallest failing case.',
  },
  {
    title: 'Draft a welcome',
    prompt: 'Draft a short welcome message',
    outfit: 'Writer',
    reply:
      'Welcome! Make yourself at home.\n\nChoose what you would like to try, adjust a few settings and explore at your own pace. Your next step is always one click away.',
  },
  {
    title: 'Build a checklist',
    prompt: 'Make a release checklist',
    outfit: 'Captain',
    reply:
      'A small release checklist:\n\n• Verify the main user journey.\n• Check loading, empty and failure states.\n• Run the required build and tests.\n• Review the final changes and release notes.\n• Publish only after approval.',
  },
  {
    title: 'Make a loading state',
    prompt: 'Design a useful loading state',
    outfit: 'Builder',
    reply:
      'Keep the layout stable while work is in progress. Show what is happening near the action, preserve the user’s input and provide a way to stop a long operation. Replace the loading state with a clear result or a useful recovery action.',
  },
  {
    title: 'Name a project',
    prompt: 'Suggest a name for a tiny planning app',
    outfit: 'Designer',
    reply:
      'Three starting points:\n\n• Small Steps — a calm place for the next action.\n• Daynote — plans and notes together.\n• Clear Path — a simple view of what comes next.\n\nPick a direction, then check availability before adopting a name.',
  },
  {
    title: 'Organize a day',
    prompt: 'Help me organize a busy day',
    outfit: 'Planner',
    reply:
      'Choose one essential outcome and two smaller tasks. Reserve a focused block for the essential work, group short chores together and leave room for interruptions. Finish by noting the next step for tomorrow.',
  },
  {
    title: 'Create a focus routine',
    prompt: 'Make a short focus routine',
    outfit: 'Coach',
    reply:
      'Try one manageable session.\n\nChoose a task, close distractions and work for a short block that suits you. Take a break, then decide whether to continue. A clear stopping point is part of the routine.',
  },
  {
    title: 'Sketch a landing hero',
    prompt: 'Sketch a landing page hero',
    outfit: 'Builder',
    reply:
      'Give the hero one job: help a visitor understand the product and take the next step.\n\nUse a specific headline, one sentence of supporting copy, one primary action and a preview that shows the product doing useful work.',
  },
  {
    title: 'Prepare a trip list',
    prompt: 'Make a simple trip packing list',
    outfit: 'Traveller',
    reply:
      'Start with documents, payment, essentials and clothing suited to the trip. Add a charger, any items you personally need and room for the return journey. Check the weather and transport restrictions before finalizing the list.',
  },
  {
    title: 'Shape a notes app',
    prompt: 'What belongs in a small notes app?',
    outfit: 'Writer',
    reply:
      'Begin with fast capture, readable notes and reliable search. Add a clear saved state and an easy recovery path. Try those basics with a week of real notes before adding more ways to organize them.',
  },
  {
    title: 'Plan an experiment',
    prompt: 'Help me plan a small experiment',
    outfit: 'Detective',
    reply:
      'Write down the question, the change you want to try and the observation that would help you decide. Change one important variable, record what happens and compare it with the starting point.',
  },
  {
    title: 'Write test scenarios',
    prompt: 'List scenarios for a sign-up form',
    outfit: 'Tester',
    reply:
      'Check a valid submission, missing required fields, invalid input, a duplicate account and a failed request. Also try keyboard navigation, slow responses and repeated clicks. The form should preserve useful input when recovery is possible.',
  },
  {
    title: 'Stop a long reply',
    prompt: 'Show me a longer reply I can stop',
    outfit: 'Guard',
    reply:
      'A long operation should always offer a clear way to stop.\n\nKeep progress near the action that started it. Preserve any useful result already produced. When the user stops, acknowledge that choice and release the work immediately.\n\nTry the Stop button below while this reply appears. You can start a new chat or choose another example afterward. Each conversation remains available in this playground until you leave it.',
  },
  {
    title: 'Choose a component',
    prompt: 'How do I choose a UI component?',
    outfit: 'Designer',
    reply:
      'Start with the task the component supports. Interact with an example, configure it for your context and copy the integration code. Check the resulting behavior with your own content rather than judging only the initial preview.',
  },
  {
    title: 'Use an expressive bot',
    prompt: 'Where does an expressive bot help?',
    outfit: 'Music',
    reply:
      'A bot can make a waiting, working or resting state easier to read. Keep the expression tied to a meaningful event, and give people a text label as well. Try the activity, outfit and color controls here to compare those states.',
  },
  {
    title: 'Recover from an error',
    prompt: 'Write a helpful error message',
    outfit: 'Guard',
    reply:
      'We could not finish that action. Your input is still here.\n\nTry again, or change the highlighted value and continue. A useful message names the problem, preserves the work and gives a practical next step.',
  },
  { title: 'A one-word reply', prompt: 'Reply with one word', outfit: 'Resting', reply: 'Hello.' },
]

export function avatarDemoReply(message: string, name: string) {
  const example = avatarChatExamples.find(
    (item) => item.prompt.toLowerCase() === message.trim().toLowerCase()
  )
  return (
    example?.reply ??
    `Hello, I’m ${name}. Let’s turn that into a clear next step.\n\nChoose the outcome, try one small version and check what happens. You can also choose an example on the left to explore a different conversation.`
  )
}
