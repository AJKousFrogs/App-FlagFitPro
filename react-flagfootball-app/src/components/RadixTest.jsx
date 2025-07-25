import React from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

const RadixTest = () => {
  return (
    <div className="p-8 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Radix UI Test</CardTitle>
          <CardDescription>Testing if Radix UI components work correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button>Test Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <p className="text-sm text-gray-600">
            If you can see these buttons without any console errors, 
            the Radix UI components are working correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadixTest; 