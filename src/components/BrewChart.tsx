import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { BrewRecipe } from '../utils/suggestions';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface BrewChartProps {
  recipe: BrewRecipe;
  height?: string;
  disableAnimation?: boolean;
}

export const BrewChart: React.FC<BrewChartProps> = ({ recipe, height = '200px', disableAnimation = false }) => {
  const generateChartData = (r: BrewRecipe) => {
    let accTime = 0;
    let accWeight = 0;
    
    const labels = [0];
    const data = [0];

    r.steps.forEach(step => {
      accTime += step.duration;
      accWeight = step.targetWeight;
      labels.push(accTime);
      data.push(accWeight);
    });

    return {
      labels: labels.map(s => `${s}s`),
      datasets: [
        {
          label: 'Water Poured (g)',
          data,
          fill: true,
          borderColor: 'rgba(212, 163, 115, 1)',
          backgroundColor: 'rgba(212, 163, 115, 0.2)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(212, 163, 115, 1)',
        }
      ]
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: disableAnimation ? false : { duration: 400 },
    plugins: { tooltip: { enabled: true }, legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Line data={generateChartData(recipe)} options={chartOptions} />
    </div>
  );
};
