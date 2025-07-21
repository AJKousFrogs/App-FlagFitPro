import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Checkbox } from './ui/Checkbox';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { AspectRatio } from './ui/AspectRatio';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/Collapsible';
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from './ui/Menubar';
import * as Separator from '@radix-ui/react-separator';
import * as Progress from '@radix-ui/react-progress';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDownIcon, CheckIcon, SunIcon, MoonIcon } from '@radix-ui/react-icons';

const RadixThemeDemo = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(33);
  const [sliderValue, setSliderValue] = useState([50]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen p-8 transition-colors ${isDarkMode ? 'dark' : ''}`} style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--accent-9)' }}>
            Radix UI Custom Theme Demo
          </h1>
          <p className="text-lg" style={{ color: 'var(--gray-10)' }}>
            Showcasing the custom olive/green color palette with all Radix UI components
          </p>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-center gap-4">
            <SunIcon className="h-4 w-4" />
            <Switch.Root
              checked={isDarkMode}
              onCheckedChange={toggleTheme}
              className="w-11 h-6 rounded-full relative bg-gray-3 data-[state=checked]:bg-accent-9 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
            </Switch.Root>
            <MoonIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Color Palette Display */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Custom olive/green accent colors and semantic grays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              {/* Accent Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-accent-12">Accent Colors</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({length: 12}, (_, i) => i + 1).map(num => (
                    <div key={num} className="space-y-1">
                      <div
                        className={`w-12 h-12 rounded border`}
                        style={{ backgroundColor: `var(--accent-${num})` }}
                      />
                      <div className="text-xs text-center text-gray-10">{num}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gray Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-12">Gray Colors</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({length: 12}, (_, i) => i + 1).map(num => (
                    <div key={num} className="space-y-1">
                      <div
                        className={`w-12 h-12 rounded border`}
                        style={{ backgroundColor: `var(--gray-${num})` }}
                      />
                      <div className="text-xs text-center text-gray-10">{num}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Different button variants using the theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Inputs, labels, and form controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Radio Group */}
          <Card>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
              <CardDescription>Single selection options</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="option1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="r1" />
                  <Label htmlFor="r1">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="r2" />
                  <Label htmlFor="r2">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="r3" />
                  <Label htmlFor="r3">Option 3</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Progress & Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Progress & Slider</CardTitle>
              <CardDescription>Visual feedback components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Progress: {progressValue}%</Label>
                <Progress.Root className="relative overflow-hidden bg-gray-3 rounded-full w-full h-2">
                  <Progress.Indicator
                    className="bg-accent-9 w-full h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${100 - progressValue}%)` }}
                  />
                </Progress.Root>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                >
                  Increase
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Slider: {sliderValue[0]}</Label>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                >
                  <Slider.Track className="bg-gray-3 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-accent-9 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white border-2 border-accent-9 rounded-full hover:bg-gray-1 focus:outline-none focus:shadow-lg"
                    aria-label="Volume"
                  />
                </Slider.Root>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Content organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs.Root defaultValue="tab1">
                <Tabs.List className="grid w-full grid-cols-3">
                  <Tabs.Trigger 
                    value="tab1"
                    className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent-1 data-[state=active]:bg-accent-2 data-[state=active]:text-accent-12"
                  >
                    Tab 1
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab2"
                    className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent-1 data-[state=active]:bg-accent-2 data-[state=active]:text-accent-12"
                  >
                    Tab 2
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab3"
                    className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent-1 data-[state=active]:bg-accent-2 data-[state=active]:text-accent-12"
                  >
                    Tab 3
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="tab1" className="mt-4 p-4 bg-gray-1 rounded-md">
                  <p className="text-sm text-gray-11">Content for tab 1</p>
                </Tabs.Content>
                <Tabs.Content value="tab2" className="mt-4 p-4 bg-gray-1 rounded-md">
                  <p className="text-sm text-gray-11">Content for tab 2</p>
                </Tabs.Content>
                <Tabs.Content value="tab3" className="mt-4 p-4 bg-gray-1 rounded-md">
                  <p className="text-sm text-gray-11">Content for tab 3</p>
                </Tabs.Content>
              </Tabs.Root>
            </CardContent>
          </Card>

          {/* Collapsible */}
          <Card>
            <CardHeader>
              <CardTitle>Collapsible</CardTitle>
              <CardDescription>Expandable content</CardDescription>
            </CardHeader>
            <CardContent>
              <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span>Toggle Content</span>
                    <ChevronDownIcon 
                      className={`h-4 w-4 transition-transform ${isCollapsibleOpen ? 'rotate-180' : ''}`} 
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 p-4 bg-gray-1 rounded-md">
                  <p className="text-sm text-gray-11">
                    This content can be collapsed and expanded using the Radix UI Collapsible component
                    with our custom theme colors.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* Menubar Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Menubar</CardTitle>
            <CardDescription>Navigation menu with the custom theme</CardDescription>
          </CardHeader>
          <CardContent>
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>New File</MenubarItem>
                  <MenubarItem>Open</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Save</MenubarItem>
                  <MenubarItem>Export</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Undo</MenubarItem>
                  <MenubarItem>Redo</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Copy</MenubarItem>
                  <MenubarItem>Paste</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Zoom In</MenubarItem>
                  <MenubarItem>Zoom Out</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Full Screen</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </CardContent>
        </Card>

        {/* AspectRatio Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Aspect Ratio</CardTitle>
            <CardDescription>Maintaining consistent proportions</CardDescription>
          </CardHeader>
          <CardContent>
            <AspectRatio ratio={16 / 9} className="bg-gray-2 rounded-md overflow-hidden">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-9 mb-2">16:9</div>
                  <div className="text-sm text-gray-10">Aspect Ratio Container</div>
                </div>
              </div>
            </AspectRatio>
          </CardContent>
        </Card>

        <div className="text-center pt-8">
          <p className="text-gray-10">
            🎨 This demo showcases the complete Radix UI component library with custom olive/green theme colors
          </p>
        </div>
      </div>
    </div>
  );
};

export default RadixThemeDemo;