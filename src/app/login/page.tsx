import { redirect } from 'next/navigation';

export default function LoginRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value) && value.length > 0) {
        params.set(key, value[0]);
      }
    });
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : '/');
}
