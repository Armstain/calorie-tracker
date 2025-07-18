import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodDatabaseEntry from '@/components/FoodDatabaseEntry';
import { CommonFood } from '@/lib/foodDatabase';

// Mock the food database service
jest.mock('../../lib/foodDatabase', () => {
  const mockFoods: CommonFood[] = [
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
      ],
    },
    {
      id: 'banana',
      name: 'Banana',
      category: 'fruits',
      caloriesPerUnit: 105,
      unit: '1 medium (118g)',
      description: 'Fresh banana',
    },
    {
      id: 'chicken-breast',
      name: 'Chicken Breast',
      category: 'proteins',
      caloriesPerUnit: 231,
      unit: '100g cooked',
      description: 'Skinless, boneless chicken breast',
    },
  ];

  const mockCategories = [
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'proteins', name: 'Proteins', icon: '🍗' },
  ];

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getCategories: () => mockCategories,
      getFoodsByCategory: (categoryId: string) => 
        mockFoods.filter(food => food.category === categoryId),
      searchFoods: (query: string) => 
        mockFoods.filter(food => 
          food.name.toLowerCase().includes(query.toLowerCase()) ||
          food.description?.toLowerCase().includes(query.toLowerCase())
        ),
      getAllFoods: () => mockFoods,
      getFoodById: (id: string) => mockFoods.find(food => food.id === id),
      calculateCalories: (foodId: string, multiplier: number = 1) => {
        const food = mockFoods.find(f => f.id === foodId);
        return food ? Math.round(food.caloriesPerUnit * multiplier) : 0;
      },
    })),
    getInstance: jest.fn().mockReturnValue({
      getCategories: () => mockCategories,
      getFoodsByCategory: (categoryId: string) => 
        mockFoods.filter(food => food.category === categoryId),
      searchFoods: (query: string) => 
        mockFoods.filter(food => 
          food.name.toLowerCase().includes(query.toLowerCase()) ||
          food.description?.toLowerCase().includes(query.toLowerCase())
        ),
      getAllFoods: () => mockFoods,
      getFoodById: (id: string) => mockFoods.find(food => food.id === id),
      calculateCalories: (foodId: string, multiplier: number = 1) => {
        const food = mockFoods.find(f => f.id === foodId);
        return food ? Math.round(food.caloriesPerUnit * multiplier) : 0;
      },
    }),
  };
});

describe('FoodDatabaseEntry', () => {
  const mockOnFoodAdd = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <FoodDatabaseEntry
        onFoodAdd={mockOnFoodAdd}
        onClose={mockOnClose}
      />
    );
  };

  it('should render the food database entry modal', () => {
    renderComponent();
    
    expect(screen.getByText('Quick Food Entry')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search foods...')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('🍎 Fruits')).toBeInTheDocument();
    expect(screen.getByText('🍗 Proteins')).toBeInTheDocument();
  });

  it('should close modal when X button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display all foods by default', () => {
    renderComponent();
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
  });

  it('should filter foods by category', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const fruitsButton = screen.getByText('🍎 Fruits');
    await user.click(fruitsButton);
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('Chicken Breast')).not.toBeInTheDocument();
  });

  it('should search foods by name', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Search foods...');
    await user.type(searchInput, 'apple');
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.queryByText('Banana')).not.toBeInTheDocument();
      expect(screen.queryByText('Chicken Breast')).not.toBeInTheDocument();
    });
  });

  it('should show no results message when search has no matches', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Search foods...');
    await user.type(searchInput, 'xyz123nonexistent');
    
    await waitFor(() => {
      expect(screen.getByText('No foods found. Try a different search term.')).toBeInTheDocument();
    });
  });

  it('should select a food and show portion options', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      expect(screen.getByText('Selected: Apple')).toBeInTheDocument();
      expect(screen.getByText('Choose Portion Size:')).toBeInTheDocument();
      expect(screen.getByText('1 medium (182g)')).toBeInTheDocument();
      expect(screen.getByText('Small apple')).toBeInTheDocument();
      expect(screen.getByText('Large apple')).toBeInTheDocument();
    });
  });

  it('should calculate calories for different portions', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      expect(screen.getByText('95')).toBeInTheDocument(); // Default portion
    });
    
    const largeAppleButton = screen.getByText('Large apple');
    await user.click(largeAppleButton);
    
    await waitFor(() => {
      expect(screen.getByText('124')).toBeInTheDocument(); // 95 * 1.3 = 123.5, rounded to 124
    });
  });

  it('should handle custom portion input', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      const customInput = screen.getByDisplayValue('1');
      expect(customInput).toBeInTheDocument();
    });
    
    const customInput = screen.getByDisplayValue('1');
    await user.clear(customInput);
    await user.type(customInput, '2.5');
    
    await waitFor(() => {
      expect(screen.getByText('238')).toBeInTheDocument(); // 95 * 2.5 = 237.5, rounded to 238
    });
  });

  it('should add food to daily total', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add to Daily Total');
      expect(addButton).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add to Daily Total');
    await user.click(addButton);
    
    expect(mockOnFoodAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'apple',
        name: 'Apple',
        caloriesPerUnit: 95,
      }),
      95,
      '1 medium (182g)'
    );
  });

  it('should allow changing selected food', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      expect(screen.getByText('Selected: Apple')).toBeInTheDocument();
    });
    
    const changeFoodButton = screen.getByText('Change Food');
    await user.click(changeFoodButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Selected: Apple')).not.toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  it('should display calorie summary correctly', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const appleItem = screen.getByText('Apple');
    await user.click(appleItem);
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('1 medium (182g)')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('calories')).toBeInTheDocument();
    });
  });
});