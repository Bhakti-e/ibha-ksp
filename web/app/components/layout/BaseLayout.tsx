import Navbar from './Navbar';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-6 py-7">
        {children}
      </main>
    </div>
  );
}
