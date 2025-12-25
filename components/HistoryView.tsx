'use client';

import { useState } from 'react';
import { BarChart3, List, TrendingUp, TrendingDown, ArrowRight, CheckCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ReferenceLine,
  Cell
} from 'recharts';
import { HistoryProps } from '@/types';
import { formatCalories, dateUtils, calculateWeeklyAverage } from '@/lib/utils';

export default function HistoryView({ weeklyData, onDateSelect }: HistoryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const weeklyAverage = calculateWeeklyAverage(weeklyData);
  const totalCalories = weeklyData.reduce((sum, day) => sum + day.totalCalories, 0);
  const daysWithGoalMet = weeklyData.filter(day => day.goalMet).length;
  const goalAchievementRate = weeklyData.length > 0 ? (daysWithGoalMet / weeklyData.length) * 100 : 0;

  // Prepare data for Recharts
  const chartData = weeklyData.map((day) => ({
    date: day.date,
    displayDate: dateUtils.formatDisplayDate(day.date).split(' ').slice(0, 2).join(' '),
    shortDate: dateUtils.formatDisplayDate(day.date).split(' ')[0],
    calories: day.totalCalories,
    goal: day.goalCalories,
    goalMet: day.goalMet,
    entries: day.entries.length,
    percentage: day.goalCalories > 0 ? (day.totalCalories / day.goalCalories) * 100 : 0,
    color: day.goalMet ? '#10b981' : day.totalCalories >= day.goalCalories * 0.8 ? '#f59e0b' : '#ef4444'
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { displayDate: string; calories: number; goal: number; entries: number; goalMet: boolean; percentage: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.displayDate}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{formatCalories(data.calories)}</span> of {formatCalories(data.goal)} calories
          </p>
          <p className="text-sm text-gray-600">
            {data.entries} meal{data.entries !== 1 ? 's' : ''} logged
          </p>
          <p className={`text-sm font-medium ${data.goalMet ? 'text-green-600' : 'text-red-600'}`}>
            {data.goalMet ? '✓ Goal Met' : `${Math.round(data.percentage)}% of goal`}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
    onDateSelect(date);
  };



  const getTrendDirection = () => {
    if (weeklyData.length < 2) return null;
    
    const firstHalf = weeklyData.slice(0, Math.ceil(weeklyData.length / 2));
    const secondHalf = weeklyData.slice(Math.floor(weeklyData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, day) => sum + day.totalCalories, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.totalCalories, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    const percentChange = Math.abs(difference / firstAvg * 100);
    
    if (percentChange < 5) return { direction: 'stable', change: percentChange };
    return { 
      direction: difference > 0 ? 'increasing' : 'decreasing', 
      change: percentChange 
    };
  };

  const trend = getTrendDirection();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Weekly History & Trends
        </h2>
        <p className="text-gray-600">
          Your calorie intake over the past 7 days
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">
            {formatCalories(weeklyAverage)}
          </div>
          <div className="text-sm text-gray-600">Daily Average</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">
            {formatCalories(totalCalories)}
          </div>
          <div className="text-sm text-gray-600">Weekly Total</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">
            {Math.round(goalAchievementRate)}%
          </div>
          <div className="text-sm text-gray-600">Goal Achievement</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-900">
            {daysWithGoalMet}/7
          </div>
          <div className="text-sm text-gray-600">Goals Met</div>
        </div>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Trend</h3>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              trend.direction === 'increasing' ? 'bg-red-50 text-red-700' :
              trend.direction === 'decreasing' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {trend.direction === 'increasing' ? <TrendingUp className="w-4 h-4" /> : 
               trend.direction === 'decreasing' ? <TrendingDown className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              <span>
                {trend.direction === 'stable' ? 'Stable' :
                 trend.direction === 'increasing' ? `+${Math.round(trend.change)}%` :
                 `-${Math.round(trend.change)}%`}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {trend.direction === 'stable' ? 
              'Your calorie intake has been consistent this week.' :
              trend.direction === 'increasing' ?
              'Your calorie intake has been trending upward this week.' :
              'Your calorie intake has been trending downward this week.'}
          </p>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <Button
            onClick={() => setViewMode('chart')}
            variant={viewMode === 'chart' ? 'default' : 'ghost'}
            size="sm"
            className={`px-4 py-2 rounded-md font-medium transition-colors gap-2 ${
              viewMode === 'chart' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Chart View
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`px-4 py-2 rounded-md font-medium transition-colors gap-2 ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </Button>
        </div>

        {/* Chart Type Toggle (only show in chart view) */}
        {viewMode === 'chart' && weeklyData.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <Button
              onClick={() => setChartType('bar')}
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-2 rounded-md font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </Button>
            <Button
              onClick={() => setChartType('line')}
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-2 rounded-md font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </Button>
            <Button
              onClick={() => setChartType('area')}
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-2 rounded-md font-medium transition-colors ${
                chartType === 'area' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </Button>
          </div>
        )}
      </div>

      {viewMode === 'chart' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Calorie Intake</h3>
            {weeklyData.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="w-4 h-4" />
                <span>Goal: {formatCalories(weeklyData[0]?.goalCalories || 2000)}</span>
              </div>
            )}
          </div>
          
          {weeklyData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No data available for the past week</p>
              <p className="text-sm text-gray-500 mt-1">Start logging meals to see your trends!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `${Math.round(value / 100)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine 
                        y={weeklyAverage} 
                        stroke="#8b5cf6" 
                        strokeDasharray="5 5" 
                        label={{ value: "Average", position: "top" }}
                      />
                      <Bar 
                        dataKey="calories" 
                        radius={[4, 4, 0, 0]}
                        onClick={(data: { payload?: { date: string } }) => data.payload?.date && handleDateClick(data.payload.date)}
                        style={{ cursor: 'pointer' }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `${Math.round(value / 100)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine 
                        y={weeklyAverage} 
                        stroke="#8b5cf6" 
                        strokeDasharray="5 5" 
                        label={{ value: "Average", position: "top" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="goal" 
                        stroke="#6b7280" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `${Math.round(value / 100)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine 
                        y={weeklyAverage} 
                        stroke="#8b5cf6" 
                        strokeDasharray="5 5" 
                        label={{ value: "Average", position: "top" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#3b82f6" 
                        fill="url(#colorCalories)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Goal Met ({daysWithGoalMet} days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Close to Goal (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>Below Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 border-t-2 border-dashed border-purple-500"></div>
                  <span>Weekly Average</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.round(goalAchievementRate)}%
                  </div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {Math.max(...chartData.map(d => d.calories)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Highest Day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {Math.min(...chartData.map(d => d.calories)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Lowest Day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {chartData.reduce((sum, d) => sum + d.entries, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Meals</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
          
          {weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No meals logged this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyData.map((day) => (
                <div
                  key={day.date}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm ${
                    selectedDate === day.date ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">
                          {dateUtils.formatDisplayDate(day.date)}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          day.goalMet ? 'bg-green-100 text-green-800' :
                          day.totalCalories >= day.goalCalories * 0.8 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {day.goalMet ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Goal Met
                            </span>
                          ) : 
                           day.totalCalories >= day.goalCalories * 0.8 ? 'Close' : 'Below Goal'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {day.entries.length} meal{day.entries.length !== 1 ? 's' : ''} logged
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCalories(day.totalCalories)}
                      </div>
                      <div className="text-sm text-gray-600">
                        of {formatCalories(day.goalCalories)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedDate === day.date && day.entries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        {day.entries.map((entry) => (
                          <div key={entry.id} className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {entry.foods.length === 1 
                                  ? entry.foods[0].name 
                                  : `${entry.foods.length} items`}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(entry.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <span className="text-sm text-gray-700">
                              {formatCalories(entry.totalCalories)} cal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}