# AppLayout

`AppLayout` is a shared layout shell component designed to standardize the structure of internal mini-apps like Pocketly, Taskly, SnapLinks, and Memo Scribe. It provides a consistent responsive layout with a desktop sidebar, a mobile bottom navigation bar (or optional hamburger menu), a unified header, and support for Floating Action Buttons (FABs).

## Usage

```jsx
import AppLayout from '@/components/layout/AppLayout';
import { Home, Settings } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function MyAppContent() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <AppLayout
      appName="MyApp"
      appLogo="/images/apps/myapp.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      headerActions={<button>New Item</button>}
      fab={<MyFabComponent />}
    >
      {renderContent()}
    </AppLayout>
  );
}
```

## Props

| Prop                        | Type                    | Default      | Description                                                                                                                                                                                       |
| --------------------------- | ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appName`                   | `string`                | **Required** | The name of the application (e.g., "Pocketly"). Used in the logo section and fallback header title.                                                                                               |
| `appLogo`                   | `string` \| `ReactNode` | `null`       | Path to the app logo image (string) or a custom React node.                                                                                                                                       |
| `tabs`                      | `Array`                 | **Required** | Array of tab objects. Each object should have `{id: string, label: string, icon: LucideIcon}`.                                                                                                    |
| `activeTab`                 | `string`                | **Required** | The ID of the currently active tab.                                                                                                                                                               |
| `setActiveTab`              | `function`              | **Required** | Function to update the active tab state when a nav item is clicked.                                                                                                                               |
| `children`                  | `ReactNode`             | **Required** | The main content area of the app (the active tab's view).                                                                                                                                         |
| `headerActions`             | `ReactNode`             | `null`       | Optional components to render in the top right corner of the header (e.g., Syncing status, "New Chat" button).                                                                                    |
| `fab`                       | `ReactNode`             | `null`       | Optional Floating Action Button component. Make sure this component uses `fixed` positioning.                                                                                                     |
| `hideSettingsFromMobileNav` | `boolean`               | `false`      | If true, the tab with `id === 'settings'` will not be rendered in the mobile bottom navigation bar. Useful when settings is accessed via a header shortcut.                                       |
| `useHamburgerMenu`          | `boolean`               | `false`      | If true, renders a hamburger menu for mobile instead of a bottom navigation bar. Note: The memory guidelines suggest avoiding this if all primary navigation tabs can be fit in a bottom nav bar. |
| `tabTitles`                 | `Object`                | `null`       | An optional map of tab IDs to their display titles in the header. If not provided, it falls back to the tab's `label` property or the `appName`. Example: `{ chat: 'Pocketly Chat' }`.            |

## Migration Notes

When migrating an existing app (like Pocketly or Taskly) to `AppLayout`:

1.  Remove the app's custom `Aside`, `Header`, and Mobile Nav components.
2.  Pass the app's `tabs` array to `AppLayout`.
3.  Extract any special header buttons (like the `Settings` shortcut in Pocketly, or the `New Chat` button) into a `<React.Fragment>` and pass it to the `headerActions` prop.
4.  Pass the FAB (if any) to the `fab` prop.
5.  If the app hides the "Settings" tab from the mobile bottom nav (like Pocketly does), set `hideSettingsFromMobileNav={true}`.
