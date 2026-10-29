
const PRICE_PER_KG = 50;
const WASH_TIME = 30;
const DRY_TIME = 15;
const FOLD_TIME = 15;

let users = JSON.parse(localStorage.getItem("fw_users")) || [];
let orders = JSON.parse(localStorage.getItem("fw_orders")) || [];
let machines = JSON.parse(localStorage.getItem("fw_machines")) || [];

let currentUser = null;
let registerMode = false;

// Create 10 machines if they do not exist
if (machines.length !== 10) {
    machines = [];

    for (let i = 1; i <= 10; i++) {
        machines.push({
            id: i,
            status: "Available",
            orderId: null
        });
    }
}

function saveData() {
    localStorage.setItem("fw_users", JSON.stringify(users));
    localStorage.setItem("fw_orders", JSON.stringify(orders));
    localStorage.setItem("fw_machines", JSON.stringify(machines));
}

// Switch between login and registration
function showRegister() {
    registerMode = !registerMode;

    const loginTitle = document.getElementById("loginTitle");
    const loginDescription = document.getElementById("loginDescription");
    const loginButton = document.getElementById("loginButton");
    const registerPrompt = document.getElementById("registerPrompt");
    const loginRole = document.getElementById("loginRole");
    const loginMessage = document.getElementById("loginMessage");
    const loginPassword = document.getElementById("loginPassword");

    loginTitle.textContent = registerMode
        ? "Create Account"
        : "Welcome Back";

    loginDescription.textContent = registerMode
        ? "Create a customer account to use Wash Up."
        : "Log in to continue.";

    loginButton.textContent = registerMode
        ? "Register"
        : "Log In";

    registerPrompt.innerHTML = registerMode
        ? 'Already have an account? <a href="#" onclick="showRegister(); return false;">Log in</a>'
        : 'No account yet? <a href="#" onclick="showRegister(); return false;">Register here</a>';

    // Registration is only for customers
    loginRole.classList.toggle("hidden", registerMode);
    loginRole.value = "customer";

    loginMessage.textContent = "";
    loginPassword.value = "";
}

// Login and registration
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;
    const message = document.getElementById("loginMessage");

    message.textContent = "";

    // Register a new customer
    if (registerMode) {
        if (!username || !password) {
            message.textContent = "Please enter a username and password.";
            return;
        }

        if (username.toLowerCase() === "admin") {
            message.textContent = "Please choose another username.";
            return;
        }

        const existingUser = users.find(function(user) {
            return user.username.toLowerCase() === username.toLowerCase();
        });

        if (existingUser) {
            message.textContent = "Username already exists.";
            return;
        }

        users.push({
            username: username,
            password: password,
            role: "customer"
        });

        saveData();

        showRegister();

        document.getElementById("loginUsername").value = username;
        document.getElementById("loginMessage").textContent =
            "Account created successfully. You can now log in.";

        return;
    }

    // Admin login
    if (role === "admin") {
        if (username !== "admin" || password !== "admin123") {
            message.textContent = "Invalid admin username or password.";
            return;
        }

        currentUser = {
            username: "admin",
            role: "admin"
        };

    } else {
        // Customer login
        const user = users.find(function(u) {
            return u.username === username &&
                   u.password === password &&
                   u.role === "customer";
        });

        if (!user) {
            message.textContent = "Incorrect username or password.";
            return;
        }

        currentUser = user;
    }

    // Open the application
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("appView").classList.remove("hidden");

    document.getElementById("currentUsername").textContent =
        currentUser.username;

    document.getElementById("roleLabel").textContent =
        currentUser.role === "admin" ? "Administrator" : "Customer";

    document.getElementById("profileCircle").textContent =
        currentUser.username.charAt(0).toUpperCase();

    document.getElementById("loginMessage").textContent = "";

    openDashboard();
});

// Log out
function logout() {
    currentUser = null;

    document.getElementById("appView").classList.add("hidden");
    document.getElementById("loginView").classList.remove("hidden");

    document.getElementById("loginForm").reset();
    document.getElementById("loginMessage").textContent = "";

    if (registerMode) {
        showRegister();
    }

    document.getElementById("loginTitle").textContent = "Welcome Back";
    document.getElementById("loginDescription").textContent =
        "Log in to continue.";
    document.getElementById("loginButton").textContent = "Log In";
}

// Set up the dashboard for the current user
function openDashboard() {
    if (!currentUser) return;

    const isAdmin = currentUser.role === "admin";

    document.getElementById("newOrderNav").classList.toggle("hidden", isAdmin);
    document.getElementById("queueNav").classList.toggle("hidden", !isAdmin);
    document.getElementById("dashboardOrderButton").classList.toggle("hidden", isAdmin);
    document.getElementById("startNextButton").classList.toggle("hidden", !isAdmin);

    document.getElementById("welcomeTitle").textContent =
        isAdmin ? "Laundry Shop Overview" : "Laundry Day, Made Easy.";

    document.getElementById("welcomeText").textContent =
        isAdmin
            ? "Monitor machines and manage laundry orders."
            : "Place an order and track your laundry.";

    document.getElementById("recentOrdersTitle").textContent =
        isAdmin ? "Recent Laundry Orders" : "Your Recent Orders";

    document.getElementById("ordersSectionTitle").textContent =
        isAdmin ? "All Laundry Orders" : "My Orders";

    document.getElementById("ordersDescription").textContent =
        isAdmin
            ? "View and update all laundry orders."
            : "View your laundry order history.";

    showSection("dashboardSection");
    renderAll();
}

// Navigate between app sections
function showSection(sectionId, button) {
    if (!currentUser) return;

    if (sectionId === "orderSection" && currentUser.role === "admin") {
        return;
    }

    if (sectionId === "queueSection" && currentUser.role !== "admin") {
        return;
    }

    const sections = document.querySelectorAll(".content-section");
    const buttons = document.querySelectorAll(".nav-link");

    sections.forEach(function(section) {
        section.classList.remove("active");
    });

    buttons.forEach(function(nav) {
        nav.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");

    if (!button) {
        buttons.forEach(function(nav) {
            if (nav.getAttribute("onclick")?.includes(sectionId)) {
                nav.classList.add("active");
            }
        });
    } else {
        button.classList.add("active");
    }

    const titles = {
        dashboardSection: "Dashboard",
        orderSection: "New Order",
        queueSection: "Queue Management",
        trackingSection: "Track Order",
        ordersSection: currentUser.role === "admin" ? "All Orders" : "My Orders"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionId] || "Wash Up";
}

// Calculate laundry price
document.getElementById("laundryWeight").addEventListener("input", function() {
    const weight = Number(this.value);
    const price = weight > 0 ? weight * PRICE_PER_KG : 0;

    document.getElementById("pricePreview").textContent =
        "₱" + price.toFixed(2);
});

// Place a new laundry order
document.getElementById("orderForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "customer") return;

    const name = document.getElementById("customerName").value.trim();
    const weight = Number(document.getElementById("laundryWeight").value);
    const method = document.getElementById("serviceMethod").value;

    if (!name || weight < 1 || weight > 100) {
        document.getElementById("orderMessage").textContent =
            "Please enter a valid name and weight.";
        return;
    }

    const order = {
        id: "FW-" + Date.now().toString().slice(-8),
        username: currentUser.username,
        customer: name,
        weight: weight,
        total: weight * PRICE_PER_KG,
        method: method,
        status: "Waiting in Queue",
        machineId: null,
        stageRemaining: 0,
        createdAt: Date.now()
    };

    orders.push(order);

    // Automatically assign the oldest waiting order if a machine is available
    assignNextOrder();

    saveData();
    renderAll();

    document.getElementById("orderMessage").textContent =
        "Order submitted! Your order ID is " + order.id;

    document.getElementById("orderForm").reset();
    document.getElementById("pricePreview").textContent = "₱0.00";
});

// Get waiting orders in FIFO order
function getWaitingOrders() {
    return orders.filter(function(order) {
        return order.status === "Waiting in Queue";
    }).sort(function(a, b) {
        return a.createdAt - b.createdAt;
    });
}

// Assign the oldest waiting order to an available machine
function assignNextOrder() {
    const availableMachine = machines.find(function(machine) {
        return machine.status === "Available";
    });

    const waitingOrders = getWaitingOrders();

    if (!availableMachine || waitingOrders.length === 0) return;

    const order = waitingOrders[0];

    availableMachine.status = "Washing";
    availableMachine.orderId = order.id;

    order.machineId = availableMachine.id;
    order.status = "Washing";
    order.stageRemaining = WASH_TIME;

    saveData();
}

// Admin starts the next waiting order
function startNextOrder() {
    if (!currentUser || currentUser.role !== "admin") return;

    const waitingOrders = getWaitingOrders();
    const availableMachine = machines.find(function(machine) {
        return machine.status === "Available";
    });

    if (waitingOrders.length === 0) {
        alert("There are no waiting orders.");
        return;
    }

    if (!availableMachine) {
        alert("All machines are occupied.");
        return;
    }

    assignNextOrder();
    saveData();
    renderAll();
}

// Update washing, drying, and folding timers
function updateLaundryTimers() {
    let changed = false;

    orders.forEach(function(order) {
        if (
            order.status !== "Washing" &&
            order.status !== "Drying" &&
            order.status !== "Folding"
        ) {
            return;
        }

        order.stageRemaining--;
        changed = true;

        if (order.stageRemaining <= 0) {
            if (order.status === "Washing") {
                order.status = "Drying";
                order.stageRemaining = DRY_TIME;

                const machine = machines.find(function(m) {
                    return m.id === order.machineId;
                });

                if (machine) {
                    machine.status = "Drying";
                }

            } else if (order.status === "Drying") {
                const machine = machines.find(function(m) {
                    return m.id === order.machineId;
                });

                if (machine) {
                    machine.status = "Available";
                    machine.orderId = null;
                }

                order.machineId = null;
                order.status = "Folding";
                order.stageRemaining = FOLD_TIME;

                // Reuse the available machine for the next waiting order
                assignNextOrder();

            } else if (order.status === "Folding") {
                order.stageRemaining = 0;

                order.status = order.method === "Pickup"
                    ? "Ready for Pickup"
                    : "Out for Delivery";
            }
        }
    });

    if (changed) {
        saveData();
        renderAll();
    }
}

// Run timers every second for demonstration
setInterval(updateLaundryTimers, 1000);

// Admin marks an order as completed or delivered
function finishOrder(orderId) {
    if (!currentUser || currentUser.role !== "admin") return;

    const order = orders.find(function(o) {
        return o.id === orderId;
    });

    if (!order) return;

    if (order.status === "Ready for Pickup") {
        order.status = "Completed";
    } else if (order.status === "Out for Delivery") {
        order.status = "Delivered";
    } else {
        return;
    }

    saveData();
    renderAll();
}

// Display the 10 washing machines
function renderMachines() {
    const grid = document.getElementById("machineGrid");
    grid.innerHTML = "";

    machines.forEach(function(machine) {
        const div = document.createElement("div");
        div.className = "machine-card";

        div.innerHTML = `
            <div class="machine-icon">◉</div>
            <h4>Machine ${machine.id}</h4>
            <span class="status-pill status-${machine.status.toLowerCase()}">
                ${machine.status}
            </span>
        `;

        grid.appendChild(div);
    });
}

// Update dashboard statistics
function renderStats() {
    const available = machines.filter(function(m) {
        return m.status === "Available";
    }).length;

    const occupied = machines.length - available;
    const waiting = getWaitingOrders().length;

    const completed = orders.filter(function(order) {
        return order.status === "Completed" ||
               order.status === "Delivered";
    }).length;

    document.getElementById("availableCount").textContent = available;
    document.getElementById("occupiedCount").textContent = occupied;
    document.getElementById("waitingCount").textContent = waiting;
    document.getElementById("completedCount").textContent = completed;
}

// Create a status label
function statusLabel(status) {
    const safeStatus = escapeHTML(status);

    return `<span class="status-pill status-${safeStatus.toLowerCase().replace(/ /g, "-")}">${safeStatus}</span>`;
}

// Show recent orders
function renderRecentOrders() {
    const body = document.getElementById("recentOrdersBody");
    body.innerHTML = "";

    const myOrders = currentUser.role === "admin"
        ? orders
        : orders.filter(function(o) {
            return o.username === currentUser.username;
        });

    myOrders.slice(-5).reverse().forEach(function(order) {
        body.innerHTML += `
            <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customer)}</td>
                <td>${order.weight} kg</td>
                <td>${statusLabel(order.status)}</td>
            </tr>
        `;
    });

    if (myOrders.length === 0) {
        body.innerHTML =
            '<tr><td colspan="4">No orders yet.</td></tr>';
    }
}

// Show waiting queue
function renderQueue() {
    const body = document.getElementById("queueTableBody");
    const waiting = getWaitingOrders();

    document.getElementById("queueTotal").textContent = waiting.length;
    body.innerHTML = "";

    waiting.forEach(function(order, index) {
        body.innerHTML += `
            <tr>
                <td>#${index + 1}</td>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customer)}</td>
                <td>${order.weight} kg</td>
                <td>${statusLabel(order.status)}</td>
            </tr>
        `;
    });

    if (waiting.length === 0) {
        body.innerHTML =
            '<tr><td colspan="5">No waiting orders.</td></tr>';
    }
}

// Show all orders to admin and personal orders to customers
function renderAllOrders() {
    const body = document.getElementById("allOrdersBody");
    body.innerHTML = "";

    const myOrders = currentUser.role === "admin"
        ? orders
        : orders.filter(function(o) {
            return o.username === currentUser.username;
        });

    myOrders.slice().reverse().forEach(function(order) {
        let action = "-";

        if (currentUser.role === "admin") {
            if (
                order.status === "Ready for Pickup" ||
                order.status === "Out for Delivery"
            ) {
                const buttonText = order.status === "Ready for Pickup"
                    ? "Complete"
                    : "Delivered";

                action = `
                    <button
                        class="action-button"
                        onclick="finishOrder('${escapeHTML(order.id)}')">
                        ${buttonText}
                    </button>
                `;
            }
        }

        body.innerHTML += `
            <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customer)}</td>
                <td>${order.weight} kg</td>
                <td>₱${Number(order.total).toFixed(2)}</td>
                <td>${escapeHTML(order.method)}</td>
                <td>${statusLabel(order.status)}</td>
                <td>${action}</td>
            </tr>
        `;
    });

    if (myOrders.length === 0) {
        body.innerHTML =
            '<tr><td colspan="7">No orders found.</td></tr>';
    }
}

// Search for an order
document.getElementById("trackingForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentUser) return;

    const id = document.getElementById("trackingOrderId").value.trim();

    const order = orders.find(function(o) {
        return o.id.toLowerCase() === id.toLowerCase();
    });

    const result = document.getElementById("trackingResult");

    if (
        !order ||
        (currentUser.role !== "admin" &&
         order.username !== currentUser.username)
    ) {
        result.innerHTML = "<p>Order not found.</p>";
        return;
    }

    result.innerHTML = `
        <div class="tracking-card">
            <h3>Order ${escapeHTML(order.id)}</h3>
            <p><strong>Customer:</strong> ${escapeHTML(order.customer)}</p>
            <p><strong>Weight:</strong> ${order.weight} kg</p>
            <p><strong>Total:</strong> ₱${Number(order.total).toFixed(2)}</p>
            <p><strong>Method:</strong> ${escapeHTML(order.method)}</p>
            <p><strong>Status:</strong> ${statusLabel(order.status)}</p>
            <p><strong>Machine:</strong> ${
                order.machineId ? "Machine " + order.machineId : "Not assigned"
            }</p>
            <p><strong>Time left in current stage:</strong> ${
                ["Washing", "Drying", "Folding"].includes(order.status)
                    ? order.stageRemaining + " seconds"
                    : "-"
            }</p>
        </div>
    `;
});

// Escape user-entered text before displaying it in HTML
function escapeHTML(text) {
    const symbols = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(text).replace(/[&<>"']/g, function(char) {
        return symbols[char];
    });
}

// Refresh app data
function renderAll() {
    if (!currentUser) return;

    renderMachines();
    renderStats();
    renderRecentOrders();
    renderQueue();
    renderAllOrders();
}

// Save initialized data
saveData();
