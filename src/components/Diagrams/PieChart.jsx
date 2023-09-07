import React, { useEffect, useRef } from 'react';
import { Chart, PieController, CategoryScale, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register controllers, elements, and scales with Chart.js
Chart.register(PieController, CategoryScale, ArcElement, Title, Tooltip, Legend);

// example data for prop: { 'Food': 100, 'Rent': 200, 'Gas': 50, 'Entertainment': 150, 'Other': 75 }
const PieChart = ({ categories }) => {
    // Create references for the canvas and the chart instance
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    useEffect(() => {
        // Get the 2D rendering context for the canvas
        const ctx = chartRef.current.getContext('2d');
        // Destroy the previous chart instance if it exists
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        // Extract labels (categories) and data (values)
        const labels = Object.keys(categories);
        const data = Object.values(categories);

        // Create a new chart instance and store it in useRef
        chartInstanceRef.current = new Chart(ctx, {
            type: 'pie', // The 'pie' type is used for a pie chart
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['red', 'blue', 'green', 'yellow', 'purple']
                }]
            }
        });
    }, [categories]);

    return (
        <div style={{ width: '400px', height: '400px' }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default PieChart;
