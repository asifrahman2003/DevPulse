import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Dashboard from './components/Dashboard';
import About from "./components/About";
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--chrono-bg)] text-[var(--chrono-text)]">
      <Navbar />

      <main className="flex-grow w-full flex flex-col items-center px-4 py-8">
        <Dashboard />
        <section id="about" className="section-anchor w-full">
          <About />
        </section>
      </main>
      <Analytics/>
      <Footer />
    </div>
  );
}
