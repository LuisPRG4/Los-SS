// Funciones de utilidad para localStorage
const loadData = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
};

// Cargar la pestaña activa al recargar la página
document.addEventListener('DOMContentLoaded', () => {
    const activeTabId = localStorage.getItem('activeTab');
    if (activeTabId) {
        openTab(activeTabId);
    } else {
        openTab('resumen'); // Abrir la pestaña de resumen por defecto si no hay una activa
    }
});


// --- Manejo de pestañas ---
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        openTab(tabId);
    });
});

function openTab(tabId) {
    // Eliminar 'active' de todos los botones y contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'btn-primary');
        button.classList.add('btn-secondary');
    });

    // Añadir 'active' al contenido y botón correctos
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active', 'btn-primary');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.remove('btn-secondary');

    // Guardar la pestaña activa en localStorage
    localStorage.setItem('activeTab', tabId);

    // Si la pestaña de reportes se abre, generar los reportes
    if (tabId === 'reportes') {
        generateReports();
    }
    // Si la pestaña de resumen se abre, actualizar el resumen
    if (tabId === 'resumen') {
        updateSummary();
    }
    // Si la pestaña de clientes se abre, renderizar clientes
    if (tabId === 'clientes') {
        renderClients(); // Asegurarse de renderizar los clientes al abrir la pestaña
    }
}


// --- Gestión de Ventas ---
let sales = loadData('sales');
let selectedSaleId = null; // Variable para almacenar el ID de la venta seleccionada

const salesList = document.getElementById('salesList');
const saleProductNameInput = document.getElementById('saleProductName');
const saleQuantityInput = document.getElementById('saleQuantity');
const saleUnitPriceInput = document.getElementById('saleUnitPrice');
const addSaleButton = document.getElementById('addSale');
const updateSaleButton = document.getElementById('updateSale');
const deleteSelectedSaleButton = document.getElementById('deleteSelectedSale');
const clearAllSalesButton = document.getElementById('clearAllSales');
const totalSalesSummary = document.getElementById('totalSalesSummary');

// Filtros de ventas
const searchSaleProductInput = document.getElementById('searchSaleProduct');
const filterSaleStartDateInput = document.getElementById('filterSaleStartDate');
const filterSaleEndDateInput = document.getElementById('filterSaleEndDate');
const applySaleFiltersButton = document.getElementById('applySaleFilters');
const clearSaleFiltersButton = document.getElementById('clearSaleFilters');


const renderSales = (filteredSales = sales) => {
    salesList.innerHTML = '';
    let total = 0;
    if (filteredSales.length === 0) {
        salesList.innerHTML = '<p>No hay ventas registradas.</p>';
        totalSalesSummary.textContent = `Total de ventas: $0.00`;
        return;
    }
    filteredSales.forEach(sale => {
        const li = document.createElement('li');
        li.dataset.id = sale.id;
        li.innerHTML = `
            <span>
                Producto: ${sale.productName} | Cantidad: ${sale.quantity} | Precio Unitario: $${sale.unitPrice.toFixed(2)} | Total: $${(sale.quantity * sale.unitPrice).toFixed(2)} | Fecha: ${sale.date}
            </span>
            <div class="item-actions">
                <button class="btn-icon edit-sale" data-id="${sale.id}">✏️</button>
                <button class="btn-icon delete-sale" data-id="${sale.id}">🗑️</button>
            </div>
        `;
        salesList.appendChild(li);
        total += sale.quantity * sale.unitPrice;
    });
    totalSalesSummary.textContent = `Total de ventas: $${total.toFixed(2)}`;
    document.getElementById('totalSalesSummaryResumen').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalUnitsSoldResumen').textContent = `${sales.reduce((sum, sale) => sum + sale.quantity, 0)} unidades`;
};

const addSale = () => {
    const productName = saleProductNameInput.value.trim();
    const quantity = parseInt(saleQuantityInput.value);
    const unitPrice = parseFloat(saleUnitPriceInput.value);

    if (!productName || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
        alert('Por favor, ingresa un nombre de producto, cantidad y precio unitario válidos.');
        return;
    }

    const newSale = {
        id: generateUniqueId(),
        productName,
        quantity,
        unitPrice,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };

    sales.push(newSale);
    saveData('sales', sales);
    resetSaleForm();
    renderSales();
    updateRecentSales(newSale);
    updateInventoryOnSale(productName, quantity, 'subtract'); // Actualizar inventario al vender
    updateSummary(); // Actualizar el resumen
};

const editSale = (id) => {
    const sale = sales.find(s => s.id === id);
    if (sale) {
        selectedSaleId = id;
        saleProductNameInput.value = sale.productName;
        saleQuantityInput.value = sale.quantity;
        saleUnitPriceInput.value = sale.unitPrice;
        addSaleButton.style.display = 'none';
        updateSaleButton.style.display = 'inline-block';
        deleteSelectedSaleButton.style.display = 'inline-block';

        // Remover la clase 'selected' de todos los elementos y añadirla al seleccionado
        document.querySelectorAll('#salesList li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#salesList li[data-id="${id}"]`).classList.add('selected');
    }
};

const updateSale = () => {
    if (!selectedSaleId) return;

    const productName = saleProductNameInput.value.trim();
    const quantity = parseInt(saleQuantityInput.value);
    const unitPrice = parseFloat(saleUnitPriceInput.value);

    if (!productName || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
        alert('Por favor, ingresa un nombre de producto, cantidad y precio unitario válidos.');
        return;
    }

    const saleIndex = sales.findIndex(s => s.id === selectedSaleId);
    if (saleIndex !== -1) {
        const oldQuantity = sales[saleIndex].quantity; // Obtener la cantidad anterior
        sales[saleIndex] = {
            id: selectedSaleId,
            productName,
            quantity,
            unitPrice,
            date: sales[saleIndex].date // Mantener la fecha original
        };
        saveData('sales', sales);
        renderSales();
        resetSaleForm();
        updateInventoryOnSale(productName, quantity, 'update', oldQuantity); // Actualizar inventario
        updateSummary(); // Actualizar el resumen
    }
};

const deleteSale = (id) => {
    const saleIndex = sales.findIndex(s => s.id === id);
    if (saleIndex !== -1) {
        const deletedSale = sales[saleIndex];
        sales.splice(saleIndex, 1);
        saveData('sales', sales);
        renderSales();
        resetSaleForm();
        updateInventoryOnSale(deletedSale.productName, deletedSale.quantity, 'add'); // Devolver al inventario
        updateSummary(); // Actualizar el resumen
    }
};

const clearAllSales = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las ventas? Esta acción es irreversible.')) {
        sales.forEach(sale => {
            updateInventoryOnSale(sale.productName, sale.quantity, 'add'); // Devolver al inventario antes de borrar
        });
        sales = [];
        saveData('sales', sales);
        renderSales();
        resetSaleForm();
        updateSummary(); // Actualizar el resumen
        alert('Todas las ventas han sido eliminadas.');
    }
};

const resetSaleForm = () => {
    selectedSaleId = null;
    saleProductNameInput.value = '';
    saleQuantityInput.value = '';
    saleUnitPriceInput.value = '';
    addSaleButton.style.display = 'inline-block';
    updateSaleButton.style.display = 'none';
    deleteSelectedSaleButton.style.display = 'none';
    document.querySelectorAll('#salesList li').forEach(li => li.classList.remove('selected'));
};

// Función para filtrar ventas
const filterSales = () => {
    const searchTerm = searchSaleProductInput.value.toLowerCase();
    const startDate = filterSaleStartDateInput.value;
    const endDate = filterSaleEndDateInput.value;

    let filtered = sales.filter(sale => {
        // Filtrar por nombre de producto
        const matchesProduct = sale.productName.toLowerCase().includes(searchTerm);

        // Filtrar por rango de fechas
        const saleDate = new Date(sale.date.split('/').reverse().join('-')); // Convertir DD/MM/YYYY a YYYY-MM-DD para Date
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);

        return matchesProduct && matchesDate;
    });
    renderSales(filtered);
};


// --- Gestión de Clientes ---
let clients = loadData('clients');
let selectedClientId = null;

const clientList = document.getElementById('clientList');
const clientNameInput = document.getElementById('clientName');
const clientAliasInput = document.getElementById('clientAlias');
const clientContactInput = document.getElementById('clientContact');
const clientAddressInput = document.getElementById('clientAddress');
const clientNotesInput = document.getElementById('clientNotes');
const addClientButton = document.getElementById('addClient');
const updateClientButton = document.getElementById('updateClient');
const deleteSelectedClientButton = document.getElementById('deleteSelectedClient');
const clearClientFormButton = document.getElementById('clearClientFormBtn');
const clearAllClientsButton = document.getElementById('clearAllClients');
const searchClientNameInput = document.getElementById('searchClientName');
const applyClientFiltersButton = document.getElementById('applyClientFilters');
const clearClientFiltersButton = document.getElementById('clearClientFilters');


const renderClients = (filteredClients = clients) => {
    clientList.innerHTML = '';
    if (filteredClients.length === 0) {
        clientList.innerHTML = '<p>No hay clientes registrados.</p>';
        return;
    }
    filteredClients.forEach(client => {
        const li = document.createElement('li');
        li.dataset.id = client.id;
        li.innerHTML = `
            <span>
                <strong>${client.name}</strong> 
                ${client.alias ? `(${client.alias})` : ''}
                <br>
                Contacto: ${client.contact}
                ${client.address ? `<br>Dirección: ${client.address}` : ''}
                ${client.notes ? `<br>Notas: ${client.notes}` : ''}
            </span>
            <div class="item-actions">
                <button class="btn-icon edit-client" data-id="${client.id}">✏️</button>
                <button class="btn-icon delete-client" data-id="${client.id}">🗑️</button>
            </div>
        `;
        clientList.appendChild(li);
    });
    document.getElementById('totalClientsResumen').textContent = clients.length;
};

const addClient = () => {
    const name = clientNameInput.value.trim();
    const alias = clientAliasInput.value.trim();
    const contact = clientContactInput.value.trim();
    const address = clientAddressInput.value.trim();
    const notes = clientNotesInput.value.trim();

    if (!name || !contact) {
        alert('Por favor, ingresa al menos el nombre y el contacto del cliente.');
        return;
    }
    const newClient = {
        id: generateUniqueId(),
        name,
        alias,
        contact,
        address,
        notes
    };
    clients.push(newClient);
    saveData('clients', clients);
    resetClientForm();
    renderClients();
    updateSummary(); // Actualizar el resumen
};

const editClient = (id) => {
    const client = clients.find(c => c.id === id);
    if (client) {
        selectedClientId = id;
        clientNameInput.value = client.name;
        clientAliasInput.value = client.alias || '';
        clientContactInput.value = client.contact;
        clientAddressInput.value = client.address || '';
        clientNotesInput.value = client.notes || '';

        addClientButton.style.display = 'none';
        updateClientButton.style.display = 'inline-block';
        deleteSelectedClientButton.style.display = 'inline-block';

        document.querySelectorAll('#clientList li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#clientList li[data-id="${id}"]`).classList.add('selected');
    }
};

const updateClient = () => {
    if (!selectedClientId) return;
    const name = clientNameInput.value.trim();
    const alias = clientAliasInput.value.trim();
    const contact = clientContactInput.value.trim();
    const address = clientAddressInput.value.trim();
    const notes = clientNotesInput.value.trim();

    if (!name || !contact) {
        alert('Por favor, ingresa al menos el nombre y el contacto del cliente.');
        return;
    }
    const clientIndex = clients.findIndex(c => c.id === selectedClientId);
    if (clientIndex !== -1) {
        clients[clientIndex] = {
            id: selectedClientId,
            name,
            alias,
            contact,
            address,
            notes
        };
        saveData('clients', clients);
        renderClients();
        resetClientForm();
        updateSummary(); // Actualizar el resumen
    }
};

const deleteClient = (id) => {
    clients = clients.filter(c => c.id !== id);
    saveData('clients', clients);
    renderClients();
    resetClientForm();
    updateSummary(); // Actualizar el resumen
};

const clearAllClients = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los clientes? Esta acción es irreversible.')) {
        clients = [];
        saveData('clients', clients);
        renderClients();
        resetClientForm();
        updateSummary(); // Actualizar el resumen
        alert('Todos los clientes han sido eliminados.');
    }
};

const resetClientForm = () => {
    selectedClientId = null;
    clientNameInput.value = '';
    clientAliasInput.value = '';
    clientContactInput.value = '';
    clientAddressInput.value = '';
    clientNotesInput.value = '';
    addClientButton.style.display = 'inline-block';
    updateClientButton.style.display = 'none';
    deleteSelectedClientButton.style.display = 'none';
    document.querySelectorAll('#clientList li').forEach(li => li.classList.remove('selected'));
};

// Nueva función para filtrar clientes
const filterClients = () => {
    const searchTerm = searchClientNameInput.value.toLowerCase();

    let filtered = clients.filter(client => {
        const matchesName = client.name.toLowerCase().includes(searchTerm);
        const matchesAlias = client.alias ? client.alias.toLowerCase().includes(searchTerm) : false;
        return matchesName || matchesAlias;
    });
    renderClients(filtered); // Llama a renderClients con los resultados filtrados
};


// --- Gestión de Productos de Yogurt ---
let yogurts = loadData('yogurts');
let selectedYogurtId = null;

const yogurtList = document.getElementById('yogurtList');
const yogurtNameInput = document.getElementById('yogurtName');
const yogurtFlavorInput = document.getElementById('yogurtFlavor');
const yogurtPriceInput = document.getElementById('yogurtPrice');
const addYogurtButton = document.getElementById('addYogurt');
const updateYogurtButton = document.getElementById('updateYogurt');
const deleteSelectedYogurtButton = document.getElementById('deleteSelectedYogurt');
const clearAllYogurtsButton = document.getElementById('clearAllYogurts');

const renderYogurts = () => {
    yogurtList.innerHTML = '';
    if (yogurts.length === 0) {
        yogurtList.innerHTML = '<p>No hay productos de yogurt registrados.</p>';
        return;
    }
    yogurts.forEach(yogurt => {
        const li = document.createElement('li');
        li.dataset.id = yogurt.id;
        li.innerHTML = `
            <span>
                Nombre: ${yogurt.name} | Sabor: ${yogurt.flavor} | Precio Sugerido: $${yogurt.price.toFixed(2)}
            </span>
            <div class="item-actions">
                <button class="btn-icon edit-yogurt" data-id="${yogurt.id}">✏️</button>
                <button class="btn-icon delete-yogurt" data-id="${yogurt.id}">🗑️</button>
            </div>
        `;
        yogurtList.appendChild(li);
    });
    document.getElementById('totalYogurtsResumen').textContent = yogurts.length;
};

const addYogurt = () => {
    const name = yogurtNameInput.value.trim();
    const flavor = yogurtFlavorInput.value.trim();
    const price = parseFloat(yogurtPriceInput.value);

    if (!name || !flavor || isNaN(price) || price <= 0) {
        alert('Por favor, ingresa un nombre, sabor y precio válido para el producto de yogurt.');
        return;
    }

    const newYogurt = {
        id: generateUniqueId(),
        name,
        flavor,
        price
    };
    yogurts.push(newYogurt);
    saveData('yogurts', yogurts);
    resetYogurtForm();
    renderYogurts();
    updateSummary();
};

const editYogurt = (id) => {
    const yogurt = yogurts.find(y => y.id === id);
    if (yogurt) {
        selectedYogurtId = id;
        yogurtNameInput.value = yogurt.name;
        yogurtFlavorInput.value = yogurt.flavor;
        yogurtPriceInput.value = yogurt.price;
        addYogurtButton.style.display = 'none';
        updateYogurtButton.style.display = 'inline-block';
        deleteSelectedYogurtButton.style.display = 'inline-block';

        document.querySelectorAll('#yogurtList li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#yogurtList li[data-id="${id}"]`).classList.add('selected');
    }
};

const updateYogurt = () => {
    if (!selectedYogurtId) return;

    const name = yogurtNameInput.value.trim();
    const flavor = yogurtFlavorInput.value.trim();
    const price = parseFloat(yogurtPriceInput.value);

    if (!name || !flavor || isNaN(price) || price <= 0) {
        alert('Por favor, ingresa un nombre, sabor y precio válido para el producto de yogurt.');
        return;
    }

    const yogurtIndex = yogurts.findIndex(y => y.id === selectedYogurtId);
    if (yogurtIndex !== -1) {
        yogurts[yogurtIndex] = {
            id: selectedYogurtId,
            name,
            flavor,
            price
        };
        saveData('yogurts', yogurts);
        renderYogurts();
        resetYogurtForm();
        updateSummary();
    }
};

const deleteYogurt = (id) => {
    yogurts = yogurts.filter(y => y.id !== id);
    saveData('yogurts', yogurts);
    renderYogurts();
    resetYogurtForm();
    updateSummary();
};

const clearAllYogurts = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los productos de yogurt? Esta acción es irreversible.')) {
        yogurts = [];
        saveData('yogurts', yogurts);
        renderYogurts();
        resetYogurtForm();
        updateSummary();
        alert('Todos los productos de yogurt han sido eliminados.');
    }
};

const resetYogurtForm = () => {
    selectedYogurtId = null;
    yogurtNameInput.value = '';
    yogurtFlavorInput.value = '';
    yogurtPriceInput.value = '';
    addYogurtButton.style.display = 'inline-block';
    updateYogurtButton.style.display = 'none';
    deleteSelectedYogurtButton.style.display = 'none';
    document.querySelectorAll('#yogurtList li').forEach(li => li.classList.remove('selected'));
};


// --- Gestión de Inventario ---
let inventory = loadData('inventory');
let selectedInventoryItemId = null; // Variable para editar/eliminar item de inventario

const inventoryList = document.getElementById('inventoryList');
const inventoryProductNameInput = document.getElementById('inventoryProductName');
const inventoryQuantityInput = document.getElementById('inventoryQuantity');
const addOrUpdateInventoryButton = document.getElementById('addOrUpdateInventory');
const deleteInventoryItemButton = document.getElementById('deleteInventoryItem'); // Botón para eliminar item de inventario
const clearAllInventoryButton = document.getElementById('clearAllInventory');

const renderInventory = () => {
    inventoryList.innerHTML = '';
    if (inventory.length === 0) {
        inventoryList.innerHTML = '<p>No hay artículos en el inventario.</p>';
        return;
    }
    inventory.forEach(item => {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        li.innerHTML = `
            <span>
                Producto: ${item.productName} | Stock: ${item.quantity} unidades
            </span>
            <div class="item-actions">
                <button class="btn-icon edit-inventory" data-id="${item.id}">✏️</button>
                <button class="btn-icon delete-inventory" data-id="${item.id}">🗑️</button>
            </div>
        `;
        inventoryList.appendChild(li);
    });
    document.getElementById('totalInventoryItemsResumen').textContent = `${inventory.length} tipos`;
    document.getElementById('currentTotalStockResumen').textContent = `${inventory.reduce((sum, item) => sum + item.quantity, 0)} unidades`;
};

const addOrUpdateInventory = () => {
    const productName = inventoryProductNameInput.value.trim();
    const quantity = parseInt(inventoryQuantityInput.value);

    if (!productName || isNaN(quantity) || quantity < 0) { // Permitir cantidad 0 para vaciar stock
        alert('Por favor, ingresa un nombre de producto y una cantidad válida para el inventario.');
        return;
    }

    const existingItemIndex = inventory.findIndex(item => item.productName.toLowerCase() === productName.toLowerCase());

    if (existingItemIndex !== -1) {
        // Actualizar item existente
        if (selectedInventoryItemId && inventory[existingItemIndex].id === selectedInventoryItemId) {
            // Si es el item seleccionado para editar
            inventory[existingItemIndex].quantity = quantity;
        } else {
            // Si se está añadiendo un nuevo stock a un producto existente
            inventory[existingItemIndex].quantity += quantity;
        }
    } else {
        // Añadir nuevo item
        const newItem = {
            id: generateUniqueId(),
            productName,
            quantity
        };
        inventory.push(newItem);
    }
    saveData('inventory', inventory);
    resetInventoryForm();
    renderInventory();
    updateSummary();
};

const editInventoryItem = (id) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
        selectedInventoryItemId = id;
        inventoryProductNameInput.value = item.productName;
        inventoryQuantityInput.value = item.quantity;
        addOrUpdateInventoryButton.textContent = 'Actualizar Stock';
        deleteInventoryItemButton.style.display = 'inline-block'; // Mostrar botón de eliminar
        // Remover la clase 'selected' de todos los elementos y añadirla al seleccionado
        document.querySelectorAll('#inventoryList li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#inventoryList li[data-id="${id}"]`).classList.add('selected');
    }
};

const deleteInventoryItem = (id) => {
    inventory = inventory.filter(item => item.id !== id);
    saveData('inventory', inventory);
    renderInventory();
    resetInventoryForm();
    updateSummary();
};

const clearAllInventory = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODO el inventario? Esta acción es irreversible.')) {
        inventory = [];
        saveData('inventory', inventory);
        renderInventory();
        resetInventoryForm();
        updateSummary();
        alert('Todo el inventario ha sido eliminado.');
    }
};

const resetInventoryForm = () => {
    selectedInventoryItemId = null;
    inventoryProductNameInput.value = '';
    inventoryQuantityInput.value = '';
    addOrUpdateInventoryButton.textContent = 'Añadir/Actualizar Stock';
    deleteInventoryItemButton.style.display = 'none'; // Ocultar botón de eliminar
    document.querySelectorAll('#inventoryList li').forEach(li => li.classList.remove('selected'));
};

// Función para actualizar inventario basada en ventas
const updateInventoryOnSale = (productName, quantityChange, quantityChangeType, oldQuantity = 0) => {
    const itemIndex = inventory.findIndex(item => item.productName.toLowerCase() === productName.toLowerCase());

    if (itemIndex !== -1) {
        if (quantityChangeType === 'subtract') {
            inventory[itemIndex].quantity -= quantityChange;
        } else if (quantityChangeType === 'add') {
            inventory[itemIndex].quantity += quantityChange;
        } else if (quantityChangeType === 'update') {
            const diff = quantityChange - oldQuantity;
            inventory[itemIndex].quantity += diff;
        }
        // Asegurarse de que la cantidad no sea negativa
        if (inventory[itemIndex].quantity < 0) {
            inventory[itemIndex].quantity = 0;
        }
    } else if (quantityChangeType === 'subtract') {
        // Si el producto no existe en inventario y se intenta restar, no se hace nada o se alerta
        console.warn(`Producto "${productName}" no encontrado en inventario para restar.`);
        // Opcional: alert(`El producto "${productName}" no se encuentra en inventario.`);
    } else if (quantityChangeType === 'add') {
        // Si el producto no existe en inventario y se intenta añadir (al borrar venta), se añade
        inventory.push({
            id: generateUniqueId(),
            productName,
            quantity: quantityChange
        });
    }

    saveData('inventory', inventory);
    renderInventory(); // Renderizar inventario para mostrar cambios
    updateSummary(); // Actualizar el resumen
};


// --- Gestión de Reportes (Chart.js) ---
let barChartInstance, pieChartInstance, lineChartInstance;

const generateReports = () => {
    // Destruir instancias de gráficos anteriores si existen
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    if (lineChartInstance) lineChartInstance.destroy();

    const salesByProduct = {};
    const salesByValue = {};
    const dailySales = {};

    sales.forEach(sale => {
        // Ventas por Producto (Bar Chart)
        salesByProduct[sale.productName] = (salesByProduct[sale.productName] || 0) + sale.quantity;

        // Distribución de Ventas (Pie Chart)
        const totalSaleValue = sale.quantity * sale.unitPrice;
        salesByValue[sale.productName] = (salesByValue[sale.productName] || 0) + totalSaleValue;

        // Ventas Diarias (Line Chart)
        // La fecha ya viene en formato DD/MM/YYYY, la convertimos a YYYY-MM-DD para agrupar
        const dateKey = sale.date.split('/').reverse().join('-');
        dailySales[dateKey] = (dailySales[dateKey] || 0) + totalSaleValue;
    });

    // Preparar datos para Ventas por Producto (Bar Chart)
    const barChartLabels = Object.keys(salesByProduct);
    const barChartData = Object.values(salesByProduct);

    const barCtx = document.getElementById('barChart').getContext('2d');
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: barChartLabels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: barChartData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Preparar datos para Distribución de Ventas (Pie Chart)
    const pieChartLabels = Object.keys(salesByValue);
    const pieChartData = Object.values(salesByValue);
    const pieColors = pieChartLabels.map((_, i) => `hsl(${i * 60}, 70%, 60%)`); // Colores dinámicos

    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: pieChartLabels,
            datasets: [{
                label: 'Valor de Ventas ($)',
                data: pieChartData,
                backgroundColor: pieColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
        }
    });

    // Preparar datos para Ventas Diarias (Line Chart)
    // Ordenar las fechas cronológicamente
    const sortedDates = Object.keys(dailySales).sort();
    const lineChartData = sortedDates.map(date => dailySales[date]);

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: sortedDates, // Fechas ordenadas
            datasets: [{
                label: 'Ventas Diarias ($)',
                data: lineChartData,
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    type: 'category', // Tratar las fechas como categorías para que no se interpole
                    labels: sortedDates
                }
            }
        }
    });
};


// --- Resumen General ---
const updateSummary = () => {
    // Estos ya se actualizan en renderSales, renderClients, renderYogurts, renderInventory
    // Solo asegurarnos de que se llamen cuando la página carga o se actualizan datos
    renderSales();
    renderClients();
    renderYogurts();
    renderInventory();
};

const updateRecentSales = (newSale) => {
    const recentSalesList = document.getElementById('recentSalesList');
    // Eliminar el mensaje "No hay actividad reciente." si está presente
    if (recentSalesList.querySelector('p')) {
        recentSalesList.innerHTML = '';
    }

    const li = document.createElement('li');
    li.innerHTML = `Venta: ${newSale.productName} - ${newSale.quantity} unidades - $${(newSale.quantity * newSale.unitPrice).toFixed(2)} (${newSale.date})`;

    // Añadir al principio de la lista
    if (recentSalesList.firstChild) {
        recentSalesList.insertBefore(li, recentSalesList.firstChild);
    } else {
        recentSalesList.appendChild(li);
    }

    // Mantener un número limitado de elementos (ej. los últimos 5)
    while (recentSalesList.children.length > 5) {
        recentSalesList.removeChild(recentSalesList.lastChild);
    }
};


// --- Event Listeners Globales y Inicialización ---

// Event Listeners de Ventas
addSaleButton.addEventListener('click', addSale);
updateSaleButton.addEventListener('click', updateSale);
deleteSelectedSaleButton.addEventListener('click', deleteSale); // Corregido: deleteSale directamente
clearAllSalesButton.addEventListener('click', clearAllSales);
applySaleFiltersButton.addEventListener('click', filterSales);
clearSaleFiltersButton.addEventListener('click', () => {
    searchSaleProductInput.value = '';
    filterSaleStartDateInput.value = '';
    filterSaleEndDateInput.value = '';
    renderSales(); // Vuelve a renderizar sin filtros
});

salesList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-sale')) {
        editSale(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-sale')) {
        if (confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
            deleteSale(event.target.dataset.id);
        }
    } else if (event.target.tagName === 'SPAN') { // Permitir selección al hacer clic en el texto
        const li = event.target.closest('li');
        if (li) {
            const id = li.dataset.id;
            if (selectedSaleId === id) {
                resetSaleForm();
            } else {
                editSale(id);
            }
        }
    }
});


// Event Listeners de Clientes
addClientButton.addEventListener('click', addClient);
updateClientButton.addEventListener('click', updateClient);
deleteSelectedClientButton.addEventListener('click', deleteClient); // Corregido: deleteClient directamente
clearClientFormButton.addEventListener('click', resetClientForm);
clearAllClientsButton.addEventListener('click', clearAllClients);
applyClientFiltersButton.addEventListener('click', filterClients);
clearClientFiltersButton.addEventListener('click', () => {
    searchClientNameInput.value = '';
    renderClients(); // Vuelve a renderizar sin filtros
});

clientList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-client')) {
        editClient(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-client')) {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            deleteClient(event.target.dataset.id);
        }
    } else if (event.target.tagName === 'SPAN') { // Permitir selección al hacer clic en el texto
        const li = event.target.closest('li');
        if (li) {
            const id = li.dataset.id;
            if (selectedClientId === id) {
                resetClientForm();
            } else {
                editClient(id);
            }
        }
    }
});


// Event Listeners de Productos de Yogurt
addYogurtButton.addEventListener('click', addYogurt);
updateYogurtButton.addEventListener('click', updateYogurt);
deleteSelectedYogurtButton.addEventListener('click', deleteYogurt); // Corregido: deleteYogurt directamente
clearAllYogurtsButton.addEventListener('click', clearAllYogurts);

yogurtList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-yogurt')) {
        editYogurt(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-yogurt')) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            deleteYogurt(event.target.dataset.id);
        }
    } else if (event.target.tagName === 'SPAN') { // Permitir selección al hacer clic en el texto
        const li = event.target.closest('li');
        if (li) {
            const id = li.dataset.id;
            if (selectedYogurtId === id) {
                resetYogurtForm();
            } else {
                editYogurt(id);
            }
        }
    }
});


// Event Listeners de Inventario
addOrUpdateInventoryButton.addEventListener('click', addOrUpdateInventory);
deleteInventoryItemButton.addEventListener('click', () => {
    if (selectedInventoryItemId) {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
            deleteInventoryItem(selectedInventoryItemId);
        }
    }
});
clearAllInventoryButton.addEventListener('click', clearAllInventory);

inventoryList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-inventory')) {
        editInventoryItem(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-inventory')) {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
            deleteInventoryItem(event.target.dataset.id);
        }
    } else if (event.target.tagName === 'SPAN') { // Permitir selección al hacer clic en el texto
        const li = event.target.closest('li');
        if (li) {
            const id = li.dataset.id;
            if (selectedInventoryItemId === id) {
                resetInventoryForm();
            } else {
                editInventoryItem(id);
            }
        }
    }
});

// Event Listener para Reportes
document.getElementById('generateReports').addEventListener('click', generateReports);

// Inicialización
renderSales();
renderClients();
renderYogurts();
renderInventory();
updateSummary(); // Asegura que el resumen se cargue con los datos iniciales
