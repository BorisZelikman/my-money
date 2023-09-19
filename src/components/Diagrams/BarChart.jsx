import React, { useEffect, useRef } from 'react';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register controllers, elements, and scales with Chart.js
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

//Example data for prop: { 'January': { expense: 100, income: 200 }, 'February': { expense: 200, income: 300 }, 'March': { expense: 150, income: 250 } }
const BarChart = ({ data }) => {
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

        // Extract labels (months) and data (expenses and income)
        const labels = Object.keys(data);
        const expenses = labels.map(label => data[label].expense);
        const income = labels.map(label => data[label].income);

        // Create a new chart instance and store it in useRef
        // The 'bar' type is used for a bar chart
        chartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Expenses',
                        data: expenses,
                        backgroundColor: '#e74c3c'
                    },
                    {
                        label: 'Income',
                        data: income,
                        backgroundColor: '#3498db'
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: 'black'  // Legend labels
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Expenses and Income',
                        color: 'black'  // Chart title
                    },
                    tooltip: {
                        titleColor: 'white',  // Tooltip title
                        bodyColor: 'white'    // Tooltip body
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: 'black'  // x-axis labels
                        },
                        grid: {
                            color: 'black'  // x-axis grid lines
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'black'  // y-axis labels
                        },
                        grid: {
                            color: 'black'  // y-axis grid lines
                        }
                    }
                }
            }
        });
    }, [data]);

    return (
        <div style={{ width: '600px', height: '400px' }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default BarChart;
