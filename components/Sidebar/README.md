# SidebarFooter Component Documentation

## Table of Contents
- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Technical Implementation](#technical-implementation)
- [Performance Optimizations](#performance-optimizations)
- [Component Breakdown](#component-breakdown)
- [State Management](#state-management)
- [Styling and Animations](#styling-and-animations)
- [Best Practices](#best-practices)
- [Installation and Usage](#installation-and-usage)
- [Performance Considerations](#performance-considerations)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Changelog](#changelog)

## Overview

The SidebarFooter is a sophisticated React component that has been refactored to enhance performance, maintainability, and scalability. It provides comprehensive functionality including user profile management, theme switching, language selection, and status management within a sidebar layout.

## Component Architecture

```
    A["SidebarFooter (Root)"] --> B["SidebarFooterProvider (Context)"]
    B --> C["UserDropdown"]
    C --> D["UserAvatarSmall"]
    C --> E["UserInfo"]
    C --> F["DropdownMenuContent"]
    F --> G["UserBanner"]
    F --> H["UserAvatar"]
    F --> E["UserInfo"]
    F --> I["UserSocialMedia"]
    F --> J["UserProfile"]
    F --> K["MenuOptions"]
    K --> M["CustomSelect (Language)"]
    K --> N["CustomSelect (Status)"]
    K --> L["ThemeSwitch (Dynamic)"]
    B -.-> O["SidebarFooterContext.tsx"]
```

## Technical Implementation

### Directory Structure

```
components/Sidebar/_3/SidebarFooter/
├── index.tsx                # Main component
├── SidebarFooterContext.tsx # Context provider
├── UserDropdown.tsx         # Dropdown component
├── UserAvatarSmall.tsx      # Small avatar component for UserDropdown
├── UserInfo.tsx             # User info component
├── DropdownMenuContent.tsx  # Dropdown menu content component
├── UserBanner.tsx           # User banner component
├── UserAvatar.tsx           # Large avatar component for DropdownMenuContent
├── StatusIndicator.tsx      # Status indicator component
├── UserSocialMedia.tsx      # Social media links component
├── UserProfile.tsx          # User profile component
├── MenuOptions.tsx          # Menu options component
├── CustomSelect.tsx         # Custom select component
├── types.ts                 # TypeScript types
└── README.md                # Documentation
```

### Core Technologies

- React 18+
- TypeScript
- Framer Motion
- Tailwind CSS
- shadcn/ui components


## Performance Optimizations

### 1. Component Memoization

```typescript
export const UserDropdown = React.memo(() => {
  // Component implementation
});
```

### 2. Callback Optimizations

```typescript
const handleOpenChange = useCallback((open: boolean) => {
  setIsOpen(open);
}, [setIsOpen]);
```

### 3. Context Optimization

```typescript
const contextValue = useMemo(() => ({
  isOpen,
  setIsOpen: handleSetIsOpen,
  userStatus,
  setUserStatus: handleSetUserStatus,
  language,
  setLanguage: handleSetLanguage,
}), [isOpen, userStatus, language, handleSetIsOpen, handleSetUserStatus, handleSetLanguage]);
```

### 4. Dynamic Imports

```typescript
const ThemeSwitch = dynamic(() => import("../../../ThemeSwitch"), { 
  ssr: false 
});
```

## Component Breakdown

### 1. SidebarFooterProvider

- Manages global state through Context API
- Handles user status, language preferences, and dropdown state
- Provides memoized state updates


### 2. SidebarFooterContext.tsx

- Creates and manages the React Context for SidebarFooter
- Defines the shape of the shared state and functions
- Provides a custom hook (useSidebarFooter) for easy context consumption
- Implements performance optimizations for context value


### 3. UserDropdown

- Manages dropdown interaction
- Handles animation states
- Provides user interface elements


### 4. UserAvatar

- Displays user profile image
- Shows status indicator
- Handles image loading states


### 5. MenuOptions

- Provides theme switching
- Handles language selection
- Manages user status updates
- Implements social links


## State Management

### Context Implementation

```typescript
// SidebarFooterContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { UserStatus } from './types';

interface SidebarFooterContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userStatus: UserStatus;
  setUserStatus: (status: UserStatus) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const SidebarFooterContext = createContext<SidebarFooterContextType | undefined>(undefined);

export const useSidebarFooter = () => {
  const context = useContext(SidebarFooterContext);
  if (!context) {
    throw new Error('useSidebarFooter must be used within a SidebarFooterProvider');
  }
  return context;
};

export const SidebarFooterProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [language, setLanguage] = useState("en");

  const handleSetIsOpen = useCallback((value: boolean) => setIsOpen(value), []);
  const handleSetUserStatus = useCallback((status: UserStatus) => setUserStatus(status), []);
  const handleSetLanguage = useCallback((lang: string) => setLanguage(lang), []);

  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen: handleSetIsOpen,
    userStatus,
    setUserStatus: handleSetUserStatus,
    language,
    setLanguage: handleSetLanguage,
  }), [isOpen, userStatus, language, handleSetIsOpen, handleSetUserStatus, handleSetLanguage]);

  return (
    <SidebarFooterContext.Provider value={contextValue}>
      {children}
    </SidebarFooterContext.Provider>
  );
};
```

### Custom Hooks

```typescript
// Usage in a component
import { useSidebarFooter } from './SidebarFooterContext';

const MyComponent = () => {
  const { userStatus, setUserStatus } = useSidebarFooter();
  // Use the context values and functions
};
```

## Styling and Animations

### Tailwind CSS Implementation

- Responsive design patterns
- Dark mode support
- Custom gradient implementations
- Transition effects


### Framer Motion Animations

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8, x: "-100%" }}
  animate={{ opacity: 1, scale: 1, x: 0 }}
  exit={{
    opacity: 0,
    scale: 0,
    x: avatarPosition.x - 150,
    y: avatarPosition.y - window.scrollY - 240,
  }}
  transition={{
    enter: { type: "spring", stiffness: 300, damping: 30 },
    exit: { type: "spring", stiffness: 300, damping: 30, mass: 0.5 },
  }}
>
  {/* Component content */}
</motion.div>
```

## Best Practices

### 1. Type Safety

```typescript
export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  triggerClassName?: string;
  contentClassName?: string;
  alignOffset?: number;
}
```

### 2. Accessibility

- ARIA labels implementation
- Keyboard navigation support
- Screen reader compatibility
- Focus management


### 3. Error Handling

- Proper error boundaries
- Type checking
- Context validation
- Loading states


## Installation and Usage

### Installation

```shellscript
# If using npm
npm install @/components/Sidebar

# If using yarn
yarn add @/components/Sidebar

# If using pnpm
pnpm add @/components/Sidebar
```

### Basic Usage

```typescript
import { SidebarFooter } from '@/components/Sidebar/_3/SidebarFooter';

function App() {
  return (
    <div className="app-container">
      <SidebarFooter />
    </div>
  );
}
```

### Advanced Usage

```typescript
import { SidebarFooter } from '@/components/Sidebar/_3/SidebarFooter';
import { useSidebarFooter } from '@/components/Sidebar/_3/SidebarFooter/SidebarFooterContext';

function CustomApp() {
  const { userStatus, setUserStatus } = useSidebarFooter();

  return (
    <div className="app-container">
      <SidebarFooter />
      {/* Custom implementation using context */}
      <div>Current user status: {userStatus}</div>
      <button onClick={() => setUserStatus('idle')}>Set to Idle</button>
    </div>
  );
}
```

## Performance Considerations

### 1. Render Optimization

- Implemented React.memo for pure components
- Used useCallback for event handlers
- Implemented useMemo for complex computations
- Added dynamic imports for better code splitting


### 2. Bundle Size Optimization

- Dynamic imports for large components
- Tree-shaking friendly exports
- Optimized asset loading
- Efficient code splitting


### 3. State Management Optimization

- Centralized state management
- Memoized context values
- Optimized re-renders
- Efficient update patterns


## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { SidebarFooter } from './SidebarFooter';

describe('SidebarFooter', () => {
  it('renders without crashing', () => {
    render(<SidebarFooter />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  // Add more test cases here
});
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install` or `yarn install`
3. Follow coding standards outlined in the project
4. Submit pull requests for review


### Code Style

- Follow TypeScript best practices
- Use consistent naming conventions
- Maintain component structure
- Document changes thoroughly


## License

MIT License - see LICENSE.md for details

## Support

For support, please open an issue in the repository or contact the development team at [lenobitech@gmail.com](mailto:lenobitech@gmail.com).

## Changelog

### Version 1.0.0

- Initial release with core functionality
- Implemented performance optimizations
- Added comprehensive documentation
- Added dynamic imports for ThemeSwitch component
- Improved accessibility features
- Enhanced animation performance
- Expanded test coverage


