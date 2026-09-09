import { ReactNode } from 'react'

interface PageLayoutProps{
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children }: PageLayoutProps){
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center px-6 py-4">
          <h1 className="m-0 text-lg font-semibold text-slate-800">{title}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
