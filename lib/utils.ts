import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize avatar URL từ backend về dạng proxy path /uploads/... của Next.js.
 *
 * Backend có thể trả về các dạng:
 *   1. Full URL backend:   "http://localhost:8080/uploads/avatars/..."        → /uploads/avatars/...
 *   2. Full URL with bug:  "http://localhost:8080/uploads/uploads/avatars/..."→ /uploads/avatars/...
 *   3. Relative /uploads/: "/uploads/avatars/..."                             → /uploads/avatars/...
 *   4. Relative no slash:  "uploads/avatars/..."                              → /uploads/avatars/...
 *   5. data: URL (preview): "data:image/..."                                  → as-is
 *   6. External CDN:       "https://cdn.cloudinary.com/..."                   → as-is
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  if (!avatarUrl) return undefined;

  // Base64 preview — giữ nguyên
  if (avatarUrl.startsWith('data:')) return avatarUrl;

  // Full URL (http/https)
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    try {
      const url = new URL(avatarUrl);
      // Nếu là backend URL chứa /uploads/ → extract pathname và route qua proxy
      if (url.pathname.includes('/uploads/')) {
        const clean = url.pathname.replace(/^\/*(?:uploads\/)+/, '');
        return `/uploads/${clean}`;
      }
    } catch {
      // URL parse lỗi → fallthrough
    }
    // External CDN (S3, Cloudinary, dicebear...) — giữ nguyên
    return avatarUrl;
  }

  // Relative path: strip leading slashes + repeated "uploads/" prefixes
  const clean = avatarUrl.replace(/^\/*(?:uploads\/)*/, '');
  return `/uploads/${clean}`;
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate' ? (accurateSizes[i] ?? 'Bytest') : (sizes[i] ?? 'Bytes')
  }`;
}
