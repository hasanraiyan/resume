import React from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';

/**
 * AppLayout Component
 * A standardized layout shell for internal mini-apps.
 *
 * @param {Object} props
 * @param {string} props.appName - The name of the application (e.g., "Pocketly", "Taskly").
 * @param {string|React.ReactNode} [props.appLogo] - Optional path to the app logo image or a custom logo React node.
 * @param {Array<{id: string, label: string, icon: React.ElementType}>} props.tabs - Array of tab objects.
 * @param {string} props.activeTab - The currently active tab ID.
 * @param {function} props.setActiveTab - Function to change the active tab.
 * @param {React.ReactNode} props.children - The main content area for the active tab.
 * @param {React.ReactNode} [props.headerActions] - Optional extra components to render in the right side of the header.
 * @param {React.ReactNode} [props.fab] - Optional Floating Action Button component.
 * @param {boolean} [props.hideSettingsFromMobileNav] - Whether to hide the tab with id 'settings' from the mobile bottom nav.
 * @param {boolean} [props.useHamburgerMenu] - If true, displays a hamburger menu for mobile instead of bottom nav. Note: Avoid for mobile layouts if all primary navigation tabs are already accessible via a bottom navigation bar.
 * @param {Object} [props.tabTitles] - Optional map of tab IDs to their display titles in the header. If omitted, uses the label from `tabs`.
 */
export default function AppLayout({
  appName,
  appLogo,
  tabs,
  activeTab,
  setActiveTab,
  children,
  headerActions = null,
  fab = null,
  hideSettingsFromMobileNav = false,
  useHamburgerMenu = false,
  tabTitles = null,
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const getTabTitle = () => {
    if (tabTitles && tabTitles[activeTab]) {
      return tabTitles[activeTab];
    }
    const currentTab = tabs.find((t) => t.id === activeTab);
    return currentTab ? currentTab.label : appName;
  };

  const renderLogo = (isMobileHeader = false) => {
    if (React.isValidElement(appLogo)) {
      return appLogo;
    }
    if (typeof appLogo === 'string') {
      return (
        <div className={`flex items-center gap-2 ${isMobileHeader ? 'lg:hidden' : ''}`}>
          <Image
            src={appLogo}
            alt={`${appName} logo`}
            width={isMobileHeader ? 24 : 28}
            height={isMobileHeader ? 24 : 28}
            className={isMobileHeader ? 'rounded-lg shadow-sm' : 'rounded-xl shadow-sm h-8 w-auto'}
            priority
          />
          <h1
            className={`font-[family-name:var(--font-logo)] text-${isMobileHeader ? 'xl lg:text-2xl' : '2xl'} ${appName === 'SnapLinks' ? 'text-[#1f644e]' : 'text-black'}`}
          >
            {appName}
          </h1>
        </div>
      );
    }
    // Fallback if no logo provided
    return (
      <h1
        className={`font-[family-name:var(--font-logo)] text-${isMobileHeader ? 'xl lg:text-2xl' : '2xl'} text-[#1f644e] ${isMobileHeader ? 'lg:hidden' : ''}`}
      >
        {appName}
      </h1>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <div className="flex items-center gap-2">{renderLogo()}</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1f644e] text-white'
                  : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-16 lg:pb-0 pt-14 lg:pt-0">
        {/* Header */}
        <header className="lg:sticky lg:top-0 fixed top-0 left-0 right-0 z-20 bg-[#fcfbf5] border-b border-[#e5e3d8]">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {useHamburgerMenu && (
                <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-5 h-5 text-[#1e3a34]" />
                </button>
              )}
              {renderLogo(true)}
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">{getTabTitle()}</h1>
            </div>
            <div className="flex items-center gap-3">{headerActions}</div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">{children}</main>
      </div>

      {/* Mobile Hamburger Menu Drawer */}
      {useHamburgerMenu && sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-[#e5e3d8]">{renderLogo()}</div>
            <nav className="py-4 px-3 space-y-1 overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1f644e] text-white'
                      : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      {!useHamburgerMenu && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs
            .filter((tab) => !hideSettingsFromMobileNav || tab.id !== 'settings')
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[60px] ${
                  activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'
                }`}
              >
                <tab.icon
                  className="w-[22px] h-[22px] mb-0.5"
                  strokeWidth={activeTab === tab.id ? 2 : 1.5}
                />
                <span
                  className={`text-[10px] ${activeTab === tab.id ? 'font-extrabold' : 'font-bold'}`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
        </nav>
      )}

      {/* Floating Action Button */}
      {fab}
    </div>
  );
}
