/**
 * Renders an inline `<script>` that runs synchronously during HTML parsing on a hard load (direct
 * visit / refresh) — the only reliable way to touch the DOM *before first paint*, e.g. applying a
 * saved theme with no flash.
 *
 * React 19 warns in development whenever rendering produces a `<script>` tag, because a script
 * created by React on the client never executes. The `type` swap below silences that: the server
 * emits a real `text/javascript` script (which the browser runs while parsing), and the client
 * hydration render emits an inert `text/plain` one. `suppressHydrationWarning` absorbs the
 * resulting `type` mismatch. Pattern from Next.js' "Preventing Flash Before Hydration" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
