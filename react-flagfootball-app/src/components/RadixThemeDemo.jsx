import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/Collapsible';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from './ui/Menubar';
import { AspectRatio } from './ui/AspectRatio';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

// Error boundary for individual components
const ComponentErrorBoundary = ({ children, fallback = <div>Component Error</div> }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return fallback;
  }
  
  try {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        {children}
      </React.Suspense>
    );
  } catch (error) {
    console.error('Component error:', error);
    setHasError(true);
    return fallback;
  }
};

// Safe component wrapper
const SafeComponent = ({ component: Component, ...props }) => {
  if (!Component) {
    console.warn('Component is undefined');
    return <div>Component not available</div>;
  }
  
  return (
    <ComponentErrorBoundary>
      <Component {...props} />
    </ComponentErrorBoundary>
  );
};

const RadixThemeDemo = () => {
  const [theme, setTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option-one');
  const [selectValue, setSelectValue] = useState('');

  // Ensure all components are available before rendering
  const [componentsReady, setComponentsReady] = useState(false);

  useEffect(() => {
    // Check if all required components are available
    const checkComponents = () => {
      const requiredComponents = [
        Card, Button, Input, Checkbox, RadioGroup, Select, 
        Collapsible, Menubar, AspectRatio, Avatar, Tooltip
      ];
      
      const allAvailable = requiredComponents.every(component => component !== undefined);
      setComponentsReady(allAvailable);
    };

    // Small delay to ensure all imports are resolved
    const timer = setTimeout(checkComponents, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!componentsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-9 mx-auto mb-4"></div>
          <p className="text-lg">Loading Radix UI components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Radix UI Theme Demo</h1>
          <p className="text-muted-foreground text-lg">
            Showcasing the custom olive/green theme with all Radix UI components
          </p>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm">Light</span>
            <div className="w-11 h-6 bg-gray-200 rounded-full relative">
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
            </div>
            <span className="text-sm">Dark</span>
          </div>
        </div>

        {/* Buttons Section */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>All button variants with the custom theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <SafeComponent component={Button}>Default</SafeComponent>
              <SafeComponent component={Button} variant="secondary">Secondary</SafeComponent>
              <SafeComponent component={Button} variant="destructive">Destructive</SafeComponent>
              <SafeComponent component={Button} variant="outline">Outline</SafeComponent>
              <SafeComponent component={Button} variant="ghost">Ghost</SafeComponent>
              <SafeComponent component={Button} variant="link">Link</SafeComponent>
            </div>
            <div className="flex flex-wrap gap-4">
              <SafeComponent component={Button} size="sm">Small</SafeComponent>
              <SafeComponent component={Button} size="default">Default</SafeComponent>
              <SafeComponent component={Button} size="lg">Large</SafeComponent>
            </div>
          </CardContent>
        </SafeComponent>

        {/* Form Elements */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields, checkboxes, and radio buttons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <SafeComponent component={Input} placeholder="Enter your email" />
            </div>
            
            <div className="flex items-center space-x-2">
              <SafeComponent 
                component={Checkbox}
                checked={checked}
                onCheckedChange={setChecked}
              />
              <label className="text-sm font-medium">Accept terms and conditions</label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select an option</label>
              <SafeComponent 
                component={Select}
                value={selectValue}
                onValueChange={setSelectValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option-1">Option 1</SelectItem>
                  <SelectItem value="option-2">Option 2</SelectItem>
                  <SelectItem value="option-3">Option 3</SelectItem>
                </SelectContent>
              </SafeComponent>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Radio Group</label>
              <SafeComponent 
                component={RadioGroup}
                value={radioValue}
                onValueChange={setRadioValue}
              >
                <div className="flex items-center space-x-2">
                  <SafeComponent component={RadioGroupItem} value="option-one" id="option-one" />
                  <label htmlFor="option-one">Option One</label>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeComponent component={RadioGroupItem} value="option-two" id="option-two" />
                  <label htmlFor="option-two">Option Two</label>
                </div>
              </SafeComponent>
            </div>
          </CardContent>
        </SafeComponent>

        {/* Progress and Slider Demo */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Progress & Slider</CardTitle>
            <CardDescription>Progress indicators and sliders (simulated)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent-9 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Slider</span>
                <span>50</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent-9 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
          </CardContent>
        </SafeComponent>

        {/* Tabs Demo */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Tabbed interface components (simulated)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button className="border-accent-9 text-accent-9 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                  Account
                </button>
                <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                  Password
                </button>
                <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                  Settings
                </button>
              </nav>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Account settings content would go here.</p>
            </div>
          </CardContent>
        </SafeComponent>

        {/* Collapsible */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Collapsible</CardTitle>
            <CardDescription>Expandable content sections</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeComponent 
              component={Collapsible}
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <CollapsibleTrigger asChild>
                <SafeComponent component={Button} variant="outline">
                  Click to expand
                </SafeComponent>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-4">
                <div className="rounded-md border px-4 py-3 text-sm">
                  This is the collapsible content. It can contain any elements you want.
                </div>
              </CollapsibleContent>
            </SafeComponent>
          </CardContent>
        </SafeComponent>

        {/* Menubar */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Menubar</CardTitle>
            <CardDescription>Application menu bar</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeComponent component={Menubar}>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    New Window <MenubarShortcut>⌘N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Share</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </SafeComponent>
          </CardContent>
        </SafeComponent>

        {/* Avatar */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>User avatar components</CardDescription>
          </CardHeader>
          <CardContent className="flex space-x-4">
            <SafeComponent component={Avatar}>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </SafeComponent>
            <SafeComponent component={Avatar}>
              <AvatarFallback>JD</AvatarFallback>
            </SafeComponent>
          </CardContent>
        </SafeComponent>

        {/* Tooltip */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Tooltip</CardTitle>
            <CardDescription>Hover tooltips</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeComponent component={TooltipProvider}>
              <SafeComponent 
                component={Tooltip}
              >
                <TooltipTrigger asChild>
                  <SafeComponent component={Button} variant="outline">
                    Hover me
                  </SafeComponent>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </SafeComponent>
            </SafeComponent>
          </CardContent>
        </SafeComponent>

        {/* Aspect Ratio */}
        <SafeComponent component={Card}>
          <CardHeader>
            <CardTitle>Aspect Ratio</CardTitle>
            <CardDescription>Maintain aspect ratios for content</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeComponent component={AspectRatio} ratio={16 / 9}>
              <img
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Photo"
                className="rounded-md object-cover"
              />
            </SafeComponent>
          </CardContent>
        </SafeComponent>
      </div>
    </div>
  );
};

export default RadixThemeDemo;