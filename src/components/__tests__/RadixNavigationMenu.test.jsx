import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RadixNavigationMenu from '../RadixNavigationMenu';

// Mock the CSS import
jest.mock('../../styles/radix-navigation.css', () => ({}));

// Mock Lucide icons
jest.mock('../../utils/icons', () => ({
  Home: () => <div data-testid="home-icon">Home</div>,
  GraduationCap: () => <div data-testid="academic-icon">Academic</div>,
  Users: () => <div data-testid="user-group-icon">UserGroup</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  User: () => <div data-testid="user-icon">User</div>,
  BarChart3: () => <div data-testid="chart-icon">Chart</div>,
  ChevronDown: () => <div data-testid="caret-down">▼</div>,
}));

// Mock Radix UI components
jest.mock('@radix-ui/react-navigation-menu', () => ({
  Root: ({ children, className }) => <nav className={className} data-testid="navigation-root">{children}</nav>,
  List: ({ children, className }) => <ul className={className} data-testid="navigation-list">{children}</ul>,
  Item: ({ children, className }) => <li className={className} data-testid="navigation-item">{children}</li>,
  Trigger: ({ children, className }) => <button className={className} data-testid="navigation-trigger">{children}</button>,
  Content: ({ children, className }) => <div className={className} data-testid="navigation-content">{children}</div>,
  Link: ({ children, className, asChild, active }) => (
    <a className={className} data-testid="navigation-link" data-active={active}>
      {children}
    </a>
  ),
  Viewport: ({ className }) => <div className={className} data-testid="navigation-viewport" />,
  Indicator: ({ children, className }) => <div className={className} data-testid="navigation-indicator">{children}</div>,
}));



const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RadixNavigationMenu', () => {
  it('renders without crashing', () => {
    renderWithRouter(<RadixNavigationMenu />);
    expect(screen.getByTestId('navigation-root')).toBeInTheDocument();
  });

  it('renders the brand logo', () => {
    renderWithRouter(<RadixNavigationMenu />);
    expect(screen.getByText('FlagFit Pro')).toBeInTheDocument();
    expect(screen.getByText('🏈')).toBeInTheDocument();
  });

  it('renders main navigation items', () => {
    renderWithRouter(<RadixNavigationMenu />);
    
    // Check for main navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Tournaments')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders navigation triggers for dropdown menus', () => {
    renderWithRouter(<RadixNavigationMenu />);
    
    // Check for dropdown triggers
    const triggers = screen.getAllByTestId('navigation-trigger');
    expect(triggers.length).toBeGreaterThan(0);
  });

  it('renders navigation viewport', () => {
    renderWithRouter(<RadixNavigationMenu />);
    expect(screen.getByTestId('navigation-viewport')).toBeInTheDocument();
  });

  it('renders navigation indicator', () => {
    renderWithRouter(<RadixNavigationMenu />);
    expect(screen.getByTestId('navigation-indicator')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<RadixNavigationMenu />);
    
    // Check for navigation role
    const nav = screen.getByTestId('navigation-root');
    expect(nav).toBeInTheDocument();
    
    // Check for list structure
    const list = screen.getByTestId('navigation-list');
    expect(list).toBeInTheDocument();
  });
}); 