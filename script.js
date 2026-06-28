// ==========================================
// 1. SELECTORS & CORE STATE CONFIGURATION
// ==========================================
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

const balanceDisplay = document.querySelector(".stat-card.balance .stat-amount");
const incomeDisplay = document.querySelector(".stat-card.income .stat-amount");
const expenseDisplay = document.querySelector(".stat-card.expenses .stat-amount");
const themeToggleBtn = document.querySelector("#theme-toggle");

// SPA Route References
const viewDashboard = document.querySelector("#view-dashboard");
const viewAnalytics = document.querySelector("#view-analytics");
const menuItems = document.querySelectorAll(".menu-item");

// Dynamic Memory Tokens
let currentUser = null;
let userDbKey = "";
let transactions = [];
let cashFlowChartInstance = null;
let categoryChartInstance = null;

// ==========================================
// 2. AUTHENTICATION SCREENS TOGGLE FLOW
// ==========================================
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

// ==========================================
// 3. REGISTRATION ENGINE (DATA STORAGE)
// ==========================================
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

// ==========================================
// 4. SIGN IN ENGINE & SESSIONS
// ==========================================
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
            errorMessage.textContent = "Account not found. Click register link above.";
        }
    });
}
login();

function checkAuthState() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        userDbKey = `transactions_${currentUser.userName}`;
        transactions = JSON.parse(localStorage.getItem(userDbKey)) || [];

        if (authScreenContainer) authScreenContainer.classList.add("hidden");
        if (loginPage) loginPage.classList.add("hidden");
        if (dashboardWrapper) dashboardWrapper.classList.remove("hidden");
        if (userDisplayName) userDisplayName.textContent = currentUser.userName;

        renderDashboard();
    } else {
        if (dashboardWrapper) dashboardWrapper.classList.add("hidden");
        if (authScreenContainer) authScreenContainer.classList.remove("hidden");
        if (loginPage) loginPage.classList.remove("hidden");
        if (loginBox) loginBox.classList.remove("hidden");
        if (registerBox) registerBox.classList.add("hidden");
    }
}

// ==========================================
// 5. DATA RENDERING & FILTERS
// ==========================================
function renderDashboard() {
    if (!ledgerTableRows) return;
    let totalIncome = 0;
    let totalExpenses = 0;
    let tableHTML = "";

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedType = typeFilter ? typeFilter.value : "all";

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    transactions.forEach((item, index) => {
        if (item.type === "income") totalIncome += item.amount;
        if (item.type === "expense") totalExpenses += item.amount;

        const matchesSearch = item.description.toLowerCase().includes(searchTerm) || 
                              item.category.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === "all" || item.type === selectedType;

        if (matchesSearch && matchesType) {
            const isIncome = item.type === "income";
            tableHTML += `
                <tr>
                    <td class="cell-date">${item.date}</td>
                    <td class="cell-desc">${item.description}</td>
                    <td><span class="category-pill">${item.category}</span></td>
                    <td class="cell-amount ${isIncome ? 'text-success' : 'text-danger'}">
                        ${isIncome ? '+' : '-'}$${item.amount.toFixed(2)}
                    </td>
                    <td class="cell-actions">
                        <button class="action-icon-btn delete-btn" onclick="deleteTransaction(${index})">🗑️</button>
                    </td>
                </tr>
            `;
        }
    });

    ledgerTableRows.innerHTML = tableHTML || `<tr><td colspan="5" class="empty-state">No matching transactions found.</td></tr>`;

    const totalBalance = totalIncome - totalExpenses;
    if (balanceDisplay) balanceDisplay.textContent = `$${totalBalance.toFixed(2)}`;
    if (incomeDisplay) incomeDisplay.textContent = `+$${totalIncome.toFixed(2)}`;
    if (expenseDisplay) expenseDisplay.textContent = `-$${totalExpenses.toFixed(2)}`;

    // Refresh active charts dynamically if analytics view is active
    if (viewAnalytics && !viewAnalytics.classList.contains("hidden")) {
        renderAnalyticsCharts();
    }
}

// ==========================================
// 6. TRANSACTION MUTATIONS (CRUD)
// ==========================================
if (transactionForm) {
    transactionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const type = document.querySelector("#biz-type").value;
        const description = document.querySelector("#biz-description").value.trim();
        const amount = parseFloat(document.querySelector("#biz-amount").value);
        const date = document.querySelector("#biz-date").value;
        const category = document.querySelector("#biz-category").value;

        if (!category || !date) {
            alert("Please provide a valid category and date.");
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid transactional amount greater than zero.");
            return;
        }

        const newTransaction = { type, description, amount, date, category };
        transactions.push(newTransaction);
        localStorage.setItem(userDbKey, JSON.stringify(transactions));
        
        renderDashboard();
        transactionForm.reset();

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

// ==========================================
// 7. CHART.JS VISUAL ENGINE GRAPHICS
// ==========================================
function renderAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#f8fafc" : "#0f172a";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";

    let incomeSum = 0;
    let expenseSum = 0;
    const categoriesMap = {};

    transactions.forEach(item => {
        if (item.type === "income") incomeSum += item.amount;
        if (item.type === "expense") {
            expenseSum += item.amount;
            categoriesMap[item.category] = (categoriesMap[item.category] || 0) + item.amount;
        }
    });

    // Chart 1: Bar Chart
    const ctxFlow = document.getElementById("cash-flow-chart");
    if (ctxFlow) {
        if (cashFlowChartInstance) cashFlowChartInstance.destroy();
        cashFlowChartInstance = new Chart(ctxFlow, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [incomeSum, expenseSum],
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

    // Chart 2: Doughnut Chart
    const ctxCat = document.getElementById("category-distribution-chart");
    if (ctxCat) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        const labels = Object.keys(categoriesMap);
        const data = Object.values(categoriesMap);

        categoryChartInstance = new Chart(ctxCat, {
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

// ==========================================
// 8. SPA VIEW PORTAL INTERACTION ROUTER
// ==========================================
menuItems.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        menuItems.forEach(item => item.classList.remove("active"));
        link.classList.add("active");

        const selection = link.textContent.trim().toLowerCase();

        // CONTROL ACCENT BUTTON PORTAL VISIBILITY
        if (selection === "dashboard") {
            if (toggleFormBtn) toggleFormBtn.classList.remove("hidden");
        } else {
            if (toggleFormBtn) toggleFormBtn.classList.add("hidden");
        }

        // CONTROL STRUCTURAL PANELS ROUTING NAVIGATION VIEWPORTS
        if (selection === "analytics") {
            viewDashboard.classList.add("hidden");
            viewAnalytics.classList.remove("hidden");
            renderAnalyticsCharts();
        } else if (selection === "dashboard") {
            viewAnalytics.classList.add("hidden");
            viewDashboard.classList.remove("hidden");
            renderDashboard();
        } else {
            // Fail-safe protection layer for generic empty tabs (Wallets / Settings)
            viewDashboard.classList.add("hidden");
            viewAnalytics.classList.add("hidden");
        }
    });
});

// Layout Toggles & Global Handlers
if (searchInput) searchInput.addEventListener("input", renderDashboard);
if (typeFilter) typeFilter.addEventListener("change", renderDashboard);

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
        transactions = [];
        checkAuthState();
    });
}

if (themeToggleBtn) {
    const activeTheme = localStorage.getItem("appTheme") || "dark";
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

// Initial Run Launch Command
checkAuthState();