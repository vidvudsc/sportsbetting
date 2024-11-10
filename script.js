import { database, ref, push, set, onValue } from './firebase-config.js';

let balance = 5;  // Initial starting balance of €5
let wins = 0;
let losses = 0;
let totalWagered = 0;
let profit = 0;
let profitChart;
let dailyWinsChart;

// Initialize Charts
function setupChart() {
    const ctxProfit = document.getElementById('profitChart').getContext('2d');
    profitChart = new Chart(ctxProfit, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit over Time',
                data: [],
                fill: false,
                borderColor: 'darkblue',
                tension: 0.1
            }]
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
                backgroundColor: 'green',
                borderWidth: 1
            }]
        }
    });
}

// Add a new bet and update Firebase
function addBet() {
    const date = document.getElementById('date').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const odds = parseFloat(document.getElementById('odds').value);
    const result = document.getElementById('result').value;

    let netProfit = 0;
    if (result === "win") {
        netProfit = amount * (odds - 1);  // Calculate net profit for this bet
    }

    // Save the bet to Firebase
    const newBet = { date, amount, odds, result, netProfit };
    const betRef = ref(database, 'bets');
    const newBetRef = push(betRef);
    set(newBetRef, newBet);

    resetForm();
    updateChart();
}

window.addBet = addBet;  // Ensure `addBet` is globally accessible

// Reset the form
function resetForm() {
    document.getElementById('betForm').reset();
}

// Save stats to Firebase
function saveStats() {
    const statsRef = ref(database, 'stats');
    set(statsRef, {
        balance,
        wins,
        losses,
        totalWagered,
        profit
    });
}

// Load and calculate stats from Firebase
function loadStats() {
    const startingBalance = 5;  // Set your initial starting balance
    let cumulativeBalance = startingBalance;
    const dates = [];
    const profits = [];
    const dailyWinAmounts = {};

    const betRef = ref(database, 'bets');
    onValue(betRef, (snapshot) => {
        // Reset stats before recalculating
        wins = 0;
        losses = 0;
        profit = 0;
        totalWagered = 0;
        cumulativeBalance = startingBalance;
        let totalOdds = 0;

        let totalWinAmount = 0;

        snapshot.forEach((childSnapshot) => {
            const bet = childSnapshot.val();
            dates.push(bet.date);

            // Add odds to total
            totalOdds += parseFloat(bet.odds);

            // Subtract the bet amount from cumulative balance
            cumulativeBalance -= bet.amount;
            totalWagered += bet.amount;

            if (bet.result === "win") {
                wins++;
                let betProfit = bet.amount * (bet.odds - 1);  // Net profit for this bet
                profit += betProfit;
                totalWinAmount += betProfit;
                // Add the total winnings to cumulative balance
                cumulativeBalance += bet.amount * bet.odds;
                dailyWinAmounts[bet.date] = (dailyWinAmounts[bet.date] || 0) + betProfit;
            } else {
                losses++;
            }

            // Record the cumulative balance after each bet
            profits.push(cumulativeBalance);
        });

        // Update the balance with the cumulative balance
        balance = cumulativeBalance;

        // Save the updated stats to Firebase
        saveStats();

        // Update charts with the correct data
        profitChart.data.labels = dates;
        profitChart.data.datasets[0].data = profits;
        profitChart.update();

        dailyWinsChart.data.labels = Object.keys(dailyWinAmounts);
        dailyWinsChart.data.datasets[0].data = Object.values(dailyWinAmounts);
        dailyWinsChart.update();

        // Calculate average odds
        const avgOdds = (wins + losses) > 0 ? totalOdds / (wins + losses) : 0;
        
        // Update the stats displayed on the page
        updateStats();
        document.getElementById("avgOdds").innerText = avgOdds.toFixed(2);
    });
}

function updateStats() {
    document.getElementById("totalWins").innerText = wins;
    document.getElementById("totalLosses").innerText = losses;
    document.getElementById("winRate").innerText = ((wins / (wins + losses)) * 100).toFixed(2) + "%";
    document.getElementById("profit").innerText = profit.toFixed(2);
    document.getElementById("totalBets").innerText = wins + losses;
    document.getElementById("totalWagered").innerText = totalWagered.toFixed(2);
    document.getElementById("avgBetAmount").innerText = (totalWagered / (wins + losses)).toFixed(2);
    document.getElementById("currentBalance").innerText = balance.toFixed(2);
    document.getElementById("rainisCut").innerText = (balance * 0.1).toFixed(2);
    document.getElementById("avgWin").innerText = (wins > 0 ? (profit / wins).toFixed(2) : "0.00");
}

function updateChart() {
    loadStats();  // Load stats and chart data on each call to update the chart
}

window.onload = function() {
    setupChart();
    loadStats();
};
