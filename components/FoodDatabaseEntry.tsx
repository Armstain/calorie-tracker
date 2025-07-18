'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FoodDatabaseService, { CommonFood, FoodCategory } from '@/lib/foodDatabase';

interface FoodDatabaseEntryProps {
  onFoodAdd: (food: CommonFood, calories: number, portion: string) => void;
  onClose: () => void;
}

interface SelectedFood {
  food: CommonFood;
  portionMultiplier: number;
  portionName: string;
}

export default function FoodDatabaseEntry({ onFoodAdd, onClose }: FoodDatabaseEntryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [customPortion, setCustomPortion] = useState<number>(1);

  const foodDatabase = FoodDatabaseService.getInstance();
  const categories = foodDatabase.getCategories();

  // Filter foods based on search and category
  const filteredFoods = useMemo(() => {
    let foods: CommonFood[] = [];
    
    if (searchQuery.trim()) {
      foods = foodDatabase.searchFoods(searchQuery);
    } else if (selectedCategory) {
      foods = foodDatabase.getFoodsByCategory(selectedCategory);
    } else {
      foods = foodDatabase.getAllFoods();
    }
    
    return foods.slice(0, 20); // Limit results for performance
  }, [searchQuery, selectedCategory, foodDatabase]);

  const handleFoodSelect = (food: CommonFood) => {
    setSelectedFood({
      food,
      portionMultiplier: 1,
      portionName: food.unit,
    });
  };

  const handlePortionSelect = (multiplier: number, name: string) => {
    if (selectedFood) {
      setSelectedFood({
        ...selectedFood,
        portionMultiplier: multiplier,
        portionName: name,
      });
    }
  };

  const handleCustomPortionChange = (value: number) => {
    setCustomPortion(value);
    if (selectedFood) {
      setSelectedFood({
        ...selectedFood,
        portionMultiplier: value,
        portionName: `${value}x ${selectedFood.food.unit}`,
      });
    }
  };

  const handleAddFood = () => {
    if (selectedFood) {
      const calories = foodDatabase.calculateCalories(
        selectedFood.food.id,
        selectedFood.portionMultiplier
      );
      onFoodAdd(selectedFood.food, calories, selectedFood.portionName);
      setSelectedFood(null);
    }
  };

  const calculatedCalories = selectedFood 
    ? foodDatabase.calculateCalories(selectedFood.food.id, selectedFood.portionMultiplier)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Quick Food Entry</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(''); // Clear category when searching
              }}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-1"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Food Selection */}
          {!selectedFood && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-600">
                {searchQuery ? `Search results for "${searchQuery}"` : 
                 selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Foods` : 
                 'All Foods'}
              </h3>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleFoodSelect(food)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{food.name}</h4>
                        <p className="text-sm text-gray-600">{food.description}</p>
                        <p className="text-xs text-gray-500">{food.caloriesPerUnit} cal per {food.unit}</p>
                      </div>
                      <Badge variant="secondary">
                        {categories.find(c => c.id === food.category)?.icon}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredFoods.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No foods found. Try a different search term.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Portion Selection */}
          {selectedFood && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected: {selectedFood.food.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFood(null)}
                >
                  Change Food
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Choose Portion Size:</h4>
                
                {/* Default portion */}
                <Button
                  variant={selectedFood.portionMultiplier === 1 ? 'default' : 'outline'}
                  className="w-full justify-between"
                  onClick={() => handlePortionSelect(1, selectedFood.food.unit)}
                >
                  <span>{selectedFood.food.unit}</span>
                  <span>{selectedFood.food.caloriesPerUnit} cal</span>
                </Button>

                {/* Common portions */}
                {selectedFood.food.commonPortions?.map((portion, index) => (
                  <Button
                    key={index}
                    variant={selectedFood.portionMultiplier === portion.multiplier ? 'default' : 'outline'}
                    className="w-full justify-between"
                    onClick={() => handlePortionSelect(portion.multiplier, portion.name)}
                  >
                    <span>{portion.name}</span>
                    <span>{Math.round(selectedFood.food.caloriesPerUnit * portion.multiplier)} cal</span>
                  </Button>
                ))}

                {/* Custom portion */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Amount:</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={customPortion}
                      onChange={(e) => handleCustomPortionChange(parseFloat(e.target.value) || 1)}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-gray-600 px-2">
                      x {selectedFood.food.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calorie Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedFood.food.name}</p>
                    <p className="text-sm text-gray-600">{selectedFood.portionName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{calculatedCalories}</p>
                    <p className="text-sm text-gray-600">calories</p>
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddFood}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Daily Total
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}