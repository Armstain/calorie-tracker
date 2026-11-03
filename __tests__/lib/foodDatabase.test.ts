import FoodDatabaseService from '@/lib/foodDatabase';

describe('FoodDatabaseService', () => {
  let foodDatabase: FoodDatabaseService;

  beforeEach(() => {
    foodDatabase = FoodDatabaseService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = FoodDatabaseService.getInstance();
      const instance2 = FoodDatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getCategories', () => {
    it('should return all food categories', () => {
      const categories = foodDatabase.getCategories();
      // 8 original + 11 Bangladeshi-only categories.
      expect(categories.length).toBe(19);
      expect(categories[0]).toEqual({
        id: 'fruits',
        name: 'Fruits',
        icon: '🍎'
      });
    });
  });

  describe('Bangladeshi database port', () => {
    it('should include the ported BD foods alongside the original 19', () => {
      const allFoods = foodDatabase.getAllFoods();
      expect(allFoods.length).toBe(19 + 374);
      const ids = allFoods.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should find BD foods by English name, Bangla name and alias', () => {
      expect(foodDatabase.searchFoods('bhaat').some((f) => f.id === 'bd-bhaat')).toBe(true);
      expect(foodDatabase.searchFoods('ভাত').some((f) => f.id === 'bd-bhaat')).toBe(true);
      expect(foodDatabase.searchFoods('rui').some((f) => f.id === 'bd-rui_bhuna')).toBe(true);
    });

    it('should carry macros for BD foods, scaled by portion', () => {
      const macros = foodDatabase.calculateMacros('bd-alu_bhorta');
      expect(macros).toEqual({ protein: 2, carbs: 20, fat: 1, fiber: 2 });
      const spoon = foodDatabase.calculateMacros('bd-alu_bhorta', 0.15);
      expect(spoon?.protein).toBe(0.3);
      expect(foodDatabase.calculateMacros('apple')).toBeUndefined();
    });

    it('should keep all foods in valid categories with positive calories', () => {
      const categoryIds = foodDatabase.getCategories().map((c) => c.id);
      for (const food of foodDatabase.getAllFoods()) {
        expect(categoryIds).toContain(food.category);
        expect(food.caloriesPerUnit).toBeGreaterThan(0);
      }
    });
  });

  describe('getFoodsByCategory', () => {
    it('should return foods for a specific category', () => {
      const fruits = foodDatabase.getFoodsByCategory('fruits');
      expect(fruits.length).toBeGreaterThan(0);
      expect(fruits.every(food => food.category === 'fruits')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const foods = foodDatabase.getFoodsByCategory('non-existent');
      expect(foods).toEqual([]);
    });
  });

  describe('searchFoods', () => {
    it('should find foods by name', () => {
      const results = foodDatabase.searchFoods('apple');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('apple');
    });

    it('should find foods by description', () => {
      const results = foodDatabase.searchFoods('fresh');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = foodDatabase.searchFoods('xyz123nonexistent');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const results = foodDatabase.searchFoods('APPLE');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getFoodById', () => {
    it('should return food by id', () => {
      const apple = foodDatabase.getFoodById('apple');
      expect(apple).toBeDefined();
      expect(apple?.name).toBe('Apple');
      expect(apple?.id).toBe('apple');
    });

    it('should return undefined for non-existent id', () => {
      const food = foodDatabase.getFoodById('non-existent');
      expect(food).toBeUndefined();
    });
  });

  describe('getAllFoods', () => {
    it('should return all foods', () => {
      const allFoods = foodDatabase.getAllFoods();
      expect(allFoods.length).toBeGreaterThan(0);
      expect(allFoods.every(food => food.id && food.name && food.category)).toBe(true);
    });
  });

  describe('calculateCalories', () => {
    it('should calculate calories with default portion', () => {
      const calories = foodDatabase.calculateCalories('apple');
      expect(calories).toBe(95); // Apple has 95 calories per unit
    });

    it('should calculate calories with custom portion', () => {
      const calories = foodDatabase.calculateCalories('apple', 2);
      expect(calories).toBe(190); // 2 apples = 190 calories
    });

    it('should return 0 for non-existent food', () => {
      const calories = foodDatabase.calculateCalories('non-existent');
      expect(calories).toBe(0);
    });

    it('should round calories to nearest integer', () => {
      const calories = foodDatabase.calculateCalories('apple', 0.5);
      expect(calories).toBe(48); // 95 * 0.5 = 47.5, rounded to 48
    });
  });

  describe('food data integrity', () => {
    it('should have valid food data structure', () => {
      const allFoods = foodDatabase.getAllFoods();
      
      allFoods.forEach(food => {
        expect(food.id).toBeDefined();
        expect(food.name).toBeDefined();
        expect(food.category).toBeDefined();
        expect(food.caloriesPerUnit).toBeGreaterThan(0);
        expect(food.unit).toBeDefined();
        expect(typeof food.caloriesPerUnit).toBe('number');
      });
    });

    it('should have foods in valid categories', () => {
      const categories = foodDatabase.getCategories();
      const categoryIds = categories.map(cat => cat.id);
      const allFoods = foodDatabase.getAllFoods();
      
      allFoods.forEach(food => {
        expect(categoryIds).toContain(food.category);
      });
    });

    it('should have common portions with valid multipliers', () => {
      const allFoods = foodDatabase.getAllFoods();
      
      allFoods.forEach(food => {
        if (food.commonPortions) {
          food.commonPortions.forEach(portion => {
            expect(portion.name).toBeDefined();
            expect(portion.multiplier).toBeGreaterThan(0);
            expect(typeof portion.multiplier).toBe('number');
          });
        }
      });
    });
  });
});