document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Pestañas (Modificada para recordar la pestaña) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Función para activar una pestaña específica y guardar en localStorage
    function activateTab(tabId) {
        // Remover la clase 'active' de todos los botones y contenidos
        tabButtons.forEach(button => button.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Añadir la clase 'active' al botón y contenido de la pestaña seleccionada
        const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);

        if (targetButton && targetContent) {
            targetButton.classList.add('active');
            targetContent.classList.add('active');
            // Guardar el ID de la pestaña activa en localStorage
            localStorage.setItem('activeTab', tabId);
        } else {
            console.warn(`No se encontró el botón o contenido para la pestaña: ${tabId}. Volviendo a la pestaña predeterminada.`);
            // Si la pestaña guardada no existe o es inválida, volvemos a la pestaña 'resumen'
            activateTab('resumen');
        }
    }

    // Manejador de eventos para los clics en los botones de pestaña
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            activateTab(tabId);
        });
    });

    // Al cargar la página, verificar si hay una pestaña guardada en localStorage
    const savedTab = localStorage.getItem('activeTab');

    if (savedTab) {
        // Si hay una pestaña guardada, activarla
        activateTab(savedTab);
    } else {
        // Si no hay ninguna pestaña guardada, activar la pestaña 'resumen' por defecto
        activateTab('resumen');
    }

    // --- Variables globales y funciones de utilidad ---
    let selectedSaleId = null;
    let selectedClientId = null;
    let selectedYogurtId = null;
    let selectedInventoryId = null;

    // Utilidad para generar IDs únicos
    const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    // --- Funciones de Persistencia (LocalStorage) ---
    const loadData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };

    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // --- Gestión de Ventas ---
    const sales = loadData('sales');
    const salesList = document.getElementById('salesList');
    const saleProductNameInput = document.getElementById('saleProductName');
    const saleQuantityInput = document.getElementById('saleQuantity');
    const saleUnitPriceInput = document.getElementById('saleUnitPrice');
    const addSaleButton = document.getElementById('addSale');
    const updateSaleButton = document.getElementById('updateSale');
    const deleteSelectedSaleButton = document.getElementById('deleteSelectedSale');
    const clearAllSalesButton = document.getElementById('clearAllSales');
    const totalSalesSummaryElement = document.getElementById('totalSalesSummary');
    const searchSaleProductInput = document.getElementById('searchSaleProduct');
    const filterSaleStartDateInput = document.getElementById('filterSaleStartDate');
    const filterSaleEndDateInput = document.getElementById('filterSaleEndDate');
    const applySaleFiltersButton = document.getElementById('applySaleFilters');
    const clearSaleFiltersButton = document.getElementById('clearSaleFilters');

    const updateSalesSummary = () => {
        const total = sales.reduce((sum, sale) => sum + (sale.quantity * sale.unitPrice), 0);
        totalSalesSummaryElement.textContent = `Total de ventas: $${total.toFixed(2)}`;
        // Actualizar resumen en la pestaña de Resumen
        document.getElementById('totalSalesSummaryResumen').textContent = `$${total.toFixed(2)}`;
        const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        document.getElementById('totalUnitsSoldResumen').textContent = `${totalUnits} unidades`;

        updateRecentSalesActivity(); // Actualiza la actividad reciente cada vez que se actualizan las ventas
    };

    const renderSales = (filteredSales = sales) => {
        salesList.innerHTML = '';
        if (filteredSales.length === 0) {
            salesList.innerHTML = '<p>No hay ventas registradas.</p>';
            return;
        }
        filteredSales.forEach(sale => {
            const li = document.createElement('li');
            li.dataset.id = sale.id;
            li.innerHTML = `
                <span>${sale.productName} - ${sale.quantity} unid. @ $${sale.unitPrice.toFixed(2)} c/u = <b>$${(sale.quantity * sale.unitPrice).toFixed(2)}</b> (${new Date(sale.date).toLocaleDateString()})</span>
                <div class="item-actions">
                    <button class="btn-icon edit-sale" data-id="${sale.id}">✏️</button>
                    <button class="btn-icon delete-sale" data-id="${sale.id}">🗑️</button>
                </div>
            `;
            salesList.appendChild(li);
        });
        updateSalesSummary();
    };

    const addSale = () => {
        const productName = saleProductNameInput.value.trim();
        const quantity = parseInt(saleQuantityInput.value);
        const unitPrice = parseFloat(saleUnitPriceInput.value);

        if (!productName || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
            alert('Por favor, ingresa un nombre de producto, una cantidad válida y un precio unitario válido para la venta.');
            return;
        }

        // Verificar inventario antes de registrar la venta
        const inventoryItem = inventory.find(item => item.productName.toLowerCase() === productName.toLowerCase());
        if (!inventoryItem || inventoryItem.quantity < quantity) {
            alert(`No hay suficiente stock de "${productName}". Stock disponible: ${inventoryItem ? inventoryItem.quantity : 0}`);
            return;
        }

        const newSale = {
            id: generateUniqueId(),
            productName,
            quantity,
            unitPrice,
            date: new Date().toISOString()
        };
        sales.push(newSale);
        saveData('sales', sales);
        // Descontar del inventario
        inventoryItem.quantity -= quantity;
        saveData('inventory', inventory);
        renderInventory(); // Volver a renderizar el inventario para reflejar el cambio
        updateSummaryCounts(); // Actualizar el stock total en resumen

        saleProductNameInput.value = '';
        saleQuantityInput.value = '';
        saleUnitPriceInput.value = '';
        renderSales();
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

            // Resaltar el elemento seleccionado en la lista
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
            alert('Por favor, ingresa un nombre de producto, una cantidad válida y un precio unitario válido para la venta.');
            return;
        }

        const saleIndex = sales.findIndex(s => s.id === selectedSaleId);
        if (saleIndex !== -1) {
            const originalSale = sales[saleIndex];
            const oldQuantity = originalSale.quantity;
            const quantityDifference = quantity - oldQuantity; // Diferencia de cantidad

            // Ajustar inventario si la cantidad cambia
            const inventoryItem = inventory.find(item => item.productName.toLowerCase() === productName.toLowerCase());

            if (inventoryItem) {
                // Verificar si hay suficiente stock para el nuevo cambio
                if (inventoryItem.quantity < quantityDifference && quantityDifference > 0) {
                    alert(`No hay suficiente stock de "${productName}" para este ajuste. Stock disponible: ${inventoryItem.quantity}`);
                    return;
                }
                inventoryItem.quantity -= quantityDifference;
                saveData('inventory', inventory);
                renderInventory();
                updateSummaryCounts();
            } else if (quantityDifference > 0) { // Si es un nuevo producto o no estaba en inventario y aumenta la cantidad
                alert(`El producto "${productName}" no está en el inventario para poder ajustar la cantidad.`);
                return;
            }

            sales[saleIndex] = {
                ...originalSale,
                productName,
                quantity,
                unitPrice,
                date: new Date().toISOString() // Actualizar fecha de modificación
            };
            saveData('sales', sales);
            renderSales();
            resetSaleForm();
        }
    };

    const deleteSale = (idToDelete) => {
        const saleIndex = sales.findIndex(s => s.id === idToDelete);
        if (saleIndex !== -1) {
            const deletedSale = sales[saleIndex];
            // Devolver stock al inventario
            const inventoryItem = inventory.find(item => item.productName.toLowerCase() === deletedSale.productName.toLowerCase());
            if (inventoryItem) {
                inventoryItem.quantity += deletedSale.quantity;
                saveData('inventory', inventory);
                renderInventory();
                updateSummaryCounts();
            }
            sales.splice(saleIndex, 1);
            saveData('sales', sales);
            renderSales();
            resetSaleForm();
        }
    };

    const deleteSelectedSale = () => {
        if (selectedSaleId) {
            if (confirm('¿Estás seguro de que quieres eliminar la venta seleccionada?')) {
                deleteSale(selectedSaleId);
            }
        } else {
            alert('Por favor, selecciona una venta para eliminar.');
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

    const clearAllSales = () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODAS las ventas? Esta acción no se puede deshacer.')) {
            // Antes de limpiar todas las ventas, devolver el stock al inventario
            sales.forEach(sale => {
                const inventoryItem = inventory.find(item => item.productName.toLowerCase() === sale.productName.toLowerCase());
                if (inventoryItem) {
                    inventoryItem.quantity += sale.quantity;
                }
            });
            saveData('inventory', inventory); // Guardar inventario actualizado
            renderInventory(); // Renderizar inventario
            updateSummaryCounts(); // Actualizar resumen

            sales.length = 0; // Vaciar el array de ventas
            saveData('sales', sales);
            renderSales();
            resetSaleForm();
        }
    };

    const filterSales = () => {
        const searchTerm = searchSaleProductInput.value.toLowerCase();
        const startDate = filterSaleStartDateInput.value ? new Date(filterSaleStartDateInput.value) : null;
        const endDate = filterSaleEndDateInput.value ? new Date(filterSaleEndDateInput.value) : null;

        let filtered = sales.filter(sale => {
            const matchesSearch = sale.productName.toLowerCase().includes(searchTerm);
            const saleDate = new Date(sale.date);

            let matchesDate = true;
            if (startDate && saleDate < startDate) {
                matchesDate = false;
            }
            if (endDate && saleDate > endDate) {
                // Ajustar endDate para incluir todo el día seleccionado
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
                if (saleDate >= adjustedEndDate) {
                    matchesDate = false;
                }
            }
            return matchesSearch && matchesDate;
        });
        renderSales(filtered);
    };

    // Event Listeners de Ventas
    addSaleButton.addEventListener('click', addSale);
    updateSaleButton.addEventListener('click', updateSale);
    deleteSelectedSaleButton.addEventListener('click', deleteSelectedSale);
    clearAllSalesButton.addEventListener('click', clearAllSales);
    applySaleFiltersButton.addEventListener('click', filterSales);
    clearSaleFiltersButton.addEventListener('click', () => {
        searchSaleProductInput.value = '';
        filterSaleStartDateInput.value = '';
        filterSaleEndDateInput.value = '';
        renderSales();
    });

    salesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-sale')) {
            editSale(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-sale')) {
            if (confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
                deleteSale(event.target.dataset.id);
            }
        } else if (event.target.tagName === 'SPAN') {
            const li = event.target.closest('li');
            if (li) {
                const id = li.dataset.id;
                // Deseleccionar si ya estaba seleccionado
                if (selectedSaleId === id) {
                    resetSaleForm();
                } else {
                    editSale(id);
                }
            }
        }
    });

    // --- Gestión de Clientes ---
    const clients = loadData('clients');
    const clientList = document.getElementById('clientList');
    const clientNameInput = document.getElementById('clientName');
    const clientContactInput = document.getElementById('clientContact');
    const addClientButton = document.getElementById('addClient');
    const updateClientButton = document.getElementById('updateClient');
    const deleteSelectedClientButton = document.getElementById('deleteSelectedClient');
    const clearAllClientsButton = document.getElementById('clearAllClients');

    const renderClients = () => {
        clientList.innerHTML = '';
        if (clients.length === 0) {
            clientList.innerHTML = '<p>No hay clientes registrados.</p>';
            return;
        }
        clients.forEach(client => {
            const li = document.createElement('li');
            li.dataset.id = client.id;
            li.innerHTML = `
                <span>${client.name} - ${client.contact}</span>
                <div class="item-actions">
                    <button class="btn-icon edit-client" data-id="${client.id}">✏️</button>
                    <button class="btn-icon delete-client" data-id="${client.id}">🗑️</button>
                </div>
            `;
            clientList.appendChild(li);
        });
        document.getElementById('totalClientsResumen').textContent = clients.length; // Actualizar resumen
    };

    const addClient = () => {
        const name = clientNameInput.value.trim();
        const contact = clientContactInput.value.trim();
        if (!name || !contact) {
            alert('Por favor, ingresa el nombre y el contacto del cliente.');
            return;
        }
        const newClient = { id: generateUniqueId(), name, contact };
        clients.push(newClient);
        saveData('clients', clients);
        clientNameInput.value = '';
        clientContactInput.value = '';
        renderClients();
    };

    const editClient = (id) => {
        const client = clients.find(c => c.id === id);
        if (client) {
            selectedClientId = id;
            clientNameInput.value = client.name;
            clientContactInput.value = client.contact;
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
        const contact = clientContactInput.value.trim();
        if (!name || !contact) {
            alert('Por favor, ingresa el nombre y el contacto del cliente.');
            return;
        }
        const clientIndex = clients.findIndex(c => c.id === selectedClientId);
        if (clientIndex !== -1) {
            clients[clientIndex] = { id: selectedClientId, name, contact };
            saveData('clients', clients);
            renderClients();
            resetClientForm();
        }
    };

    const deleteClient = (idToDelete) => {
        const clientIndex = clients.findIndex(c => c.id === idToDelete);
        if (clientIndex !== -1) {
            clients.splice(clientIndex, 1);
            saveData('clients', clients);
            renderClients();
            resetClientForm();
        }
    };

    const deleteSelectedClient = () => {
        if (selectedClientId) {
            if (confirm('¿Estás seguro de que quieres eliminar el cliente seleccionado?')) {
                deleteClient(selectedClientId);
            }
        } else {
            alert('Por favor, selecciona un cliente para eliminar.');
        }
    };

    const resetClientForm = () => {
        selectedClientId = null;
        clientNameInput.value = '';
        clientContactInput.value = '';
        addClientButton.style.display = 'inline-block';
        updateClientButton.style.display = 'none';
        deleteSelectedClientButton.style.display = 'none';
        document.querySelectorAll('#clientList li').forEach(li => li.classList.remove('selected'));
    };

    const clearAllClients = () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los clientes? Esta acción no se puede deshacer.')) {
            clients.length = 0;
            saveData('clients', clients);
            renderClients();
            resetClientForm();
        }
    };

    // Event Listeners de Clientes
    addClientButton.addEventListener('click', addClient);
    updateClientButton.addEventListener('click', updateClient);
    deleteSelectedClientButton.addEventListener('click', deleteSelectedClient);
    clearAllClientsButton.addEventListener('click', clearAllClients);
    clientList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-client')) {
            editClient(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-client')) {
            if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                deleteClient(event.target.dataset.id);
            }
        } else if (event.target.tagName === 'SPAN') {
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

    // --- Gestión de Productos de Yogurt ---
    const yogurts = loadData('yogurts');
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
                <span>${yogurt.name} (${yogurt.flavor}) - $${yogurt.price.toFixed(2)}</span>
                <div class="item-actions">
                    <button class="btn-icon edit-yogurt" data-id="${yogurt.id}">✏️</button>
                    <button class="btn-icon delete-yogurt" data-id="${yogurt.id}">🗑️</button>
                </div>
            `;
            yogurtList.appendChild(li);
        });
        document.getElementById('totalYogurtsResumen').textContent = yogurts.length; // Actualizar resumen
    };

    const addYogurt = () => {
        const name = yogurtNameInput.value.trim();
        const flavor = yogurtFlavorInput.value.trim();
        const price = parseFloat(yogurtPriceInput.value);
        if (!name || !flavor || isNaN(price) || price <= 0) {
            alert('Por favor, ingresa un nombre, sabor y un precio válido para el producto.');
            return;
        }
        const newYogurt = { id: generateUniqueId(), name, flavor, price };
        yogurts.push(newYogurt);
        saveData('yogurts', yogurts);
        yogurtNameInput.value = '';
        yogurtFlavorInput.value = '';
        yogurtPriceInput.value = '';
        renderYogurts();
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
            alert('Por favor, ingresa un nombre, sabor y un precio válido para el producto.');
            return;
        }
        const yogurtIndex = yogurts.findIndex(y => y.id === selectedYogurtId);
        if (yogurtIndex !== -1) {
            yogurts[yogurtIndex] = { id: selectedYogurtId, name, flavor, price };
            saveData('yogurts', yogurts);
            renderYogurts();
            resetYogurtForm();
        }
    };

    const deleteYogurt = (idToDelete) => {
        const yogurtIndex = yogurts.findIndex(y => y.id === idToDelete);
        if (yogurtIndex !== -1) {
            yogurts.splice(yogurtIndex, 1);
            saveData('yogurts', yogurts);
            renderYogurts();
            resetYogurtForm();
        }
    };

    const deleteSelectedYogurt = () => {
        if (selectedYogurtId) {
            if (confirm('¿Estás seguro de que quieres eliminar el producto seleccionado?')) {
                deleteYogurt(selectedYogurtId);
            }
        } else {
            alert('Por favor, selecciona un producto para eliminar.');
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

    const clearAllYogurts = () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los productos de yogurt? Esta acción no se puede deshacer.')) {
            yogurts.length = 0;
            saveData('yogurts', yogurts);
            renderYogurts();
            resetYogurtForm();
        }
    };

    // Event Listeners de Productos de Yogurt
    addYogurtButton.addEventListener('click', addYogurt);
    updateYogurtButton.addEventListener('click', updateYogurt);
    deleteSelectedYogurtButton.addEventListener('click', deleteSelectedYogurt);
    clearAllYogurtsButton.addEventListener('click', clearAllYogurts);
    yogurtList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-yogurt')) {
            editYogurt(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-yogurt')) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                deleteYogurt(event.target.dataset.id);
            }
        } else if (event.target.tagName === 'SPAN') {
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

    // --- Gestión de Inventario ---
    const inventory = loadData('inventory');
    const inventoryList = document.getElementById('inventoryList');
    const inventoryProductNameInput = document.getElementById('inventoryProductName');
    const inventoryQuantityInput = document.getElementById('inventoryQuantity');
    const addOrUpdateInventoryButton = document.getElementById('addOrUpdateInventory');
    const deleteInventoryItemButton = document.getElementById('deleteInventoryItem');
    const clearAllInventoryButton = document.getElementById('clearAllInventory');

    const renderInventory = () => {
        inventoryList.innerHTML = '';
        if (inventory.length === 0) {
            inventoryList.innerHTML = '<p>No hay artículos en inventario.</p>';
            return;
        }
        inventory.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.innerHTML = `
                <span>${item.productName}: ${item.quantity} unidades</span>
                <div class="item-actions">
                    <button class="btn-icon edit-inventory" data-id="${item.id}">✏️</button>
                    <button class="btn-icon delete-inventory" data-id="${item.id}">🗑️</button>
                </div>
            `;
            inventoryList.appendChild(li);
        });
        updateSummaryCounts(); // Actualizar recuentos en resumen
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
            inventory[existingItemIndex].quantity = quantity;
        } else {
            // Añadir nuevo item
            const newInventoryItem = { id: generateUniqueId(), productName, quantity };
            inventory.push(newInventoryItem);
        }
        saveData('inventory', inventory);
        inventoryProductNameInput.value = '';
        inventoryQuantityInput.value = '';
        renderInventory();
    };

    const editInventory = (id) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            selectedInventoryId = id;
            inventoryProductNameInput.value = item.productName;
            inventoryQuantityInput.value = item.quantity;
            addOrUpdateInventoryButton.textContent = 'Actualizar Stock';
            deleteInventoryItemButton.style.display = 'inline-block';

            document.querySelectorAll('#inventoryList li').forEach(li => li.classList.remove('selected'));
            document.querySelector(`#inventoryList li[data-id="${id}"]`).classList.add('selected');
        }
    };

    const deleteInventoryItem = () => {
        if (!selectedInventoryId) return;
        if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
            const itemIndex = inventory.findIndex(item => item.id === selectedInventoryId);
            if (itemIndex !== -1) {
                inventory.splice(itemIndex, 1);
                saveData('inventory', inventory);
                renderInventory();
                resetInventoryForm();
            }
        }
    };

    const resetInventoryForm = () => {
        selectedInventoryId = null;
        inventoryProductNameInput.value = '';
        inventoryQuantityInput.value = '';
        addOrUpdateInventoryButton.textContent = 'Añadir/Actualizar Stock';
        deleteInventoryItemButton.style.display = 'none';
        document.querySelectorAll('#inventoryList li').forEach(li => li.classList.remove('selected'));
    };

    const clearAllInventory = () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODO el inventario? Esta acción no se puede deshacer.')) {
            inventory.length = 0;
            saveData('inventory', inventory);
            renderInventory();
            resetInventoryForm();
        }
    };

    // Event Listeners de Inventario
    addOrUpdateInventoryButton.addEventListener('click', addOrUpdateInventory);
    deleteInventoryItemButton.addEventListener('click', deleteInventoryItem);
    clearAllInventoryButton.addEventListener('click', clearAllInventory);
    inventoryList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-inventory')) {
            editInventory(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-inventory')) {
            if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
                // Si el item está siendo editado, resetear el formulario
                if (selectedInventoryId === event.target.dataset.id) {
                    resetInventoryForm();
                }
                deleteInventoryItem(event.target.dataset.id);
            }
        } else if (event.target.tagName === 'SPAN') {
            const li = event.target.closest('li');
            if (li) {
                const id = li.dataset.id;
                if (selectedInventoryId === id) {
                    resetInventoryForm();
                } else {
                    editInventory(id);
                }
            }
        }
    });

    // --- Reportes (Chart.js) ---
    const generateReportsButton = document.getElementById('generateReports');
    const barChartCanvas = document.getElementById('barChart');
    const pieChartCanvas = document.getElementById('pieChart');
    const lineChartCanvas = document.getElementById('lineChart');

    let barChartInstance = null;
    let pieChartInstance = null;
    let lineChartInstance = null;

    const generateReports = () => {
        // Destruir instancias de gráficos anteriores para evitar duplicados
        if (barChartInstance) barChartInstance.destroy();
        if (pieChartInstance) pieChartInstance.destroy();
        if (lineChartInstance) lineChartInstance.destroy();

        // Datos para Gráfico de Barras (Ventas por Producto)
        const productSales = {};
        sales.forEach(sale => {
            productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.quantity;
        });
        const barLabels = Object.keys(productSales);
        const barData = Object.values(productSales);

        barChartInstance = new Chart(barChartCanvas, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: barData,
                    backgroundColor: 'rgba(14, 165, 233, 0.6)', // Color primario
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e2e8f0' }, // Color para los ticks del eje Y
                        grid: { color: '#4a5568' } // Color para las líneas de la cuadrícula
                    },
                    x: {
                        ticks: { color: '#e2e8f0' }, // Color para los ticks del eje X
                        grid: { color: '#4a5568' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' } // Color para las etiquetas de la leyenda
                    }
                }
            }
        });

        // Datos para Gráfico de Pastel (Distribución de Ventas por Valor)
        const productValueSales = {};
        sales.forEach(sale => {
            productValueSales[sale.productName] = (productValueSales[sale.productName] || 0) + (sale.quantity * sale.unitPrice);
        });
        const pieLabels = Object.keys(productValueSales);
        const pieData = Object.values(productValueSales);

        // Generar colores dinámicamente o usar una paleta predefinida
        const backgroundColors = [
            'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)'
        ];
        const borderColors = [
            'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)'
        ];

        pieChartInstance = new Chart(pieChartCanvas, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: backgroundColors.slice(0, pieLabels.length),
                    borderColor: borderColors.slice(0, pieLabels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                }
            }
        });

        // Datos para Gráfico de Líneas (Ventas Diarias)
        const dailySales = {};
        sales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            dailySales[date] = (dailySales[date] || 0) + (sale.quantity * sale.unitPrice);
        });

        const sortedDates = Object.keys(dailySales).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const lineData = sortedDates.map(date => dailySales[date]);

        lineChartInstance = new Chart(lineChartCanvas, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Ventas Diarias ($)',
                    data: lineData,
                    borderColor: 'rgba(234, 88, 12, 1)', // Un color diferente para la línea
                    backgroundColor: 'rgba(234, 88, 12, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e2e8f0' },
                        grid: { color: '#4a5568' }
                    },
                    x: {
                        ticks: { color: '#e2e8f0' },
                        grid: { color: '#4a5568' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                }
            }
        });
    };

    generateReportsButton.addEventListener('click', generateReports);

    // --- Funciones de Resumen ---
    const updateSummaryCounts = () => {
        document.getElementById('totalClientsResumen').textContent = clients.length;
        document.getElementById('totalYogurtsResumen').textContent = yogurts.length;
        document.getElementById('totalInventoryItemsResumen').textContent = inventory.length; // Número de tipos de producto en inventario

        const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('currentTotalStockResumen').textContent = `${totalStock} unidades`;
    };

    const updateRecentSalesActivity = () => {
        const recentSalesList = document.getElementById('recentSalesList');
        recentSalesList.innerHTML = ''; // Limpiar la lista antes de añadir nuevos elementos

        if (sales.length === 0) {
            recentSalesList.innerHTML = '<li>No hay actividad reciente.</li>';
            return;
        }

        // Ordenar ventas por fecha (más reciente primero)
        const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Mostrar solo las últimas 5 ventas (o menos si hay menos de 5)
        const recentActivities = sortedSales.slice(0, 5);

        recentActivities.forEach(sale => {
            const li = document.createElement('li');
            const saleDate = new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            li.innerHTML = `
                <span>Venta: ${sale.productName} (${sale.quantity} unid.) por $${(sale.quantity * sale.unitPrice).toFixed(2)}</span>
                <span class="activity-date">${saleDate}</span>
            `;
            recentSalesList.appendChild(li);
        });
    };


    // --- Inicialización al cargar la página ---
    renderSales();
    renderClients();
    renderYogurts();
    renderInventory();
    updateSummaryCounts();
    updateRecentSalesActivity();

    // Nota: generateReports() no se llama automáticamente al inicio porque puede ser costoso
    // y solo se necesita cuando el usuario va a la pestaña de reportes y hace clic en "Generar Reportes".
});