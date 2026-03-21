export interface CalendarEvent {
  title: string;
  description: string;
  date: string;
  ticker: string;
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  // Format dates for Google Calendar (YYYYMMDDTHHmmss)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.ticker}: ${event.title}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description,
    tresc: event.description,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function addToGoogleCalendar(event: CalendarEvent): void {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
}
