export const site = {
  name: 'Chris Cameron-Hann',
  url: 'https://cameronhann.com',
  description:
    'CTO at Aegaea and 7Analytics. I build models, I build software, I build teams.',
  handle: '@cameronhann',
  x: 'https://x.com/cameronhann',
  linkedin: 'https://www.linkedin.com/in/chris-cameron-hann/',
  github: 'https://github.com/camerhann',
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
