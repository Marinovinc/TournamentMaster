import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Hide default locale from URL
});

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
