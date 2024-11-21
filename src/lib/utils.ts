import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Check if it starts with 0 and convert to +61
  let formatted = cleaned;
  if (cleaned.startsWith('0')) {
    formatted = '61' + cleaned.substring(1);
  } else if (cleaned.startsWith('61')) {
    formatted = cleaned;
  }
  
  // Format the number
  if (formatted.length >= 2) {
    formatted = '+' + formatted;
  }
  if (formatted.length >= 5) {
    formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3);
  }
  if (formatted.length >= 9) {
    formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7);
  }
  if (formatted.length >= 13) {
    formatted = formatted.slice(0, 11) + ' ' + formatted.slice(11);
  }
  
  return formatted;
}

export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Australian mobile number
  // Can start with 0, +61, or 61
  // Must be followed by 4 and then 8 more digits
  return /^(?:0|61|(?:\+61)?)4\d{8}$/.test(cleaned);
}