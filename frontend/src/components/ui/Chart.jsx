import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function LineChart({ data, title, color = '#3A7D44' }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1C1C1C',
        bodyColor: '#4F5B50',
        borderColor: '#E6EDE4',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#F3F4F6',
          borderDash: [4, 4],
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 2,
        borderColor: color,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, `${color}33`); // 20% opacity
          gradient.addColorStop(1, `${color}00`); // 0% opacity
          return gradient;
        },
      },
      point: {
        radius: 0,
        hoverRadius: 4,
        backgroundColor: color,
      }
    },
  };

  return <Line options={options} data={data} />;
}
