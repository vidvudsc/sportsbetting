import { database, ref, push, set, onValue } from './firebase-config.js';

// Global variables
let balance = 5;  // Initial starting balance of €5
let wins = 0;
let losses = 0;
let totalWagered = 0;
let profit = 0;
let profitChart;
let dailyWinsChart;
let betTypesChart;
let dayOfWeekChart;
let betTypeProfits = {};
let totalBetAmount = 0;
let totalBets = 0;

// Initialize all charts
function setupCharts() {
    const ctxProfit = document.getElementById('profitChart').getContext('2d');
    profitChart = new Chart(ctxProfit, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Balance over Time',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Profit Progression'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Profit (€)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    const ctxDailyWins = document.getElementById('dailyWinsChart').getContext('2d');
    dailyWinsChart = new Chart(ctxDailyWins, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Win Amount',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Wins'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (€)'
                    }
                }
            }
        }
    });

    const ctxBetTypes = document.getElementById('betTypesChart').getContext('2d');
    betTypesChart = new Chart(ctxBetTypes, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit by Bet Type',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Profit by Bet Type'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Profit (€)'
                    }
                }
            }
        }
    });

    const ctxDayOfWeek = document.getElementById('dayOfWeekChart').getContext('2d');
    dayOfWeekChart = new Chart(ctxDayOfWeek, {
        type: 'bar',
        data: {
            labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            datasets: [{
                label: 'Profit by Day of Week',
                data: Array(7).fill(0),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                borderColor: 'rgb(255, 159, 64)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Profit by Day of Week'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Profit (€)'
                    }
                }
            }
        }
    });
}

// Add new bet
function addBet() {
    const date = document.getElementById('date').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const odds = parseFloat(document.getElementById('odds').value);
    const result = document.getElementById('result').value;
    const betType = document.getElementById('betType').value;

    // Validate inputs
    if (!date || isNaN(amount) || isNaN(odds) || !result || !betType) {
        alert('Please fill in all fields correctly');
        return;
    }

    let netProfit = 0;
    if (result === "win") {
        netProfit = amount * (odds - 1);
        balance += netProfit;  // Add winnings to balance
    } else {
        netProfit = -amount;
        balance += netProfit;  // Subtract loss from balance
    }

    // Track profit per bet type
    if (!betTypeProfits[betType]) {
        betTypeProfits[betType] = 0;
    }
    betTypeProfits[betType] += netProfit;

    // Update counters
    totalBets++;
    totalBetAmount += amount;
    totalWagered += amount;
    profit += netProfit;

    if (result === "win") {
        wins++;
    } else {
        losses++;
    }

    // Save bet to Firebase
    const newBet = {
        date,
        amount,
        odds,
        result,
        betType,
        netProfit,
        balanceAfterBet: balance,
        timestamp: new Date().toISOString()
    };

    const betRef = ref(database, 'bets');
    const newBetRef = push(betRef);
    set(newBetRef, newBet)
        .then(() => {
            console.log('Bet saved successfully');
            resetForm();
        })
        .catch((error) => {
            console.error('Error saving bet:', error);
            alert('Error saving bet. Please try again.');
        });
}

// Reset form after submission
function resetForm() {
    document.getElementById('betForm').reset();
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
}

// Update statistics display
function updateStats() {
    const winRate = (wins + losses > 0) ? ((wins / (wins + losses)) * 100) : 0;
    const avgBetAmount = (wins + losses > 0) ? (totalWagered / (wins + losses)) : 0;
    const avgWin = (wins > 0) ? (profit / wins) : 0;
    const rainisCut = balance * 0.4;

    // Update DOM elements
    document.getElementById("totalWins").innerText = wins;
    document.getElementById("totalLosses").innerText = losses;
    document.getElementById("winRate").innerText = winRate.toFixed(2) + "%";
    document.getElementById("totalBets").innerText = wins + losses;
    document.getElementById("avgBetAmount").innerText = avgBetAmount.toFixed(2);
    document.getElementById("profit").innerText = profit.toFixed(2);
    document.getElementById("totalWagered").innerText = totalWagered.toFixed(2);
    document.getElementById("currentBalance").innerText = balance.toFixed(2);
    document.getElementById("rainisCut").innerText = rainisCut.toFixed(2);
    document.getElementById("avgWin").innerText = avgWin.toFixed(2);

    // Update profit per bet type
    updateBetTypeProfitDisplay();
}

// Display profit by bet type
function updateBetTypeProfitDisplay() {
    const betTypeStats = Object.entries(betTypeProfits)
        .map(([type, profit]) => `${type}: €${profit.toFixed(2)}`)
        .join(", ");
    document.getElementById("betTypeProfits").innerText = betTypeStats || "No Data";
}

// Load and calculate stats from Firebase
function loadStats() {
    const startingBalance = 5;  // Initial balance
    let cumulativeBalance = startingBalance;
    const dates = [];
    const profits = [];
    const dailyWinAmounts = {};
    const dayOfWeekProfits = Array(7).fill(0);
    const dailyResults = {};  // New object to track daily wins and losses

    // Reset all statistics
    wins = 0;
    losses = 0;
    totalWagered = 0;
    profit = 0;
    totalBets = 0;
    totalBetAmount = 0;
    betTypeProfits = {};

    const betRef = ref(database, 'bets');
    onValue(betRef, (snapshot) => {
        // Convert snapshot to array and sort by date
        const bets = [];
        snapshot.forEach((childSnapshot) => {
            bets.push({
                ...childSnapshot.val(),
                key: childSnapshot.key
            });
        });

        bets.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Process sorted bets
        bets.forEach((bet) => {
            dates.push(bet.date);
            
            // Update cumulative balance
            if (bet.result === "win") {
                cumulativeBalance += bet.amount * (bet.odds - 1);
                wins++;
                dailyWinAmounts[bet.date] = (dailyWinAmounts[bet.date] || 0) + (bet.amount * (bet.odds - 1));
            } else {
                cumulativeBalance -= bet.amount;
                losses++;
            }

            profits.push(cumulativeBalance);
            totalWagered += bet.amount;

            // Update day of week profits
            const betDate = new Date(bet.date);
            const dayOfWeek = betDate.getDay();
            if (bet.result === "win") {
                dayOfWeekProfits[dayOfWeek] += bet.amount * (bet.odds - 1);
            } else {
                dayOfWeekProfits[dayOfWeek] -= bet.amount;
            }

            // Update bet type profits
            if (!betTypeProfits[bet.betType]) {
                betTypeProfits[bet.betType] = 0;
            }
            if (bet.result === "win") {
                betTypeProfits[bet.betType] += bet.amount * (bet.odds - 1);
            } else {
                betTypeProfits[bet.betType] -= bet.amount;
            }

            totalBets++;
            totalBetAmount += bet.amount;

            // Update daily results
            if (!dailyResults[bet.date]) {
                dailyResults[bet.date] = { win: 0, loss: 0 };
            }
            if (bet.result === "win") {
                dailyResults[bet.date].win += bet.amount * (bet.odds - 1);
            } else {
                dailyResults[bet.date].loss -= bet.amount;
            }
        });

        // Update final balance and profit
        balance = cumulativeBalance;
        profit = cumulativeBalance - startingBalance;

        // Update UI
        updateChartsWithNewData(dates, profits, dailyResults, dayOfWeekProfits);
        updateStats();
        updateBetTypeProfitDisplay();
    });
}

// Update all charts with new data
function updateChartsWithNewData(dates, profits, dailyResults, dayOfWeekProfits) {
    // Update Profit Chart
    profitChart.data.labels = dates;
    profitChart.data.datasets[0].data = profits;
    profitChart.update();

    // Update Daily Wins Chart
    dailyWinsChart.data.labels = Object.keys(dailyResults);
    dailyWinsChart.data.datasets = [
        {
            label: 'Daily Wins',
            data: Object.values(dailyResults).map(result => result.win),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
        },
        {
            label: 'Daily Losses',
            data: Object.values(dailyResults).map(result => result.loss),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
        }
    ];
    dailyWinsChart.update();

    // Update Bet Types Chart
    betTypesChart.data.labels = Object.keys(betTypeProfits);
    betTypesChart.data.datasets[0].data = Object.values(betTypeProfits);
    betTypesChart.update();

    // Update Day of Week Chart
    dayOfWeekChart.data.datasets[0].data = dayOfWeekProfits;
    dayOfWeekChart.update();
}

// Initialize date input to today's date
function initializeDateInput() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

// Event listeners and initialization
window.onload = function() {
    setupCharts();
    initializeDateInput();
    loadStats();
};

// Make functions globally available
window.addBet = addBet;
window.resetForm = resetForm;