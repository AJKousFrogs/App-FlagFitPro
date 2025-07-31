import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ChevronDown } from '../utils/icons';
import { cn } from '../utils/cn';
import { 
  Home, 
  GraduationCap,
  Users, 
  Trophy, 
  User,
  BarChart3,
  Heart,
  Settings
} from '../utils/icons';
import '../styles/radix-navigation.css';

const RadixNavigationMenu = () => {
  const location = useLocation();

  // Check if route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Custom Link component for React Router integration
  const NavLink = ({ href, children, className, ...props }) => {
    const active = isActive(href);
    
    return (
      <NavigationMenu.Link asChild active={active}>
        <Link 
          to={href} 
          className={cn("NavigationMenuLink", className)} 
          {...props}
        >
          {children}
        </Link>
      </NavigationMenu.Link>
    );
  };

  // Hybrid Navigation Item component that supports both direct navigation and dropdown
  const HybridNavItem = ({ mainHref, icon: Icon, title, children, dropdownItems }) => {
    const [isOpen, setIsOpen] = useState(false);
    const active = isActive(mainHref);
    
    return (
      <NavigationMenu.Item className="NavigationMenuItem">
        <div className="flex items-center">
          {/* Direct navigation link */}
          <NavLink 
            href={mainHref} 
            className={cn("NavigationMenuLink flex-1", active && "active")}
            onClick={(e) => {
              // Only navigate if clicking the main area, not the dropdown trigger
              if (!e.target.closest('.dropdown-trigger')) {
                // Navigation will happen via the Link component
              }
            }}
          >
            <Icon className="h-5 w-5" />
            <span>{title}</span>
          </NavLink>
          
          {/* Dropdown trigger */}
          <NavigationMenu.Trigger 
            className="NavigationMenuTrigger dropdown-trigger ml-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className="CaretDown" aria-hidden />
          </NavigationMenu.Trigger>
        </div>
        
        <NavigationMenu.Content className="NavigationMenuContent">
          <ul className="List two">
            {dropdownItems}
          </ul>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    );
  };

  // List Item component for navigation content
  const ListItem = React.forwardRef(({ className, children, title, href, icon: Icon, ...props }, forwardedRef) => (
    <li>
      <NavigationMenu.Link asChild>
        <Link
          className={cn("ListItemLink", className)}
          to={href}
          {...props}
          ref={forwardedRef}
        >
          <div className="ListItemHeading">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </div>
          <p className="ListItemText">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  ));

  return (
    <NavigationMenu.Root className="NavigationMenuRoot">
      <div className="max-w-7xl mx-auto px-6">
        <NavigationMenu.List className="NavigationMenuList">
          {/* Logo/Brand */}
          <NavigationMenu.Item className="NavigationMenuItem">
            <NavLink href="/dashboard" className="NavigationMenuBrand">
              <span className="text-2xl">🏈</span>
              <span className="text-xl font-bold text-gray-900">
                FlagFit Pro
              </span>
            </NavLink>
          </NavigationMenu.Item>

          {/* Dashboard - Hybrid Navigation */}
          <HybridNavItem 
            mainHref="/dashboard"
            icon={Home}
            title="Dashboard"
            dropdownItems={[
              <ListItem key="overview" href="/dashboard" title="Overview">
                Your main dashboard with key metrics and stats.
              </ListItem>,
              <ListItem key="analytics" href="/dashboard/analytics" title="Analytics">
                Detailed performance analytics and insights.
              </ListItem>,
              <ListItem key="progress" href="/dashboard/progress" title="Progress Tracking">
                Track your training progress and achievements.
              </ListItem>,
              <ListItem key="goals" href="/dashboard/goals" title="Goals">
                Set and monitor your training goals.
              </ListItem>
            ]}
          />

          {/* Training - Hybrid Navigation */}
          <HybridNavItem 
            mainHref="/training"
            icon={GraduationCap}
            title="Training"
            dropdownItems={[
              <ListItem key="routes" href="/training/routes" title="Route Running">
                Agility drills and route precision training.
              </ListItem>,
              <ListItem key="plyometrics" href="/training/plyometrics" title="Plyometrics">
                Explosive power training for speed and agility.
              </ListItem>,
              <ListItem key="speed" href="/training/speed" title="Speed Training">
                Sprint mechanics and acceleration training.
              </ListItem>,
              <ListItem key="catching" href="/training/catching" title="Catching Drills">
                Hand-eye coordination and ball skills.
              </ListItem>,
              <ListItem key="strength" href="/training/strength" title="Strength Training">
                Functional strength training.
              </ListItem>,
              <ListItem key="recovery" href="/training/recovery" title="Recovery">
                Recovery protocols and optimization.
              </ListItem>
            ]}
          />

          {/* Community - Hybrid Navigation */}
          <HybridNavItem 
            mainHref="/community"
            icon={Users}
            title="Community"
            dropdownItems={[
              <ListItem key="forums" href="/community/forums" title="Discussion Forums">
                Connect with other players and coaches.
              </ListItem>,
              <ListItem key="leaderboards" href="/community/leaderboards" title="Leaderboards">
                Track performance rankings and achievements.
              </ListItem>,
              <ListItem key="teams" href="/community/teams" title="Team Management">
                Manage your team and player rosters.
              </ListItem>,
              <ListItem key="chat" href="/community/chat" title="Team Chat">
                Real-time communication with your team.
              </ListItem>
            ]}
          />

          {/* Tournaments - Hybrid Navigation */}
          <HybridNavItem 
            mainHref="/tournaments"
            icon={Trophy}
            title="Tournaments"
            dropdownItems={[
              <ListItem key="active" href="/tournaments/active" title="Active Tournaments">
                Currently running tournaments and events.
              </ListItem>,
              <ListItem key="upcoming" href="/tournaments/upcoming" title="Upcoming Events">
                Future tournaments and registration deadlines.
              </ListItem>,
              <ListItem key="results" href="/tournaments/results" title="Past Results">
                Historical tournament results and statistics.
              </ListItem>,
              <ListItem key="standings" href="/tournaments/standings" title="Standings">
                Current season rankings and points.
              </ListItem>
            ]}
          />



          {/* Profile */}
          <NavigationMenu.Item className="NavigationMenuItem">
            <NavLink href="/profile" className="NavigationMenuLink">
                              <User className="h-5 w-5" />
              <span>Profile</span>
            </NavLink>
          </NavigationMenu.Item>

          <NavigationMenu.Indicator className="NavigationMenuIndicator">
            <div className="Arrow" />
          </NavigationMenu.Indicator>
        </NavigationMenu.List>

        <div className="ViewportPosition">
          <NavigationMenu.Viewport className="NavigationMenuViewport" />
        </div>
      </div>
    </NavigationMenu.Root>
  );
};

export default RadixNavigationMenu; 