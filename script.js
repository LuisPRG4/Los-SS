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
        button.classList.remove('active', 'btn-primary'); // Remover btn-primary también
    });

    // Añadir 'active' y 'btn-primary' al botón y contenido seleccionados
    const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (targetButton && targetContent) {
        targetButton.classList.add('active', 'btn-primary'); // Añadir btn-primary
        targetContent.classList.add('active');
        localStorage.setItem('activeTab', tabId); // Guardar la pestaña activa

        // Cargar datos y resetear formularios al cambiar de pestaña
        switch (tabId) {
            case 'resumen':
                updateSummary();
                updateRecentSalesActivity();
                break;
            case 'ventas':
                loadSales();
                resetSaleForm();
                renderSales(); // Asegúrate de que las ventas se rendericen al cambiar a la pestaña
                break;
            case 'clientes':
                loadClients();
                resetClientForm();
                renderClients(); // Asegúrate de que los clientes se rendericen
                break;
            case 'yogurt':
                loadYogurts();
                resetYogurtForm();
                renderYogurts(); // Asegúrate de que los productos se rendericen
                break;
            case 'inventario':
                loadInventory();
                resetInventoryForm();
                renderInventory(); // Asegúrate de que el inventario se renderice
                break;
            case 'reportes':
                // Los reportes se generan bajo demanda con el botón
                // Destruir gráficos previos para evitar renderizado incorrecto
                if (barChartInstance) barChartInstance.destroy();
                if (pieChartInstance) pieChartInstance.destroy();
                if (lineChartInstance) lineChartInstance.destroy();
                // Ocultar canvases si no hay reportes generados
                document.getElementById('barChart').style.display = 'none';
                document.getElementById('pieChart').style.display = 'none';
                document.getElementById('lineChart').style.display = 'none';
                break;
        }
    } else {
        console.warn(`No se encontró el botón o contenido para la pestaña: ${tabId}. Volviendo a la pestaña predeterminada.`);
        openTab('resumen'); // Volver a resumen si la pestaña no es válida
    }
}


// --- Variables Globales para datos ---
let sales = [];
let clients = [];
let yogurts = [];
let inventory = [];

let selectedClientId = null;
let selectedYogurtId = null;
let selectedSaleId = null;
let selectedInventoryItemId = null;

// --- Carga inicial de datos ---
const loadAllData = () => {
    sales = loadData('sales');
    clients = loadData('clients');
    yogurts = loadData('yogurts');
    inventory = loadData('inventory');
};

// --- Gestión de Resumen ---
const totalSalesSummaryResumen = document.getElementById('totalSalesSummaryResumen');
const totalUnitsSoldResumen = document.getElementById('totalUnitsSoldResumen');
const totalClientsResumen = document.getElementById('totalClientsResumen');
const totalYogurtsResumen = document.getElementById('totalYogurtsResumen');
const totalInventoryItemsResumen = document.getElementById('totalInventoryItemsResumen');
const currentTotalStockResumen = document.getElementById('currentTotalStockResumen');
const recentSalesList = document.getElementById('recentSalesList');

const updateSummary = () => {
    const totalSalesValue = sales.reduce((sum, sale) => sum + (sale.quantity * sale.unitPrice), 0);
    const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalClients = clients.length;
    const totalYogurts = yogurts.length;
    const totalInventoryItems = inventory.length;
    const currentTotalStock = inventory.reduce((sum, item) => sum + item.stock, 0);

    totalSalesSummaryResumen.textContent = `$${totalSalesValue.toFixed(2)}`;
    totalUnitsSoldResumen.textContent = `${totalUnitsSold} unidades`;
    totalClientsResumen.textContent = `${totalClients} clientes`;
    totalYogurtsResumen.textContent = `${totalYogurts} productos`;
    totalInventoryItemsResumen.textContent = `${totalInventoryItems} artículos`;
    currentTotalStockResumen.textContent = `${currentTotalStock} unidades`;
};

const updateRecentSalesActivity = () => {
    recentSalesList.innerHTML = ''; // Limpiar la lista antes de añadir nuevos elementos

    if (sales.length === 0) {
        recentSalesList.innerHTML = '<li>No hay actividad reciente.</li>';
        return;
    }

    // Ordenar ventas por fecha (más reciente primero)
    // Asegurarse de que la fecha es un formato parseable por Date
    const sortedSales = [...sales].sort((a, b) => {
        // Asumiendo que la fecha está en formato 'DD/MM/YYYY'
        const [dayA, monthA, yearA] = a.date.split('/');
        const dateA = new Date(`${monthA}/${dayA}/${yearA}`);
        const [dayB, monthB, yearB] = b.date.split('/');
        const dateB = new Date(`${monthB}/${dayB}/${yearB}`);
        return dateB - dateA;
    });

    // Mostrar solo las últimas 5 ventas (o menos si hay menos de 5)
    const recentActivities = sortedSales.slice(0, 5);

    recentActivities.forEach(sale => {
        const li = document.createElement('li');
        // Formatear la fecha para la visualización
        const [day, month, year] = sale.date.split('/');
        const saleDate = new Date(`${month}/${day}/${year}`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); // Sin hora y minuto
        li.innerHTML = `
            <span>Venta: ${sale.productName} (${sale.quantity} unid.) por $${(sale.quantity * sale.unitPrice).toFixed(2)}</span>
            <span class="activity-date">${saleDate}</span>
        `;
        recentSalesList.appendChild(li);
    });
};


// --- Gestión de Ventas ---
const saleProductNameInput = document.getElementById('saleProductName');
const saleQuantityInput = document.getElementById('saleQuantity');
const saleUnitPriceInput = document.getElementById('saleUnitPrice');
const salePaymentTypeInput = document.getElementById('salePaymentType'); // <--- CAMBIO: Nuevo elemento para tipo de pago
const addSaleButton = document.getElementById('addSale');
const updateSaleButton = document.getElementById('updateSale');
const deleteSelectedSaleButton = document.getElementById('deleteSelectedSale');
const salesList = document.getElementById('salesList');
const totalSalesSummary = document.getElementById('totalSalesSummary');
const searchSaleProductInput = document.getElementById('searchSaleProduct');
const filterSaleStartDateInput = document.getElementById('filterSaleStartDate');
const filterSaleEndDateInput = document.getElementById('filterSaleEndDate');
const applySaleFiltersButton = document.getElementById('applySaleFilters');
const clearSaleFiltersButton = document.getElementById('clearSaleFilters');
const clearAllSalesButton = document.getElementById('clearAllSales');

const loadSales = () => {
    sales = loadData('sales');
};

const addSale = () => {
    const productName = saleProductNameInput.value.trim();
    const quantity = parseInt(saleQuantityInput.value);
    const unitPrice = parseFloat(saleUnitPriceInput.value);
    const paymentType = salePaymentTypeInput.value; // <--- CAMBIO: Capturar tipo de pago

    if (!productName || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
        alert('Por favor, ingresa un nombre de producto, cantidad y precio unitario válidos.');
        return;
    }

    const newSale = {
        id: generateUniqueId(),
        productName,
        quantity,
        unitPrice,
        paymentType, // <--- CAMBIO: Añadir paymentType al objeto de venta
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };

    sales.push(newSale);
    saveData('sales', sales);
    resetSaleForm();
    renderSales();
    updateRecentSalesActivity(newSale); // Actualiza la actividad reciente
    updateInventoryOnSale(productName, quantity, 'subtract');
    updateSummary();
};

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
                Producto: ${sale.productName} | Cantidad: ${sale.quantity} | Precio Unitario: $${sale.unitPrice.toFixed(2)} | Total: $${(sale.quantity * sale.unitPrice).toFixed(2)} | Fecha: ${sale.date} | Tipo: ${sale.paymentType ? (sale.paymentType === 'contado' ? 'Contado' : 'Crédito') : 'N/A'}
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

const editSale = (id) => {
    const sale = sales.find(s => s.id === id);
    if (sale) {
        selectedSaleId = id;
        saleProductNameInput.value = sale.productName;
        saleQuantityInput.value = sale.quantity;
        saleUnitPriceInput.value = sale.unitPrice;
        salePaymentTypeInput.value = sale.paymentType || 'contado'; // <--- CAMBIO: Asignar tipo de pago
        addSaleButton.style.display = 'none';
        updateSaleButton.style.display = 'inline-block';
        deleteSelectedSaleButton.style.display = 'inline-block';

        document.querySelectorAll('#salesList li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#salesList li[data-id="${id}"]`).classList.add('selected');
    }
};

const updateSale = () => {
    if (!selectedSaleId) return;

    const productName = saleProductNameInput.value.trim();
    const quantity = parseInt(saleQuantityInput.value);
    const unitPrice = parseFloat(saleUnitPriceInput.value);
    const paymentType = salePaymentTypeInput.value; // <--- CAMBIO: Capturar tipo de pago

    if (!productName || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
        alert('Por favor, ingresa un nombre de producto, cantidad y precio unitario válidos.');
        return;
    }

    const saleIndex = sales.findIndex(s => s.id === selectedSaleId);
    if (saleIndex !== -1) {
        const oldQuantity = sales[saleIndex].quantity;
        sales[saleIndex] = {
            id: selectedSaleId,
            productName,
            quantity,
            unitPrice,
            paymentType, // <--- CAMBIO: Actualizar paymentType en el objeto de venta
            date: sales[saleIndex].date // Mantener la fecha original
        };
        saveData('sales', sales);
        renderSales();
        resetSaleForm();
        updateInventoryOnSale(productName, quantity, 'update', oldQuantity);
        updateSummary();
    }
};

const deleteSale = (id) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (saleToDelete) {
        sales = sales.filter(s => s.id !== id);
        saveData('sales', sales);
        renderSales();
        resetSaleForm();
        updateInventoryOnSale(saleToDelete.productName, saleToDelete.quantity, 'add'); // Devolver stock
        updateSummary();
    }
};

const filterSales = () => {
    const searchProduct = searchSaleProductInput.value.toLowerCase();
    const startDate = filterSaleStartDateInput.value ? new Date(filterSaleStartDateInput.value).getTime() : 0;
    const endDate = filterSaleEndDateInput.value ? new Date(filterSaleEndDateInput.value).getTime() : Infinity;

    const filtered = sales.filter(sale => {
        const saleDate = new Date(sale.date.split('/').reverse().join('-')).getTime(); // Convertir DD/MM/YYYY a YYYY-MM-DD para Date
        const matchesProduct = sale.productName.toLowerCase().includes(searchProduct);
        const matchesDate = saleDate >= startDate && saleDate <= endDate;
        return matchesProduct && matchesDate;
    });
    renderSales(filtered);
};

const clearSaleFilters = () => {
    searchSaleProductInput.value = '';
    filterSaleStartDateInput.value = '';
    filterSaleEndDateInput.value = '';
    renderSales();
};

const resetSaleForm = () => {
    selectedSaleId = null;
    saleProductNameInput.value = '';
    saleQuantityInput.value = '';
    saleUnitPriceInput.value = '';
    salePaymentTypeInput.value = 'contado'; // <--- CAMBIO: Resetear tipo de pago a 'contado'
    addSaleButton.style.display = 'inline-block';
    updateSaleButton.style.display = 'none';
    deleteSelectedSaleButton.style.display = 'none';
    document.querySelectorAll('#salesList li').forEach(li => li.classList.remove('selected'));
};

const clearAllSales = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las ventas? Esta acción no se puede deshacer.')) {
        // Antes de eliminar las ventas, devolver el stock al inventario
        sales.forEach(sale => {
            updateInventoryOnSale(sale.productName, sale.quantity, 'add');
        });
        sales = [];
        saveData('sales', sales);
        renderSales();
        updateSummary();
    }
};

// --- Event Listeners para Ventas ---
addSaleButton.addEventListener('click', addSale);
updateSaleButton.addEventListener('click', updateSale);
deleteSelectedSaleButton.addEventListener('click', () => {
    if (selectedSaleId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
            deleteSale(selectedSaleId);
        }
    }
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
applySaleFiltersButton.addEventListener('click', filterSales);
clearSaleFiltersButton.addEventListener('click', clearSaleFilters);
clearAllSalesButton.addEventListener('click', clearAllSales);


// --- Gestión de Clientes ---
const clientNameInput = document.getElementById('clientName');
const clientAliasInput = document.getElementById('clientAlias');
const clientContactInput = document.getElementById('clientContact');
const clientAddressInput = document.getElementById('clientAddress');
const clientNotesInput = document.getElementById('clientNotes');
const addClientButton = document.getElementById('addClient');
const updateClientButton = document.getElementById('updateClient');
const deleteSelectedClientButton = document.getElementById('deleteSelectedClient');
const clientList = document.getElementById('clientList');
const searchClientNameInput = document.getElementById('searchClientName');
const applyClientFiltersButton = document.getElementById('applyClientFilters');
const clearClientFiltersButton = document.getElementById('clearClientFilters');
const clearAllClientsButton = document.getElementById('clearAllClients');

const loadClients = () => {
    clients = loadData('clients');
};

const addClient = () => {
    const name = clientNameInput.value.trim();
    const alias = clientAliasInput.value.trim();
    const contact = clientContactInput.value.trim();
    const address = clientAddressInput.value.trim();
    const notes = clientNotesInput.value.trim();

    if (!name) {
        alert('Por favor, ingresa el nombre del cliente.');
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
    updateSummary();
};

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
                Nombre: ${client.name} ${client.alias ? `(${client.alias})` : ''} | Contacto: ${client.contact || 'N/A'} | Dirección: ${client.address || 'N/A'}
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

const editClient = (id) => {
    const client = clients.find(c => c.id === id);
    if (client) {
        selectedClientId = id;
        clientNameInput.value = client.name;
        clientAliasInput.value = client.alias;
        clientContactInput.value = client.contact;
        clientAddressInput.value = client.address;
        clientNotesInput.value = client.notes;
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

    if (!name) {
        alert('Por favor, ingresa el nombre del cliente.');
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
        updateSummary();
    }
};

const deleteClient = (id) => {
    clients = clients.filter(c => c.id !== id);
    saveData('clients', clients);
    renderClients();
    resetClientForm();
    updateSummary();
};

const filterClients = () => {
    const searchTerm = searchClientNameInput.value.toLowerCase();
    const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.alias.toLowerCase().includes(searchTerm)
    );
    renderClients(filtered);
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

const clearAllClients = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los clientes? Esta acción no se puede deshacer.')) {
        clients = [];
        saveData('clients', clients);
        renderClients();
        updateSummary();
    }
};

// --- Event Listeners para Clientes ---
addClientButton.addEventListener('click', addClient);
updateClientButton.addEventListener('click', updateClient);
deleteSelectedClientButton.addEventListener('click', () => {
    if (selectedClientId) {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            deleteClient(selectedClientId);
        }
    }
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
applyClientFiltersButton.addEventListener('click', filterClients);
clearClientFiltersButton.addEventListener('click', resetClientForm); // Asumiendo que "Limpiar Filtros" resetea el formulario y muestra todos
clearAllClientsButton.addEventListener('click', clearAllClients);


// --- Gestión de Productos de Yogurt ---
const yogurtNameInput = document.getElementById('yogurtName');
const yogurtFlavorInput = document.getElementById('yogurtFlavor');
const yogurtPriceInput = document.getElementById('yogurtPrice');
const yogurtAdditionalPricesInput = document.getElementById('yogurtAdditionalPrices'); // <--- CAMBIO: Nuevo elemento
const yogurtExpirationDateInput = document.getElementById('yogurtExpirationDate'); // <--- CAMBIO: Nuevo elemento
const yogurtAdditionalInfoInput = document.getElementById('yogurtAdditionalInfo'); // <--- CAMBIO: Nuevo elemento
const yogurtImageInput = document.getElementById('yogurtImage'); // <--- CAMBIO: Nuevo elemento
const currentYogurtImagePreview = document.getElementById('currentYogurtImagePreview'); // <--- CAMBIO: Nuevo elemento

const addYogurtButton = document.getElementById('addYogurt');
const updateYogurtButton = document.getElementById('updateYogurt');
const deleteSelectedYogurtButton = document.getElementById('deleteSelectedYogurt');
const yogurtList = document.getElementById('yogurtList');
const searchYogurtNameInput = document.getElementById('searchYogurtName');
const applyYogurtFiltersButton = document.getElementById('applyYogurtFilters');
const clearYogurtFiltersButton = document.getElementById('clearYogurtFilters');
const clearAllYogurtsButton = document.getElementById('clearAllYogurts');

const loadYogurts = () => {
    yogurts = loadData('yogurts');
};

// <--- CAMBIO: Event Listener para previsualizar la imagen del yogurt
yogurtImageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentYogurtImagePreview.src = e.target.result;
            currentYogurtImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file); // Convierte la imagen a Base64
    } else {
        currentYogurtImagePreview.src = '#';
        currentYogurtImagePreview.style.display = 'none';
    }
});

const addYogurt = () => {
    const name = yogurtNameInput.value.trim();
    const flavor = yogurtFlavorInput.value.trim();
    const price = parseFloat(yogurtPriceInput.value);
    const additionalPrices = yogurtAdditionalPricesInput.value.trim(); // <--- CAMBIO: Capturar valor
    const expirationDate = yogurtExpirationDateInput.value; // <--- CAMBIO: Capturar valor
    const additionalInfo = yogurtAdditionalInfoInput.value.trim(); // <--- CAMBIO: Capturar valor
    const imageFile = yogurtImageInput.files[0]; // <--- CAMBIO: Capturar archivo de imagen

    if (!name || !flavor || isNaN(price) || price <= 0) {
        alert('Por favor, ingresa un nombre, sabor y precio válido para el producto de yogurt.');
        return;
    }

    // Manejo de la imagen (convertir a Base64)
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newYogurt = {
                id: generateUniqueId(),
                name,
                flavor,
                price,
                additionalPrices, // <--- CAMBIO: Añadir al objeto
                expirationDate, // <--- CAMBIO: Añadir al objeto
                additionalInfo, // <--- CAMBIO: Añadir al objeto
                image: e.target.result // <--- CAMBIO: Guardar imagen como Base64
            };
            yogurts.push(newYogurt);
            saveData('yogurts', yogurts);
            resetYogurtForm();
            renderYogurts();
            updateSummary();
        };
        reader.readAsDataURL(imageFile); // Lee el archivo como URL de datos (Base64)
    } else {
        // Si no hay imagen, guarda el producto sin ella
        const newYogurt = {
            id: generateUniqueId(),
            name,
            flavor,
            price,
            additionalPrices, // <--- CAMBIO: Añadir al objeto
            expirationDate, // <--- CAMBIO: Añadir al objeto
            additionalInfo, // <--- CAMBIO: Añadir al objeto
            image: null // <--- CAMBIO: Sin imagen
        };
        yogurts.push(newYogurt);
        saveData('yogurts', yogurts);
        resetYogurtForm();
        renderYogurts();
        updateSummary();
    }
};

const renderYogurts = (filteredYogurts = yogurts) => {
    yogurtList.innerHTML = '';
    if (filteredYogurts.length === 0) {
        yogurtList.innerHTML = '<p>No hay productos de yogurt registrados.</p>';
        return;
    }
    filteredYogurts.forEach(yogurt => {
        const li = document.createElement('li');
        li.dataset.id = yogurt.id;

        // <--- CAMBIO: Mostrar la imagen si existe
        const imageHtml = yogurt.image ? `<img src="${yogurt.image}" alt="${yogurt.name}" style="max-width: 80px; max-height: 80px; margin-right: 15px; border-radius: 5px; object-fit: cover;">` : '';

        li.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                ${imageHtml}
                <span style="flex-grow: 1;">
                    <strong>${yogurt.name}</strong> (${yogurt.flavor}) <br>
                    Precio Sugerido: $${yogurt.price.toFixed(2)}
                    ${yogurt.additionalPrices ? `<br>Precios Adicionales: ${yogurt.additionalPrices}` : ''}
                    ${yogurt.expirationDate ? `<br>Caducidad: ${yogurt.expirationDate}` : ''}
                    ${yogurt.additionalInfo ? `<br>Info Adicional: ${yogurt.additionalInfo}` : ''}
                </span>
                <div class="item-actions">
                    <button class="btn-icon edit-yogurt" data-id="${yogurt.id}">✏️</button>
                    <button class="btn-icon delete-yogurt" data-id="${yogurt.id}">🗑️</button>
                </div>
            </div>
        `;
        yogurtList.appendChild(li);
    });
    document.getElementById('totalYogurtsResumen').textContent = yogurts.length;
};

const editYogurt = (id) => {
    const yogurt = yogurts.find(y => y.id === id);
    if (yogurt) {
        selectedYogurtId = id;
        yogurtNameInput.value = yogurt.name;
        yogurtFlavorInput.value = yogurt.flavor;
        yogurtPriceInput.value = yogurt.price;
        yogurtAdditionalPricesInput.value = yogurt.additionalPrices || ''; // <--- CAMBIO: Cargar valor
        yogurtExpirationDateInput.value = yogurt.expirationDate || ''; // <--- CAMBIO: Cargar valor
        yogurtAdditionalInfoInput.value = yogurt.additionalInfo || ''; // <--- CAMBIO: Cargar valor

        // <--- CAMBIO: Mostrar la imagen existente si hay
        if (yogurt.image) {
            currentYogurtImagePreview.src = yogurt.image;
            currentYogurtImagePreview.style.display = 'block';
        } else {
            currentYogurtImagePreview.src = '#';
            currentYogurtImagePreview.style.display = 'none';
        }
        yogurtImageInput.value = ''; // Limpiar el input file para que no muestre "fakepath"

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
    const additionalPrices = yogurtAdditionalPricesInput.value.trim(); // <--- CAMBIO: Capturar valor
    const expirationDate = yogurtExpirationDateInput.value; // <--- CAMBIO: Capturar valor
    const additionalInfo = yogurtAdditionalInfoInput.value.trim(); // <--- CAMBIO: Capturar valor
    const imageFile = yogurtImageInput.files[0]; // <--- CAMBIO: Capturar archivo de imagen

    if (!name || !flavor || isNaN(price) || price <= 0) {
        alert('Por favor, ingresa un nombre, sabor y precio válido para el producto de yogurt.');
        return;
    }

    const yogurtIndex = yogurts.findIndex(y => y.id === selectedYogurtId);
    if (yogurtIndex !== -1) {
        const currentYogurt = yogurts[yogurtIndex]; // Obtener la versión actual para mantener la imagen si no se cambia

        // <--- CAMBIO: Manejo de la imagen al actualizar
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                yogurts[yogurtIndex] = {
                    id: selectedYogurtId,
                    name,
                    flavor,
                    price,
                    additionalPrices,
                    expirationDate,
                    additionalInfo,
                    image: e.target.result // Nueva imagen
                };
                saveData('yogurts', yogurts);
                renderYogurts();
                resetYogurtForm();
                updateSummary();
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Si no se selecciona una nueva imagen, mantener la existente
            yogurts[yogurtIndex] = {
                id: selectedYogurtId,
                name,
                flavor,
                price,
                additionalPrices,
                expirationDate,
                additionalInfo,
                image: currentYogurt.image // Mantener la imagen existente
            };
            saveData('yogurts', yogurts);
            renderYogurts();
            resetYogurtForm();
            updateSummary();
        }
    }
};

const deleteYogurt = (id) => {
    yogurts = yogurts.filter(y => y.id !== id);
    saveData('yogurts', yogurts);
    renderYogurts();
    resetYogurtForm();
    updateSummary();
};

const filterYogurts = () => {
    const searchTerm = searchYogurtNameInput.value.toLowerCase();
    const filtered = yogurts.filter(yogurt =>
        yogurt.name.toLowerCase().includes(searchTerm) ||
        yogurt.flavor.toLowerCase().includes(searchTerm) ||
        (yogurt.additionalInfo && yogurt.additionalInfo.toLowerCase().includes(searchTerm)) ||
        (yogurt.additionalPrices && yogurt.additionalPrices.toLowerCase().includes(searchTerm))
    );
    renderYogurts(filtered);
};

const resetYogurtForm = () => {
    selectedYogurtId = null;
    yogurtNameInput.value = '';
    yogurtFlavorInput.value = '';
    yogurtPriceInput.value = '';
    yogurtAdditionalPricesInput.value = ''; // <--- CAMBIO: Resetear campo
    yogurtExpirationDateInput.value = ''; // <--- CAMBIO: Resetear campo
    yogurtAdditionalInfoInput.value = ''; // <--- CAMBIO: Resetear campo
    yogurtImageInput.value = ''; // <--- CAMBIO: Limpiar el input file
    currentYogurtImagePreview.src = '#'; // <--- CAMBIO: Limpiar la previsualización
    currentYogurtImagePreview.style.display = 'none'; // <--- CAMBIO: Ocultar la previsualización

    addYogurtButton.style.display = 'inline-block';
    updateYogurtButton.style.display = 'none';
    deleteSelectedYogurtButton.style.display = 'none';
    document.querySelectorAll('#yogurtList li').forEach(li => li.classList.remove('selected'));
};

const clearAllYogurts = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los productos de yogurt? Esta acción no se puede deshacer.')) {
        yogurts = [];
        saveData('yogurts', yogurts);
        renderYogurts();
        updateSummary();
    }
};

// --- Event Listeners para Productos de Yogurt ---
addYogurtButton.addEventListener('click', addYogurt);
updateYogurtButton.addEventListener('click', updateYogurt);
deleteSelectedYogurtButton.addEventListener('click', () => {
    if (selectedYogurtId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto de yogurt?')) {
            deleteYogurt(selectedYogurtId);
        }
    }
});
yogurtList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-yogurt')) {
        editYogurt(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-yogurt')) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto de yogurt?')) {
            deleteYogurt(event.target.dataset.id);
        }
    } else if (event.target.tagName === 'SPAN' || event.target.tagName === 'STRONG' || event.target.tagName === 'IMG') { // Permitir selección al hacer clic en el texto o imagen
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
applyYogurtFiltersButton.addEventListener('click', filterYogurts);
clearYogurtFiltersButton.addEventListener('click', resetYogurtForm); // Asumiendo que "Limpiar Filtros" resetea el formulario y muestra todos
clearAllYogurtsButton.addEventListener('click', clearAllYogurts);


// --- Gestión de Inventario ---
const inventoryProductNameInput = document.getElementById('inventoryProductName');
const inventoryStockInput = document.getElementById('inventoryStock');
const addInventoryButton = document.getElementById('addInventory');
const updateInventoryButton = document.getElementById('updateInventory');
const deleteInventoryItemButton = document.getElementById('deleteSelectedInventory');
const inventoryList = document.getElementById('inventoryList');
const searchInventoryProductInput = document.getElementById('searchInventoryProduct');
const applyInventoryFiltersButton = document.getElementById('applyInventoryFilters');
const clearInventoryFiltersButton = document.getElementById('clearInventoryFilters');
const clearAllInventoryButton = document.getElementById('clearAllInventory');

const loadInventory = () => {
    inventory = loadData('inventory');
};

const addOrUpdateInventory = () => {
    const productName = inventoryProductNameInput.value.trim();
    const stock = parseInt(inventoryStockInput.value);

    if (!productName || isNaN(stock) || stock < 0) {
        alert('Por favor, ingresa un nombre de producto y una cantidad de stock válidos.');
        return;
    }

    const existingItemIndex = inventory.findIndex(item => item.productName.toLowerCase() === productName.toLowerCase());

    if (existingItemIndex !== -1) {
        // Actualizar stock de un producto existente
        inventory[existingItemIndex].stock = stock;
    } else {
        // Añadir nuevo producto al inventario
        const newInventoryItem = {
            id: generateUniqueId(),
            productName,
            stock
        };
        inventory.push(newInventoryItem);
    }
    saveData('inventory', inventory);
    resetInventoryForm();
    renderInventory();
    updateSummary();
};

const renderInventory = (filteredInventory = inventory) => {
    inventoryList.innerHTML = '';
    if (filteredInventory.length === 0) {
        inventoryList.innerHTML = '<p>Cargando inventario...</p>';
        return;
    }
    filteredInventory.forEach(item => {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        li.innerHTML = `
            <span>Producto: ${item.productName} | Stock: ${item.stock} unidades</span>
            <div class="item-actions">
                <button class="btn-icon edit-inventory" data-id="${item.id}">✏️</button>
                <button class="btn-icon delete-inventory" data-id="${item.id}">🗑️</button>
            </div>
        `;
        inventoryList.appendChild(li);
    });
    document.getElementById('totalInventoryItemsResumen').textContent = inventory.length;
    document.getElementById('currentTotalStockResumen').textContent = `${inventory.reduce((sum, item) => sum + item.stock, 0)} unidades`;
};

const editInventoryItem = (id) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
        selectedInventoryItemId = id;
        inventoryProductNameInput.value = item.productName;
        inventoryStockInput.value = item.stock;
        addInventoryButton.style.display = 'none';
        updateInventoryButton.style.display = 'inline-block';
        deleteInventoryItemButton.style.display = 'inline-block';

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

const filterInventory = () => {
    const searchTerm = searchInventoryProductInput.value.toLowerCase();
    const filtered = inventory.filter(item =>
        item.productName.toLowerCase().includes(searchTerm)
    );
    renderInventory(filtered);
};

const resetInventoryForm = () => {
    selectedInventoryItemId = null;
    inventoryProductNameInput.value = '';
    inventoryStockInput.value = '';
    addInventoryButton.style.display = 'inline-block';
    updateInventoryButton.style.display = 'none';
    deleteInventoryItemButton.style.display = 'none';
    document.querySelectorAll('#inventoryList li').forEach(li => li.classList.remove('selected'));
};

const clearAllInventory = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODO el inventario? Esta acción no se puede deshacer.')) {
        inventory = [];
        saveData('inventory', inventory);
        renderInventory();
        updateSummary();
    }
};

// Función para actualizar el inventario cuando se registra una venta
const updateInventoryOnSale = (productName, quantitySold, type, oldQuantity = 0) => {
    const itemIndex = inventory.findIndex(item => item.productName.toLowerCase() === productName.toLowerCase());

    if (itemIndex !== -1) {
        if (type === 'subtract') {
            inventory[itemIndex].stock -= quantitySold;
        } else if (type === 'add') { // Cuando se elimina una venta, se devuelve el stock
            inventory[itemIndex].stock += quantitySold;
        } else if (type === 'update') { // Cuando se actualiza una venta
            inventory[itemIndex].stock += oldQuantity; // Devolver la cantidad antigua
            inventory[itemIndex].stock -= quantitySold; // Restar la nueva cantidad
        }
        // Asegurarse de que el stock no sea negativo
        if (inventory[itemIndex].stock < 0) {
            inventory[itemIndex].stock = 0;
        }
        saveData('inventory', inventory);
        renderInventory();
        updateSummary();
    }
};


// --- Event Listeners para Inventario ---
addInventoryButton.addEventListener('click', addOrUpdateInventory);
updateInventoryButton.addEventListener('click', addOrUpdateInventory); // Reusa la misma función
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


// --- Gestión de Reportes ---
let barChartInstance;
let pieChartInstance;
let lineChartInstance;

const barChartCanvas = document.getElementById('barChart');
const pieChartCanvas = document.getElementById('pieChart');
const lineChartCanvas = document.getElementById('lineChart');

const generateReports = () => {
    // Destruir gráficos previos si existen
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    if (lineChartInstance) lineChartInstance.destroy();

    // Mostrar canvases
    barChartCanvas.style.display = 'block';
    pieChartCanvas.style.display = 'block';
    lineChartCanvas.style.display = 'block';

    // Datos para Ventas por Producto (Barras)
    const salesByProduct = sales.reduce((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
        return acc;
    }, {});

    const barLabels = Object.keys(salesByProduct);
    const barData = Object.values(salesByProduct);

    barChartInstance = new Chart(barChartCanvas, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: barData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e0' // Color del texto del eje Y
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e0' // Color del texto del eje X
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e0' // Color del texto de la leyenda
                    }
                }
            }
        }
    });

    // Datos para Distribución de Ventas (Valor) (Pastel)
    const salesValueByProduct = sales.reduce((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + (sale.quantity * sale.unitPrice);
        return acc;
    }, {});

    const pieLabels = Object.keys(salesValueByProduct);
    const pieData = Object.values(salesValueByProduct);

    barChartInstance = new Chart(pieChartCanvas, {
        type: 'pie',
        data: {
            labels: pieLabels,
            datasets: [{
                label: 'Valor de Ventas ($)',
                data: pieData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e0' // Color del texto de la leyenda
                    }
                }
            }
        }
    });

    // Datos para Ventas Diarias (Línea)
    const salesByDate = sales.reduce((acc, sale) => {
        // Asegúrate de que la fecha sea consistente (ej. DD/MM/YYYY)
        const date = sale.date;
        acc[date] = (acc[date] || 0) + (sale.quantity * sale.unitPrice);
        return acc;
    }, {});

    // Ordenar las fechas cronológicamente
    const sortedDates = Object.keys(salesByDate).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/');
        const dateA = new Date(`${monthA}/${dayA}/${yearA}`);
        const [dayB, monthB, yearB] = b.split('/');
        const dateB = new Date(`${monthB}/${dayB}/${yearB}`);
        return dateA - dateB;
    });

    const lineLabels = sortedDates;
    const lineData = sortedDates.map(date => salesByDate[date]);

    lineChartInstance = new Chart(lineChartCanvas, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Ventas Diarias ($)',
                data: lineData,
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e0' // Color del texto del eje Y
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e0' // Color del texto del eje X
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e0' // Color del texto de la leyenda
                    }
                }
            }
        }
    });
};


// --- Event Listener para Reportes ---
document.getElementById('generateReports').addEventListener('click', generateReports);

// Inicialización
loadAllData(); // Cargar todos los datos al inicio
updateSummary(); // Asegura que el resumen se cargue con los datos existentes

// Event listener para la carga inicial de la página para la pestaña activa
document.addEventListener('DOMContentLoaded', () => {
    const storedTab = localStorage.getItem('activeTab');
    if (storedTab) {
        openTab(storedTab);
    } else {
        openTab('resumen'); // Pestaña por defecto
    }
});
