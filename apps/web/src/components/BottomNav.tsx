'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const navItems = [
  { name: 'Despensas', href: '/despensas', icon: '/icons/despensa.svg', iconActive: '/icons/despensa-active.svg' },
  { name: 'Avisos', href: '/avisos', icon: '/icons/avisos.svg', iconActive: '/icons/avisos-active.svg' },
  { name: 'Listas', href: '/listas', icon: '/icons/listas.svg', iconActive: '/icons/listas-active.svg' },
  { name: 'Gastos', href: '/gastos', icon: '/icons/gastos.svg', iconActive: '/icons/gastos-active.svg' }
]

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-6">
      <div className="
        w-full max-w-md
        flex items-center justify-around
        px-2 py-3
        /* EFEITO CRISTAL: Transparência altíssima */
        bg-white/8 
        backdrop-blur-[25px] 
        -webkit-backdrop-blur-[25px]
        backdrop-saturate-200
        
        /* Borda 'fio de cabelo' para brilho lateral */
        border border-white/40
        rounded-4xl
        
        /* Sombra profunda para destacar o vidro do fundo */
        shadow-[0_12px_40px_rgba(0,0,0,0.12)]
      ">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center flex-1 py-1 active:scale-90 transition-all duration-200"
            >
              <div className="relative w-6 h-6 mb-1">
                <Image
                  src={active ? item.iconActive : item.icon}
                  alt={item.name}
                  fill
                  style={{ filter: active ? 'none' : 'brightness(0)' }}
                  className={`object-contain transition-all duration-300 ${
                    active ? 'opacity-100 scale-110' : 'opacity-80'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${
                active ? 'text-blue-600' : 'text-black'
              }`}>
                {item.name}
              </span>
              
              {active && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}