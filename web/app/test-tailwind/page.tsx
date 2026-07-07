/**
 * Tailwind smoke-test page.
 * Visit /test-tailwind to confirm Tailwind is working.
 * If this page looks like plain HTML (white bg, unstyled text) — Tailwind is broken.
 * If you see dark bg + coloured boxes + blue button — it's working correctly.
 */
export default function TestTailwindPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          ✅ Tailwind is working
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Dark background · white text · rounded card · coloured boxes below
        </p>

        <div className="space-y-3 mb-8">
          <div className="bg-blue-600   text-white   p-4 rounded-lg font-medium">🔵 Blue — bg-blue-600</div>
          <div className="bg-green-600  text-white   p-4 rounded-lg font-medium">🟢 Green — bg-green-600</div>
          <div className="bg-red-600    text-white   p-4 rounded-lg font-medium">🔴 Red — bg-red-600</div>
          <div className="bg-yellow-400 text-slate-900 p-4 rounded-lg font-medium">🟡 Yellow — bg-yellow-400</div>
        </div>

        <div className="flex gap-3 justify-center">
          <a
            href="/login"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </a>
          <a
            href="/"
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors border border-slate-600"
          >
            Home
          </a>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          /test-tailwind · Ibha KSP · smoke test
        </p>
      </div>
    </div>
  );
}
