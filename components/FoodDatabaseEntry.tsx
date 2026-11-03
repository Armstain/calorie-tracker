'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FoodDatabaseService, { CommonFood, MacroPerUnit } from '@/lib/foodDatabase';


interface FoodDatabaseEntryProps {
  onFoodAdd: (food: CommonFood, calories: number, portion: string, macros?: MacroPerUnit) => void;
  // Optional: when provided, a "Save as favorite" button appears. Favorites
  // are re-logged later with zero Gemini calls (see lib/favorites.ts).
  onFavoriteAdd?: (food: CommonFood, calories: number, portion: string, macros?: MacroPerUnit) => void;
  onClose: () => void;
}

interface SelectedFood {
  food: CommonFood;
  portionMultiplier: number;
  portionName: string;
}

export default function FoodDatabaseEntry({ onFoodAdd, onFavoriteAdd, onClose }: FoodDatabaseEntryProps) {
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
    
    // Search shows the best 50 ranked matches; browsing a category shows
    // up to 100 (a category like vegetables has 84 foods).
    return foods.slice(0, searchQuery.trim() ? 50 : 100);
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

  // One-tap add: the row's + button logs the base portion immediately,
  // no portion screen. Tapping the row itself still opens portion choice.
  const handleQuickAdd = (food: CommonFood) => {
    onFoodAdd(
      food,
      food.caloriesPerUnit,
      food.unit,
      food.proteinPerUnit !== undefined
        ? { protein: food.proteinPerUnit, carbs: food.carbsPerUnit ?? 0, fat: food.fatPerUnit ?? 0, fiber: food.fiberPerUnit ?? 0 }
        : undefined
    );
  };

  const handleAddFood = () => {
    if (selectedFood) {
      const calories = foodDatabase.calculateCalories(
        selectedFood.food.id,
        selectedFood.portionMultiplier
      );
      // Pass macros: without this, portion-screen adds logged 0g macros
      // even though the summary above shows them.
      const macros = foodDatabase.calculateMacros(
        selectedFood.food.id,
        selectedFood.portionMultiplier
      );
      onFoodAdd(selectedFood.food, calories, selectedFood.portionName, macros);
      setSelectedFood(null);
    }
  };

  const calculatedCalories = selectedFood 
    ? foodDatabase.calculateCalories(selectedFood.food.id, selectedFood.portionMultiplier)
    : 0;

  const calculatedMacros = selectedFood
    ? foodDatabase.calculateMacros(selectedFood.food.id, selectedFood.portionMultiplier)
    : undefined;

  const handleFavoriteAdd = () => {
    if (selectedFood && onFavoriteAdd) {
      onFavoriteAdd(selectedFood.food, calculatedCalories, selectedFood.portionName, calculatedMacros);
    }
  };

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

          {/* Category Filter: a dropdown, not 20 chips. With 19 categories
              the chip row took up half the modal before any food showed. */}
          {!searchQuery && (
            <div className="flex items-center gap-2">
              <label htmlFor="quick-add-category" className="text-sm text-gray-600 shrink-0">Category:</label>
              <select
                id="quick-add-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">All foods</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
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
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium">{food.name}{food.nameBn ? ` (${food.nameBn})` : ''}</h4>
                        <p className="text-sm text-gray-600">{food.description}</p>
                        <p className="text-xs text-gray-500">{food.caloriesPerUnit} cal per {food.unit}{food.proteinPerUnit !== undefined ? ` · P ${food.proteinPerUnit}g · C ${food.carbsPerUnit}g · F ${food.fatPerUnit}g` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">
                          {categories.find(c => c.id === food.category)?.icon}
                        </Badge>
                        <button
                          type="button"
                          aria-label={`Add ${food.name} (${food.unit}) immediately`}
                          title="Add base portion immediately"
                          onClick={(e) => { e.stopPropagation(); handleQuickAdd(food); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
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
                    {calculatedMacros && (
                      <p className="text-xs text-gray-500">P {calculatedMacros.protein}g · C {calculatedMacros.carbs}g · F {calculatedMacros.fat}g</p>
                    )}
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
              {onFavoriteAdd && (
                <Button
                  onClick={handleFavoriteAdd}
                  variant="outline"
                  className="w-full"
                >
                  ☆ Save as favorite (no AI needed next time)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}