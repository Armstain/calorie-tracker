/**
 * Food Database Service
 * Provides a local database of common foods for quick calorie entry
 */

export interface CommonFood {
  id: string;
  name: string;
  category: string;
  caloriesPerUnit: number;
  unit: string; // e.g., "100g", "1 cup", "1 piece"
  description?: string;
  commonPortions?: {
    name: string;
    multiplier: number; // multiplier for base calories
  }[];
}

export interface FoodCategory {
  id: string;
  name: string;
  icon: string;
}

class FoodDatabaseService {
  private static instance: FoodDatabaseService;
  private foods: CommonFood[] = [];
  private categories: FoodCategory[] = [];

  private constructor() {
    this.initializeDatabase();
  }

  public static getInstance(): FoodDatabaseService {
    if (!FoodDatabaseService.instance) {
      FoodDatabaseService.instance = new FoodDatabaseService();
    }
    return FoodDatabaseService.instance;
  }

  private initializeDatabase(): void {
    this.categories = [
      { id: 'fruits', name: 'Fruits', icon: '🍎' },
      { id: 'vegetables', name: 'Vegetables', icon: '🥕' },
      { id: 'grains', name: 'Grains & Cereals', icon: '🌾' },
      { id: 'proteins', name: 'Proteins', icon: '🍗' },
      { id: 'dairy', name: 'Dairy', icon: '🥛' },
      { id: 'snacks', name: 'Snacks', icon: '🍿' },
      { id: 'beverages', name: 'Beverages', icon: '☕' },
      { id: 'desserts', name: 'Desserts', icon: '🍰' },
    ];

    this.foods = [
      // Fruits
      {
        id: 'apple',
        name: 'Apple',
        category: 'fruits',
        caloriesPerUnit: 95,
        unit: '1 medium (182g)',
        description: 'Fresh apple with skin',
        commonPortions: [
          { name: 'Small apple', multiplier: 0.8 },
          { name: 'Large apple', multiplier: 1.3 },
          { name: '1 cup sliced', multiplier: 0.6 },
        ],
      },
      {
        id: 'banana',
        name: 'Banana',
        category: 'fruits',
        caloriesPerUnit: 105,
        unit: '1 medium (118g)',
        description: 'Fresh banana',
        commonPortions: [
          { name: 'Small banana', multiplier: 0.8 },
          { name: 'Large banana', multiplier: 1.2 },
          { name: '1 cup sliced', multiplier: 1.3 },
        ],
      },
      {
        id: 'orange',
        name: 'Orange',
        category: 'fruits',
        caloriesPerUnit: 62,
        unit: '1 medium (154g)',
        description: 'Fresh orange',
        commonPortions: [
          { name: 'Small orange', multiplier: 0.8 },
          { name: 'Large orange', multiplier: 1.3 },
          { name: '1 cup segments', multiplier: 1.4 },
        ],
      },
      
      // Vegetables
      {
        id: 'broccoli',
        name: 'Broccoli',
        category: 'vegetables',
        caloriesPerUnit: 25,
        unit: '1 cup chopped (91g)',
        description: 'Fresh broccoli florets',
        commonPortions: [
          { name: '1 cup cooked', multiplier: 2.2 },
          { name: '1 medium stalk', multiplier: 1.6 },
        ],
      },
      {
        id: 'carrot',
        name: 'Carrot',
        category: 'vegetables',
        caloriesPerUnit: 25,
        unit: '1 medium (61g)',
        description: 'Fresh carrot',
        commonPortions: [
          { name: '1 cup chopped', multiplier: 2.1 },
          { name: '1 cup baby carrots', multiplier: 1.4 },
        ],
      },
      
      // Grains & Cereals
      {
        id: 'white-rice',
        name: 'White Rice',
        category: 'grains',
        caloriesPerUnit: 205,
        unit: '1 cup cooked (158g)',
        description: 'Cooked white rice',
        commonPortions: [
          { name: '1/2 cup cooked', multiplier: 0.5 },
          { name: '1.5 cups cooked', multiplier: 1.5 },
        ],
      },
      {
        id: 'brown-rice',
        name: 'Brown Rice',
        category: 'grains',
        caloriesPerUnit: 216,
        unit: '1 cup cooked (195g)',
        description: 'Cooked brown rice',
        commonPortions: [
          { name: '1/2 cup cooked', multiplier: 0.5 },
          { name: '1.5 cups cooked', multiplier: 1.5 },
        ],
      },
      {
        id: 'bread-white',
        name: 'White Bread',
        category: 'grains',
        caloriesPerUnit: 79,
        unit: '1 slice (28g)',
        description: 'White bread slice',
        commonPortions: [
          { name: '2 slices', multiplier: 2 },
          { name: 'Thick slice', multiplier: 1.5 },
        ],
      },
      
      // Proteins
      {
        id: 'chicken-breast',
        name: 'Chicken Breast',
        category: 'proteins',
        caloriesPerUnit: 231,
        unit: '100g cooked',
        description: 'Skinless, boneless chicken breast',
        commonPortions: [
          { name: '1 small breast (85g)', multiplier: 0.85 },
          { name: '1 large breast (150g)', multiplier: 1.5 },
        ],
      },
      {
        id: 'salmon',
        name: 'Salmon',
        category: 'proteins',
        caloriesPerUnit: 206,
        unit: '100g cooked',
        description: 'Cooked Atlantic salmon',
        commonPortions: [
          { name: '1 fillet (150g)', multiplier: 1.5 },
          { name: '3 oz serving (85g)', multiplier: 0.85 },
        ],
      },
      {
        id: 'eggs',
        name: 'Egg',
        category: 'proteins',
        caloriesPerUnit: 70,
        unit: '1 large egg (50g)',
        description: 'Large chicken egg',
        commonPortions: [
          { name: '2 eggs', multiplier: 2 },
          { name: '3 eggs', multiplier: 3 },
          { name: 'Egg white only', multiplier: 0.24 },
        ],
      },
      
      // Dairy
      {
        id: 'milk-whole',
        name: 'Whole Milk',
        category: 'dairy',
        caloriesPerUnit: 149,
        unit: '1 cup (244g)',
        description: 'Whole milk (3.25% fat)',
        commonPortions: [
          { name: '1/2 cup', multiplier: 0.5 },
          { name: '1 glass (8 oz)', multiplier: 1 },
        ],
      },
      {
        id: 'yogurt-plain',
        name: 'Plain Yogurt',
        category: 'dairy',
        caloriesPerUnit: 154,
        unit: '1 cup (245g)',
        description: 'Plain whole milk yogurt',
        commonPortions: [
          { name: '1/2 cup', multiplier: 0.5 },
          { name: '6 oz container', multiplier: 0.7 },
        ],
      },
      
      // Snacks
      {
        id: 'almonds',
        name: 'Almonds',
        category: 'snacks',
        caloriesPerUnit: 164,
        unit: '1 oz (28g)',
        description: 'Raw almonds (about 23 nuts)',
        commonPortions: [
          { name: '10 almonds', multiplier: 0.43 },
          { name: '1/4 cup', multiplier: 1.4 },
        ],
      },
      {
        id: 'peanut-butter',
        name: 'Peanut Butter',
        category: 'snacks',
        caloriesPerUnit: 188,
        unit: '2 tbsp (32g)',
        description: 'Smooth peanut butter',
        commonPortions: [
          { name: '1 tbsp', multiplier: 0.5 },
          { name: '3 tbsp', multiplier: 1.5 },
        ],
      },
      
      // Beverages
      {
        id: 'coffee-black',
        name: 'Black Coffee',
        category: 'beverages',
        caloriesPerUnit: 2,
        unit: '1 cup (240ml)',
        description: 'Black coffee, no additives',
        commonPortions: [
          { name: 'Small cup (6 oz)', multiplier: 0.75 },
          { name: 'Large cup (12 oz)', multiplier: 1.5 },
        ],
      },
      {
        id: 'orange-juice',
        name: 'Orange Juice',
        category: 'beverages',
        caloriesPerUnit: 112,
        unit: '1 cup (248ml)',
        description: 'Fresh orange juice',
        commonPortions: [
          { name: '1/2 cup', multiplier: 0.5 },
          { name: '6 oz glass', multiplier: 0.75 },
        ],
      },
      
      // Desserts
      {
        id: 'chocolate-chip-cookie',
        name: 'Chocolate Chip Cookie',
        category: 'desserts',
        caloriesPerUnit: 78,
        unit: '1 medium cookie (16g)',
        description: 'Homemade chocolate chip cookie',
        commonPortions: [
          { name: '2 cookies', multiplier: 2 },
          { name: '3 cookies', multiplier: 3 },
          { name: 'Large cookie', multiplier: 1.5 },
        ],
      },
      {
        id: 'ice-cream-vanilla',
        name: 'Vanilla Ice Cream',
        category: 'desserts',
        caloriesPerUnit: 137,
        unit: '1/2 cup (66g)',
        description: 'Regular vanilla ice cream',
        commonPortions: [
          { name: '1 scoop', multiplier: 1 },
          { name: '1 cup', multiplier: 2 },
          { name: '2 scoops', multiplier: 2 },
        ],
      },
    ];
  }

  public getCategories(): FoodCategory[] {
    return this.categories;
  }

  public getFoodsByCategory(categoryId: string): CommonFood[] {
    return this.foods.filter(food => food.category === categoryId);
  }

  public searchFoods(query: string): CommonFood[] {
    const lowercaseQuery = query.toLowerCase();
    return this.foods.filter(food => 
      food.name.toLowerCase().includes(lowercaseQuery) ||
      food.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  public getFoodById(id: string): CommonFood | undefined {
    return this.foods.find(food => food.id === id);
  }

  public getAllFoods(): CommonFood[] {
    return this.foods;
  }

  public calculateCalories(foodId: string, portionMultiplier: number = 1): number {
    const food = this.getFoodById(foodId);
    if (!food) return 0;
    return Math.round(food.caloriesPerUnit * portionMultiplier);
  }
}

export default FoodDatabaseService;