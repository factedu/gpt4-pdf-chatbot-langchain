interface LayoutProps {
  children?: React.ReactNode;
}
import Image from 'next/image';
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto flex flex-col space-y-4">
      <header className="w-full bg-black lg:bg-opacity-50">
        <div className="h-16 mx-auto py-4">
          <nav className="ml-4 pl-6">
            <a href="#" className="cursor-pointer text-red-400 text-xl font-bold hover:text-red-50 transition-all duration-700">
              FactBot
            </a>
          </nav>
        </div>
      </header>
      <div className="mx-auto">
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
