import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400" />
      
      {/* Floating school items - Books */}
      <div className="absolute left-[10%] top-[20%] animate-float-1 opacity-20">
        <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h6v16H4V4zm8 0h8v16h-8V4zm2 2v12h4V6h-4z"/>
        </svg>
      </div>
      <div className="absolute right-[15%] top-[30%] animate-float-2 opacity-15">
        <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h6v16H4V4zm8 0h8v16h-8V4z"/>
        </svg>
      </div>
      
      {/* Pencils */}
      <div className="absolute left-[25%] top-[60%] animate-float-3 opacity-20">
        <svg className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </div>
      <div className="absolute right-[25%] bottom-[20%] animate-float-4 opacity-15">
        <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </div>
      
      {/* Notebooks */}
      <div className="absolute left-[5%] bottom-[30%] animate-float-5 opacity-20">
        <svg className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h9l5 5v15H6V2zm9 1v4h4l-4-4z"/>
        </svg>
      </div>
      <div className="absolute right-[5%] top-[15%] animate-float-6 opacity-15">
        <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h9l5 5v15H6V2zm9 1v4h4l-4-4z"/>
        </svg>
      </div>
      
      {/* Ruler */}
      <div className="absolute left-[40%] top-[10%] animate-float-7 opacity-15 rotate-12">
        <svg className="h-8 w-20 text-white" viewBox="0 0 24 8" fill="currentColor">
          <rect x="2" y="2" width="20" height="4" rx="1"/>
          <line x1="4" y1="2" x2="4" y2="5" stroke="currentColor" strokeWidth="1"/>
          <line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="1"/>
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1"/>
          <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="1"/>
          <line x1="20" y1="2" x2="20" y2="5" stroke="currentColor" strokeWidth="1"/>
        </svg>
      </div>
      
      {/* Backpack */}
      <div className="absolute right-[35%] bottom-[40%] animate-float-8 opacity-15">
        <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h12v4h-3l-1 2H7L6 6V2zm2 4v2h8V6H8zm0 4v6h8v-6H8z"/>
        </svg>
      </div>
      
      {/* Graduation cap */}
      <div className="absolute left-[70%] top-[40%] animate-float-9 opacity-20">
        <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 9l10 6 10-6-10-6zM2 9v6l10 6 10-6V9l-10 6-10-6z"/>
        </svg>
      </div>
      
      {/* Globe/World */}
      <div className="absolute right-[10%] bottom-[35%] animate-float-10 opacity-15">
        <svg className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      {/* Content card */}
      <section className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-slate-900">E-Learning Login</h1>
        <p className="mt-1 text-sm text-slate-600">
          
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
