import { useState } from 'react'
import { SidebarLayout } from '../components/catalyst/sidebar-layout'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '../components/catalyst/sidebar'
import { Navbar, NavbarSection, NavbarSpacer } from '../components/catalyst/navbar'
import { CampaignBuilder } from './Campaign/CampaignBuilder'
import { PersonasView } from './PersonasView'
import { BrandKits } from './BrandKits'

type View = 'campaign' | 'personas' | 'brandkits'

export function Dashboard() {
  const [view, setView] = useState<View>('campaign')

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Wordmark />
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Wordmark />
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem current={view === 'campaign'} onClick={() => setView('campaign')}>
                <CampaignIcon />
                <SidebarLabel>Campaign</SidebarLabel>
              </SidebarItem>
              <SidebarItem current={view === 'personas'} onClick={() => setView('personas')}>
                <PersonasIcon />
                <SidebarLabel>Personas</SidebarLabel>
              </SidebarItem>
              <SidebarItem current={view === 'brandkits'} onClick={() => setView('brandkits')}>
                <PaletteIcon />
                <SidebarLabel>Brand kits</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <span className="text-xs/5 text-zinc-500">Internal ad generator</span>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {view === 'campaign' && <CampaignBuilder />}
      {view === 'personas' && <PersonasView />}
      {view === 'brandkits' && <BrandKits />}
    </SidebarLayout>
  )
}

function Wordmark() {
  return (
    <span className="px-2 text-base font-bold tracking-tight text-zinc-950 dark:text-white">
      Ortho<span className="text-sky-500">Boost</span>
    </span>
  )
}

function CampaignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M13.92 3.845a19.36 19.36 0 0 1-6.3 1.98C6.765 5.942 5.89 6 5 6a4 4 0 0 0-.504 7.969 15.97 15.97 0 0 0 1.271 3.34c.397.77 1.342 1.05 2.108.652l.557-.29c.74-.385 1.02-1.295.657-2.045a13.49 13.49 0 0 1-.778-2.001c1.991.286 3.91.85 5.707 1.65.591.263 1.275-.16 1.275-.806V4.65c0-.648-.687-1.07-1.278-.806ZM15.617 14.823a.75.75 0 0 0 1.06.027c1.502-1.42 2.323-3.434 2.323-5.6 0-2.166-.82-4.18-2.323-5.6a.75.75 0 1 0-1.034 1.086c1.19 1.124 1.857 2.745 1.857 4.514s-.667 3.39-1.857 4.514a.75.75 0 0 0-.026 1.06Z" />
    </svg>
  )
}

function PersonasIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.48 6.48 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.48 6.48 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.97 6.97 0 0 1 10 18a6.97 6.97 0 0 1-4.696-1.81Z" />
    </svg>
  )
}

function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M10 2a8 8 0 0 0 0 16 1.5 1.5 0 0 0 1.5-1.5c0-.39-.15-.74-.39-1.01-.23-.26-.36-.6-.36-.99a1.5 1.5 0 0 1 1.5-1.5H14a4 4 0 0 0 4-4c0-3.86-3.59-7-8-7Zm-5.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  )
}
