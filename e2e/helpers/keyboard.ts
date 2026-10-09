export function tabKey(browserName: string, reverse = false) {
  return `${browserName === 'webkit' ? 'Alt+' : ''}${reverse ? 'Shift+' : ''}Tab`
}
