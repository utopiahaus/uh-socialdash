/**
 * Shared Data Utilities
 *
 * Common formatting and calculation functions used across all dashboard panels.
 */

/**
 * Format number with K/M/B suffixes
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.3K", "1.5M", "2.1B")
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1) + "K"
  if (num < 1000000000) return (num / 1000000).toFixed(1) + "M"
  return (num / 1000000000).toFixed(1) + "B"
}

/**
 * Calculate percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (e.g., 15.5 for 15.5% increase)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Format date for chart display
 * @param dateStr - ISO date string (e.g., "2024-03-16")
 * @returns Formatted short date (e.g., "Mar 16")
 */
export function formatChartDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Calculate engagement rate
 * @param likes - Number of likes
 * @param comments - Number of comments
 * @param shares - Number of shares
 * @param followers - Number of followers
 * @returns Engagement rate percentage
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  followers: number
): number {
  if (followers === 0) return 0
  return ((likes + comments + shares) / followers) * 100
}

/**
 * Format percentage for display
 * @param value - Percentage value (e.g., 15.5)
 * @returns Formatted string (e.g., "+15.5%" or "-2.3%")
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Get date N days ago from today
 * @param days - Number of days to go back
 * @returns Date object
 */
export function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Format timestamp for display
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "Mar 16, 2024 at 2:30 PM")
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Calculate days remaining until token expiry
 * @param expiryDate - Token expiry date
 * @returns Number of days remaining (0 if expired)
 */
export function getDaysRemaining(expiryDate: Date | null): number {
  if (!expiryDate) return 0
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Safe division that returns 0 instead of NaN
 * @param numerator - Numerator
 * @param denominator - Denominator
 * @returns Result or 0 if division fails
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Calculate average of an array of numbers
 * @param values - Array of numbers
 * @returns Average or 0 if empty
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}
