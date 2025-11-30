declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
  export function subDays(date: Date | number, amount: number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }, options?: any): Date[];
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function addDays(date: Date | number, amount: number): Date;
  export function startOfWeek(date: Date | number, options?: any): Date;
  export function endOfWeek(date: Date | number, options?: any): Date;
  export function isWithinInterval(date: Date | number, interval: { start: Date | number; end: Date | number }): boolean;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
}

declare module 'date-fns/locale' {
  export const ptBR: any;
}
