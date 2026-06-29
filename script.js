// DOM Selectors
const toRegisterLink = document.querySelector("#to-register-link");
const toLoginLink = document.querySelector("#to-login-link");
const loginBox = document.querySelector("#login-box");
const registerBox = document.querySelector("#register-box");
const loginForm = document.querySelector("#login-form");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const errorMessage = document.querySelector("#error-message");

const registerUsername = document.querySelector("#register-username");
const passwordRegister = document.querySelector("#password-register");
const registerForm = document.querySelector("#register-form");
const registerError = document.querySelector("#register-error");

const loginPage = document.querySelector("#login-wrapper");
const authScreenContainer = document.querySelector(".screen-container"); 
const dashboardWrapper = document.querySelector("#dashboard-wrapper");
const userDisplayName = document.querySelector("#user-display-name");
const logoutBtn = document.querySelector("#logout-btn");

const toggleFormBtn = document.querySelector("#toggle-form-btn"); 
const formBox = document.querySelector(".transaction-form-box");
const coreLayout = document.querySelector(".dashboard-core-layout");
const transactionForm = document.querySelector("#transaction-form");
const ledgerTableRows = document.querySelector("#ledger-table-rows");

const searchInput = document.querySelector("#ledger-search");
const typeFilter = document.querySelector("#ledger-filter-type");
const ledgerWalletFilter = document.querySelector("#ledger-filter-wallet");
const analyticsWalletFilter = document.querySelector("#analytics-filter-wallet");

const balanceDisplay = document.querySelector(".stat-card.balance .stat-amount");
const incomeDisplay = document.querySelector(".stat-card.income .stat-amount");
const expenseDisplay = document.querySelector(".stat-card.expenses .stat-amount");
const themeToggleBtn = document.querySelector("#theme-toggle");

const viewDashboard = document.querySelector("#view-dashboard");
const viewAnalytics = document.querySelector("#view-analytics");
const viewWallets = document.querySelector("#view-wallets");
const viewSettings = document.querySelector("#view-settings");
const menuItems = document.querySelectorAll(".menu-item");

const walletSelectDropdown = document.querySelector("#biz-wallet");
const walletCreationForm = document.querySelector("#wallet-creation-form");
const walletsGridContainer = document.querySelector("#wallets-grid-container");

const settingsProfileForm = document.querySelector("#settings-profile-form");
const settingsUsernameInput = document.querySelector("#settings-username");
const settingsNewPasswordInput = document.querySelector("#settings-new-password");
const btnResetData = document.querySelector("#btn-reset-data");
const settingsCurrencySelect = document.querySelector("#settings-currency");

// App State
let currentUser = null;
let userDbKey = "";
let walletDbKey = "";
let transactions = [];
let wallets = [];
let cashFlowChartInstance = null;
let categoryChartInstance = null;

// Currency System Settings
let currentCurrencySymbol = "$"; 
const currencyIsoMap = {
    "$": "USD",
    "€": "EUR",
    "₹": "INR",
    "£": "GBP",
    "¥": "JPY",
    "₪": "ILS"
};
let exchangeRates = { "USD": 1 }; // Default fallback

// Fetch live exchange rates from API
async function fetchExchangeRates() {
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) throw new Error("Failed to reach exchange rate API.");
        const data = await response.json();
        if (data && data.rates) {
            exchangeRates = data.rates;
            console.log("Exchange rates updated successfully:", exchangeRates);
        }
    } catch (error) {
        console.error("Using fallback rates due to error:", error);
    }
}

function getConversionRate() {
    const targetIso = currencyIsoMap[currentCurrencySymbol] || "USD";
    return exchangeRates[targetIso] || 1;
}

// Toggle Login / Register Panels
if (toRegisterLink && toLoginLink) {
    toRegisterLink.addEventListener('click', (event) => {
        event.preventDefault();
        loginBox.classList.add("hidden");
        registerBox.classList.remove("hidden");
    });

    toLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        registerBox.classList.add("hidden");
        loginBox.classList.remove("hidden");
    });
}

// Show / Hide Password fields
const togglePasswordButtons = document.querySelectorAll(".toggle-password-link");
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); 
        const passwordInput = button.parentElement.querySelector("input");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            button.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            button.textContent = "Show";
        }
    });
});

// Handle User Registration
function registration() {
    if (!registerForm) return;
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const enterName = registerUsername.value.trim();
        const enterPassword = passwordRegister.value;
        registerError.textContent = "";

        const hasCapital = /[A-Z]/.test(enterPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(enterPassword);

        if (enterPassword.length < 8) {
            registerError.textContent = "Password must be at least 8 characters long.";
            return;
        }
        if (!hasCapital) {
            registerError.textContent = 'Password must include at least one capital letter.';
            return; 
        }
        if (!hasSpecial) {
            registerError.textContent = 'Password must include at least one special character (e.g., !, @, #, $).';
            return; 
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const usernameExists = users.some(user => user.userName.toLowerCase() === enterName.toLowerCase());

        if (usernameExists) {
            registerError.textContent = "Username is already taken! Try another one.";
            return; 
        }

        const accountData = { userName: enterName, userPassword: enterPassword };
        users.push(accountData);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Account Created successfully!');
        registerForm.reset();
        registerBox.classList.add("hidden");
        loginBox.classList.remove("hidden");
    });
}
registration();

// Handle User Sign In
function login() {
    if (!loginForm) return;
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const typeName = username.value;
        const typePassword = password.value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const matchedUser = users.find(user => user.userName === typeName && user.userPassword === typePassword);

        if (matchedUser) {
            alert("Login successful");
            localStorage.setItem('currentUser', JSON.stringify(matchedUser));
            checkAuthState();
        } else {
            errorMessage.textContent = "Account credentials mismatch. Try again.";
        }
    });
}
login();

// Check user session state and load keys
async function checkAuthState() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        userDbKey = `transactions_${currentUser.userName}`;
        walletDbKey = `wallets_${currentUser.userName}`;
        
        transactions = JSON.parse(localStorage.getItem(userDbKey)) || [];
        wallets = JSON.parse(localStorage.getItem(walletDbKey)) || [];

        // Fallback default wallet setup
        if (wallets.length === 0) {
            wallets.push({ id: "w-default", name: "Main Wallet", initialBalance: 0 });
            localStorage.setItem(walletDbKey, JSON.stringify(wallets));
        }

        if (authScreenContainer) authScreenContainer.classList.add("hidden");
        if (loginPage) loginPage.classList.add("hidden");
        if (dashboardWrapper) dashboardWrapper.classList.remove("hidden");
        if (userDisplayName) userDisplayName.textContent = currentUser.userName;
        if (settingsUsernameInput) settingsUsernameInput.value = currentUser.userName;

        currentCurrencySymbol = localStorage.getItem(`currency_${currentUser.userName}`) || "$";
        if (settingsCurrencySelect) settingsCurrencySelect.value = currentCurrencySymbol;

        // Fetch latest data before running table render calls
        await fetchExchangeRates();

        populateWalletDropdowns();
        renderDashboard();
    } else {
        if (dashboardWrapper) dashboardWrapper.classList.add("hidden");
        if (authScreenContainer) authScreenContainer.classList.remove("hidden");
        if (loginPage) loginPage.classList.remove("hidden");
        if (loginBox) loginBox.classList.remove("hidden");
        if (registerBox) registerBox.classList.add("hidden");
    }
}

// Render Core Dashboard Table and Statistics
function renderDashboard() {
    if (!ledgerTableRows) return;
    let totalIncome = 0;
    let totalExpenses = 0;
    let tableHTML = "";

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedType = typeFilter ? typeFilter.value : "all";
    const selectedWallet = ledgerWalletFilter ? ledgerWalletFilter.value : "all";

    const rate = getConversionRate();

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    transactions.forEach((item, index) => {
        const matchesWallet = selectedWallet === "all" || (item.walletId || "w-default") === selectedWallet;

        if (matchesWallet) {
            if (item.type === "income") totalIncome += item.amount;
            if (item.type === "expense") totalExpenses += item.amount;
        }

        const matchesSearch = item.description.toLowerCase().includes(searchTerm) || 
                              item.category.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === "all" || item.type === selectedType;

        if (matchesWallet && matchesSearch && matchesType) {
            const isIncome = item.type === "income";
            const displayAmount = item.amount * rate;

            tableHTML += `
                <tr>
                    <td class="cell-date">${item.date}</td>
                    <td class="cell-desc">${item.description}</td>
                    <td><span class="category-pill">${item.category}</span></td>
                    <td class="cell-amount ${isIncome ? 'text-success' : 'text-danger'}">
                        ${isIncome ? '+' : '-'}${currentCurrencySymbol}${displayAmount.toFixed(2)}
                    </td>
                    <td class="cell-actions">
                        <button class="action-icon-btn delete-btn" onclick="deleteTransaction(${index})">🗑️</button>
                    </td>
                </tr>
            `;
        }
    });

    ledgerTableRows.innerHTML = tableHTML || `<tr><td colspan="5" class="empty-state">No matching transactions found.</td></tr>`;

    // Process summary values for calculation indicators
    const convertedIncome = totalIncome * rate;
    const convertedExpenses = totalExpenses * rate;
    const totalBalance = convertedIncome - convertedExpenses;
    const balanceSign = totalBalance < 0 ? "-" : "";

    if (balanceDisplay) balanceDisplay.textContent = `${balanceSign}${currentCurrencySymbol}${Math.abs(totalBalance).toFixed(2)}`;
    if (incomeDisplay) incomeDisplay.textContent = `+${currentCurrencySymbol}${convertedIncome.toFixed(2)}`;
    if (expenseDisplay) expenseDisplay.textContent = `-${currentCurrencySymbol}${convertedExpenses.toFixed(2)}`;

    if (viewAnalytics && !viewAnalytics.classList.contains("hidden")) renderAnalyticsCharts();
    if (viewWallets && !viewWallets.classList.contains("hidden")) renderWalletsPage();
}

// Populate Wallet Management Dropdown Filters
function populateWalletDropdowns() {
    if (!walletSelectDropdown) return;
    
    let formOptions = "";
    wallets.forEach(w => {
        formOptions += `<option value="${w.id}">${w.name}</option>`;
    });
    walletSelectDropdown.innerHTML = formOptions;

    if (ledgerWalletFilter) {
        const currentSel = ledgerWalletFilter.value || "all";
        let ledgerOptions = `<option value="all">All Wallets</option>`;
        wallets.forEach(w => {
            ledgerOptions += `<option value="${w.id}">${w.name}</option>`;
        });
        ledgerWalletFilter.innerHTML = ledgerOptions;
        ledgerWalletFilter.value = currentSel;
    }

    if (analyticsWalletFilter) {
        const currentSel = analyticsWalletFilter.value || "all";
        let analyticsOptions = `<option value="all">All Wallets</option>`;
        wallets.forEach(w => {
            analyticsOptions += `<option value="${w.id}">${w.name}</option>`;
        });
        analyticsWalletFilter.innerHTML = analyticsOptions;
        analyticsWalletFilter.value = currentSel;
    }
}

// Add New Transaction Action
if (transactionForm) {
    transactionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const type = document.querySelector("#biz-type").value;
        const description = document.querySelector("#biz-description").value.trim();
        const amountRaw = parseFloat(document.querySelector("#biz-amount").value);
        const date = document.querySelector("#biz-date").value;
        const category = document.querySelector("#biz-category").value;
        const walletId = document.querySelector("#biz-wallet").value;

        if (!category || !date) {
            alert("Please provide a valid category and date.");
            return;
        }
        if (isNaN(amountRaw) || amountRaw <= 0) {
            alert("Please enter a valid transactional amount greater than zero.");
            return;
        }

        // Standardize currency value to USD baseline structure before persistent saving
        const rate = getConversionRate();
        const amountInUSD = amountRaw / rate;

        const newTransaction = { type, description, amount: amountInUSD, date, category, walletId };
        transactions.push(newTransaction);
        localStorage.setItem(userDbKey, JSON.stringify(transactions));
        
        renderDashboard();
        transactionForm.reset();
        populateWalletDropdowns(); 

        if (formBox && !formBox.classList.contains("hidden")) {
            formBox.classList.add("hidden");
            coreLayout.classList.add("form-hidden");
            if (toggleFormBtn) toggleFormBtn.textContent = "+ New Transaction";
        }
    });
}

window.deleteTransaction = function(index) {
    if (confirm("Are you sure you want to drop this transaction record?")) {
        transactions.splice(index, 1);
        localStorage.setItem(userDbKey, JSON.stringify(transactions));
        renderDashboard();
    }
};

// Render Wallets Page Layout UI
function renderWalletsPage() {
    if (!walletsGridContainer) return;

    const rate = getConversionRate();
    const walletBalances = {};
    
    wallets.forEach(w => {
        walletBalances[w.id] = parseFloat(w.initialBalance) || 0;
    });

    transactions.forEach(t => {
        const targetWalletId = t.walletId || "w-default";
        if (walletBalances[targetWalletId] !== undefined) {
            if (t.type === "income") walletBalances[targetWalletId] += t.amount;
            if (t.type === "expense") walletBalances[targetWalletId] -= t.amount;
        }
    });

    let walletsHTML = "";
    wallets.forEach(w => {
        const currentBalance = (walletBalances[w.id] || 0) * rate;
        const displayInitial = (parseFloat(w.initialBalance) || 0) * rate;

        walletsHTML += `
            <div class="credit-card-ui">
                <div>
                    <p class="card-meta-title">${w.name}</p>
                    <p class="card-live-balance">${currentBalance < 0 ? '-' : ''}${currentCurrencySymbol}${Math.abs(currentBalance).toFixed(2)}</p>
                </div>
                <div class="card-footer-layout">
                    <span>Initial Deposit: ${currentCurrencySymbol}${displayInitial.toFixed(2)}</span>
                    ${w.id !== 'w-default' ? `<button class="action-icon-btn" onclick="deleteWallet('${w.id}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
    });

    walletsGridContainer.innerHTML = walletsHTML || `<p class="empty-state">No wallets loaded.</p>`;
}

// Create New Wallet Link
if (walletCreationForm) {
    walletCreationForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.querySelector("#wallet-name").value.trim();
        const initialBalanceRaw = parseFloat(document.querySelector("#wallet-initial").value) || 0;

        // Convert balance back to USD before saving
        const rate = getConversionRate();
        const initialBalanceInUSD = initialBalanceRaw / rate;

        wallets.push({ id: "w-" + Date.now(), name, initialBalance: initialBalanceInUSD });
        localStorage.setItem(walletDbKey, JSON.stringify(wallets));
        
        walletCreationForm.reset();
        populateWalletDropdowns();
        renderWalletsPage();
    });
}

window.deleteWallet = function(id) {
    if (confirm("Are you sure you want to delete this wallet? This will permanently erase the account and ALL transactions linked to it!")) {
        wallets = wallets.filter(w => w.id !== id);
        localStorage.setItem(walletDbKey, JSON.stringify(wallets));
        
        transactions = transactions.filter(t => (t.walletId || "w-default") !== id);
        localStorage.setItem(userDbKey, JSON.stringify(transactions));

        populateWalletDropdowns();
        renderWalletsPage();
        renderDashboard();
    }
};

// Generate Chart.js Canvas Analytics Graphics
function renderAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#f8fafc" : "#0f172a";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";

    const selectedWallet = analyticsWalletFilter ? analyticsWalletFilter.value : "all";

    let barIncome = 0;
    let barExpense = 0;
    const catMap = {};

    transactions.forEach(item => {
        const matchesWallet = selectedWallet === "all" || (item.walletId || "w-default") === selectedWallet;
        if (!matchesWallet) return;

        if (item.type === "income") barIncome += item.amount;
        if (item.type === "expense") {
            barExpense += item.amount;
            catMap[item.category] = (catMap[item.category] || 0) + item.amount;
        }
    });

    const rate = getConversionRate();
    const finalChartIncome = barIncome * rate;
    const finalChartExpense = barExpense * rate;

    const ctx1 = document.getElementById("cash-flow-chart");
    if (ctx1) {
        if (cashFlowChartInstance) cashFlowChartInstance.destroy();
        cashFlowChartInstance = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [finalChartIncome, finalChartExpense],
                    backgroundColor: [isDark ? '#34d399' : '#10b981', isDark ? '#f87171' : '#ef4444'],
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } }
                }
            }
        });
    }

    const ctx2 = document.getElementById("category-distribution-chart");
    if (ctx2) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        
        const labels = Object.keys(catMap);
        const data = Object.values(catMap).map(val => val * rate);

        categoryChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ["No Expenses"],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: labels.length ? ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899"] : [gridColor],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: textColor } } },
                cutout: '70%'
            }
        });
    }
}

// Tab Routes View Router Layout
menuItems.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        menuItems.forEach(item => item.classList.remove("active"));
        link.classList.add("active");

        const selection = link.textContent.trim().toLowerCase();
        
        if (selection === "dashboard") {
            if (toggleFormBtn) toggleFormBtn.classList.remove("hidden");
        } else {
            if (toggleFormBtn) toggleFormBtn.classList.add("hidden");
        }

        viewDashboard.classList.add("hidden");
        viewAnalytics.classList.add("hidden");
        if (viewWallets) viewWallets.classList.add("hidden");
        if (viewSettings) viewSettings.classList.add("hidden");

        if (selection === "analytics") {
            viewAnalytics.classList.remove("hidden");
            renderAnalyticsCharts();
        } else if (selection === "dashboard") {
            viewDashboard.classList.remove("hidden");
            renderDashboard();
        } else if (selection === "wallets") {
            if (viewWallets) viewWallets.classList.remove("hidden");
            renderWalletsPage();
        } else if (selection === "settings") {
            if (viewSettings) viewSettings.classList.remove("hidden");
            if (settingsNewPasswordInput) settingsNewPasswordInput.value = "";
        }
    });
});

// Settings Management Control Actions Form Submit
if (settingsProfileForm) {
    settingsProfileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newUsername = settingsUsernameInput.value.trim();
        const newPassword = settingsNewPasswordInput.value;
        const selectedCurrency = settingsCurrencySelect ? settingsCurrencySelect.value : "$";

        if (!newUsername) {
            alert("Username cannot be empty.");
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const oldUsername = currentUser.userName;
        let usernameChanged = (newUsername !== oldUsername);

        if (usernameChanged) {
            const nameExists = users.some(u => u.userName.toLowerCase() === newUsername.toLowerCase());
            if (nameExists) {
                alert("This username is already taken! Please choose another one.");
                return;
            }
        }

        const userIndex = users.findIndex(u => u.userName === oldUsername);
        if (userIndex === -1) {
            alert("User error. Could not locate profile registry data.");
            return;
        }

        if (newPassword) {
            if (newPassword.length < 8) {
                alert("Password must be at least 8 characters long.");
                return;
            }
            const hasCapital = /[A-Z]/.test(newPassword);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(newPassword);

            if (!hasCapital || !hasSpecial) {
                alert("Password must include at least one capital letter and one special character.");
                return;
            }
            users[userIndex].userPassword = newPassword;
            currentUser.userPassword = newPassword;
        }

        // Migrate keys if the username changes
        if (usernameChanged) {
            users[userIndex].userName = newUsername;

            const oldTransKey = userDbKey;
            const oldWalletKey = walletDbKey;
            const oldCurrencyKey = `currency_${oldUsername}`;

            const newTransDbKey = `transactions_${newUsername}`;
            const newWalletDbKey = `wallets_${newUsername}`;

            localStorage.setItem(newTransDbKey, JSON.stringify(transactions));
            localStorage.setItem(newWalletDbKey, JSON.stringify(wallets));

            localStorage.removeItem(oldTransKey);
            localStorage.removeItem(oldWalletKey);
            localStorage.removeItem(oldCurrencyKey);

            currentUser.userName = newUsername;
            userDbKey = newTransDbKey;
            walletDbKey = newWalletDbKey;

            if (userDisplayName) userDisplayName.textContent = newUsername;
        }

        // Update currency options
        localStorage.setItem(`currency_${currentUser.userName}`, selectedCurrency);
        currentCurrencySymbol = selectedCurrency;

        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        alert("Account profile configurations modified successfully!");
        if (settingsNewPasswordInput) settingsNewPasswordInput.value = "";

        populateWalletDropdowns();
        renderDashboard();
    });
}

// Master Reset Account Trigger Action Command 
if (btnResetData) {
    btnResetData.addEventListener("click", () => {
        if (confirm("CRITICAL WARNING: Are you certain you want to purge all active financials records and custom wallets? This operational path cannot be undone!")) {
            localStorage.removeItem(userDbKey);
            localStorage.removeItem(walletDbKey);

            transactions = [];
            wallets = [{ id: "w-default", name: "Main Wallet", initialBalance: 0 }];
            localStorage.setItem(walletDbKey, JSON.stringify(wallets));

            populateWalletDropdowns();
            renderDashboard();

            alert("All account databases, operations cards, and flow metrics charts cleared back to base zero!");

            const dashTab = Array.from(menuItems).find(item => item.textContent.trim().toLowerCase().includes('dashboard'));
            if (dashTab) dashTab.click();
        }
    });
}

// Dynamic Filter Search Input Listeners
if (searchInput) searchInput.addEventListener("input", renderDashboard);
if (typeFilter) typeFilter.addEventListener("change", renderDashboard);
if (ledgerWalletFilter) ledgerWalletFilter.addEventListener("change", renderDashboard);
if (analyticsWalletFilter) analyticsWalletFilter.addEventListener("change", renderAnalyticsCharts);

if (toggleFormBtn) {
    toggleFormBtn.addEventListener("click", () => {
        formBox.classList.toggle("hidden");
        coreLayout.classList.toggle("form-hidden");
        toggleFormBtn.textContent = formBox.classList.contains("hidden") ? "+ New Transaction" : "✕ Close Form";
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        currentUser = null;
        userDbKey = "";
        walletDbKey = "";
        transactions = [];
        wallets = [];
        checkAuthState();
    });
}

// Light and Dark Mode Themes Selection Switches
if (themeToggleBtn) {
    const activeTheme = localStorage.getItem("appTheme") || "light";
    if (activeTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggleBtn.textContent = "☀️ Light Mode";
    }
    themeToggleBtn.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("appTheme", "light");
            themeToggleBtn.textContent = "🌙 Dark Mode";
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("appTheme", "dark");
            themeToggleBtn.textContent = "☀️ Light Mode";
        }
        if (!viewAnalytics.classList.contains("hidden")) renderAnalyticsCharts();
    });
}

// Initialize Application Check Initialization
checkAuthState();