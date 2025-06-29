"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from '@clerk/nextjs';
import { cn } from "@/lib/utils";
import Image from "next/image";
import { GitHubStats } from '@/components/ui/GitHubStats';
import { GITHUB_CONFIG } from '@/lib/github-config';
import { 
  Database, 
  BarChart3, 
  Upload, 
  Settings, 
  Download,
  Search
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // GitHub repository configuration
  const GITHUB_REPO_URL = GITHUB_CONFIG.repoUrl;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to analysis page with search filter
      const targetUrl = `/analysis?search=${encodeURIComponent(searchQuery.trim())}`;
      router.push(targetUrl);
      
      // Clear search and hide results
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const searchSessions = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Filter sessions based on query
        const filtered = sessions.filter((session: any) => {
          const q = query.toLowerCase();
          return (
            session.sessionId?.toLowerCase().includes(q) ||
            session.files?.clients?.fileName?.toLowerCase().includes(q) ||
            session.files?.workers?.fileName?.toLowerCase().includes(q) ||
            session.files?.tasks?.fileName?.toLowerCase().includes(q)
          );
        }).slice(0, 5); // Limit to 5 results
        
        setSearchResults(filtered);
        setShowSearchResults(filtered.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSessions(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

      {/* Sidebar */}
      <div className="relative z-20 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 relative">
              <Image 
                src="/logo.svg" 
                alt="Data Alchemist Logo" 
                width={32} 
                height={32}
                className="text-white"
              />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Data Alchemist
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <NavItem href="/analysis" icon={BarChart3} label="Dashboard" active={pathname === "/analysis" || pathname === "/dashboard"} />
            <NavItem href="/data" icon={Database} label="Data Upload" active={pathname === "/data"} />
            <NavItem href="/rules" icon={Settings} label="Rules" active={pathname === "/rules"} />
            <NavItem href="/export" icon={Download} label="Export" active={pathname === "/export"} />
          </nav>
        </div>

        {/* Bottom section - GitHub */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Data Alchemist</div>
                  <div className="text-xs text-gray-400">Open Source Tool</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GitHubStats 
                  repoUrl={GITHUB_REPO_URL} 
                  size="sm" 
                  className="text-yellow-400" 
                />
                <button 
                  onClick={() => window.open(GITHUB_REPO_URL, '_blank')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        {/* Top Navigation */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Page Title */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-white">
                  {pathname === "/analysis" || pathname === "/dashboard" ? "Dashboard" :
                   pathname === "/data" ? "Data Upload" :
                   pathname === "/rules" ? "Business Rules" :
                   pathname === "/export" ? "Export Data" : "Data Alchemist"}
                </h1>
              </div>
              
              {/* Search */}
              <div className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 backdrop-blur-sm w-48 sm:w-64"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 animate-spin rounded-full border border-blue-400/30 border-t-blue-400"></div>
                    </div>
                  )}
                </form>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-gray-400 px-2 py-1 mb-1">Sessions</div>
                      {searchResults.map((session, index) => (
                        <button
                          key={session.sessionId}
                          onClick={() => {
                            router.push(`/analysis/${session.sessionId}`);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                          className="w-full text-left p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Search className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                Session {session.sessionId.slice(0, 8)}...
                              </div>
                              <div className="text-xs text-gray-400 flex gap-2">
                                {session.files?.clients && (
                                  <span>Clients: {session.files.clients.rowCount}</span>
                                )}
                                {session.files?.workers && (
                                  <span>Workers: {session.files.workers.rowCount}</span>
                                )}
                                {session.files?.tasks && (
                                  <span>Tasks: {session.files.tasks.rowCount}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {searchQuery.trim() && (
                        <div className="border-t border-white/10 mt-2 pt-2">
                          <button
                            onClick={() => {
                              router.push(`/analysis?search=${encodeURIComponent(searchQuery.trim())}`);
                              setSearchQuery("");
                              setShowSearchResults(false);
                            }}
                            className="w-full text-left p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Search className="w-4 h-4 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">
                                  Search all sessions for "{searchQuery}"
                                </div>
                                <div className="text-xs text-gray-400">
                                  View detailed search results
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick Actions */}
              <button 
                onClick={() => router.push('/data')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                New Upload
              </button>
              
              {/* GitHub Menu */}
              <div className="flex items-center gap-3">
                <UserButton />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
        active 
          ? "bg-white/10 text-white border border-white/20" 
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
