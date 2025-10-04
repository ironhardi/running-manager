// src/components/layout/Header.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-hairline border-neutral-200">
      <div className="container-frame flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline hover:opacity-95">
          <Image
            src="/logo-hawkiel.svg"   /* du hast das bereits im /public */
            alt="HAW Kiel Laufgruppe"
            width={40}
            height={40}
            priority
          />
          <div className="leading-tight">
            <div className="text-fh-blue font-semibold">Lauf Manager</div>
            <div className="text-[13px] text-neutral-600">Laufgruppe HAW Kiel</div>
          </div>
        </Link>

        <nav className="hidden gap-6 md:flex">
          <Link href="/" className="text-sm text-fh-blue no-underline hover:underline">Start</Link>
          <Link href="/login" className="text-sm text-fh-blue no-underline hover:underline">Anmelden</Link>
        </nav>
      </div>
    </header>
  )
}