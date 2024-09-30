'use client'

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Home, Settings, Users, HelpCircle } from "lucide-react"

export function FullScreenLayoutNoHandle({ children }) {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full rounded-none border-0">
      <ResizablePanel defaultSize={20} minSize={15} className="bg-secondary">
        <div className="flex h-full flex-col">
          <div className="p-4">
            <h2 className="mb-2 text-lg font-semibold">Navigation</h2>
          </div>
          <Separator />
          <ScrollArea className="flex-grow">
            <nav className="flex flex-col gap-2 p-4">
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent text-secondary-foreground hover:text-accent-foreground">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent text-secondary-foreground hover:text-accent-foreground">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent text-secondary-foreground hover:text-accent-foreground">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent text-secondary-foreground hover:text-accent-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </a>
            </nav>
          </ScrollArea>
        </div>
      </ResizablePanel>
      <ResizablePanel>
        <div className="flex h-full flex-col">
          <header className="border-b p-4 bg-background">
            <h1 className="text-2xl font-bold">Content Area</h1>
          </header>
          <ScrollArea className="flex-grow">
            <main className="p-4">
              {children}
            </main>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}