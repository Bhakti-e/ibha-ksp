export default function TestTailwindPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-slate-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          ✅ Tailwind CSS is Working!
        </h1>
        <p className="text-slate-300 text-center mb-8">
          If you can see this styled page with dark background, centered card, and colored text, 
          Tailwind is properly configured.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-600 text-white p-4 rounded-lg">
            <strong>Blue Box:</strong> This should have a blue background with white text
          </div>
          
          <div className="bg-green-600 text-white p-4 rounded-lg">
            <strong>Green Box:</strong> This should have a green background with white text
          </div>
          
          <div className="bg-red-600 text-white p-4 rounded-lg">
            <strong>Red Box:</strong> This should have a red background with white text
          </div>
          
          <div className="bg-yellow-500 text-black p-4 rounded-lg">
            <strong>Yellow Box:</strong> This should have a yellow background with black text
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go to Login Page
          </a>
        </div>

        <div className="mt-8 text-sm text-slate-400 text-center">
          <p>If this page looks like plain HTML with no colors, Tailwind is NOT working.</p>
          <p className="mt-2">Check the browser console (F12) for errors.</p>
        </div>
      </div>
    </div>
  );
}
