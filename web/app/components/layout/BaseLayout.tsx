import Navbar from './Navbar';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'hsl(220 30% 8%)' }}>
      <Navbar />
      <main style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
