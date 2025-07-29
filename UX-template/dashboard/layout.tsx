import type React from "react"
import { PawPrint, BellIcon, Settings } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/bottom-navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="sticky top-0 flex h-16 items-center justify-between border-b bg-white px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">PetPal</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
            <Link href="#" className="text-gray-500 hover:text-primary">
              Care
            </Link>
            <Link href="#" className="text-gray-500 hover:text-primary">
              Community
            </Link>
            <Link href="#" className="text-gray-500 hover:text-primary">
              Shop
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full md:flex hidden">
            <BellIcon className="h-5 w-5" />
          </Button>
          <Link href="/dashboard/profile">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder.svg?height=36&width=36" />
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">{children}</main>
      <BottomNavigation />
    </div>
  )
}
