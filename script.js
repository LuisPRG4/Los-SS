document.addEventListener('DOMContentLoaded', () => {
    // --- Variables de Estado y Datos ---
    let sales = [];
    let clients = [];
    let yogurts = [];
    let inventory = [];
    let selectedSaleId = null; // Para edición/eliminación de ventas
    let selectedClientId = null; // Para edición/eliminación de clientes
    let selectedYogurtId = null; // Para edición/eliminación de productos de yogurt
    let selectedInventoryItemId = null; // Para edición/eliminación de ítems de inventario
    let cartItems = []; // Para el carrito de la venta multiproducto

    // Instancias de Chart.js
    let barChartInstance = null;
    let pieChartInstance = null;
    let lineChartInstance = null;

    // --- Elementos de Pestañas ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Elementos de la Pestaña de Resumen ---
    const totalSalesSummaryResumen = document.getElementById('totalSalesSummaryResumen');
    const totalUnitsSoldResumen = document.getElementById('totalUnitsSoldResumen');
    const totalClientsResumen = document.getElementById('totalClientsResumen');
    const totalYogurtsResumen = document.getElementById('totalYogurtsResumen');
    const totalInventoryItemsResumen = document.getElementById('totalInventoryItemsResumen');
    const currentTotalStockResumen = document.getElementById('currentTotalStockResumen');
    const recentSalesList = document.getElementById('recentSalesList');

    // --- Elementos de la Pestaña de Ventas (NUEVOS PARA MULTIPRODUCTO) ---
    const cartProductNameSelect = document.getElementById('cartProductName');
    const cartQuantityInput = document.getElementById('cartQuantity');
    const cartUnitPriceInput = document.getElementById('cartUnitPrice');
    const addCartItemBtn = document.getElementById('addCartItem');
    const cancelEditCartItemBtn = document.getElementById('cancelEditCartItem');
    const updateCartItemBtn = document.getElementById('updateCartItem');
    const currentSaleItemsList = document.getElementById('currentSaleItemsList');
    const currentSaleTotal = document.getElementById('currentSaleTotal');
    const finalSalePaymentTypeSelect = document.getElementById('finalSalePaymentType');
    const registerMultiProductSaleBtn = document.getElementById('registerMultiProductSale');
    const clearCartBtn = document.getElementById('clearCart');

    // Elementos de Historial de Ventas (filtros)
    const searchSaleProductInput = document.getElementById('searchSaleProduct');
    const filterSaleStartDateInput = document.getElementById('filterSaleStartDate');
    const filterSaleEndDateInput = document.getElementById('filterSaleEndDate');
    const applySaleFiltersBtn = document.getElementById('applySaleFilters');
    const clearSaleFiltersBtn = document.getElementById('clearSaleFilters');
    const salesList = document.getElementById('salesList'); // Lista de ventas registradas
    const totalSalesSummary = document.getElementById('totalSalesSummary');
    const clearAllSalesBtn = document.getElementById('clearAllSales');


    // --- Elementos de la Pestaña de Clientes ---
    const clientNameInput = document.getElementById('clientName');
    const clientAliasInput = document.getElementById('clientAlias');
    const clientContactInput = document.getElementById('clientContact');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientNotesTextarea = document.getElementById('clientNotes');
    const addClientBtn = document.getElementById('addClient');
    const updateClientBtn = document.getElementById('updateClient');
    const deleteSelectedClientBtn = document.getElementById('deleteSelectedClient');
    const clearClientFormBtn = document.getElementById('clearClientFormBtn');
    const searchClientNameInput = document.getElementById('searchClientName');
    const applyClientFiltersBtn = document.getElementById('applyClientFilters');
    const clearClientFiltersBtn = document.getElementById('clearClientFilters');
    const clientList = document.getElementById('clientList');
    const clearAllClientsBtn = document.getElementById('clearAllClients');

    // --- Elementos de la Pestaña de Productos (Yogurt) ---
    const yogurtNameInput = document.getElementById('yogurtName');
    const yogurtFlavorInput = document.getElementById('yogurtFlavor');
    const yogurtPriceInput = document.getElementById('yogurtPrice');
    const yogurtAdditionalPricesTextarea = document.getElementById('yogurtAdditionalPrices');
    const yogurtExpirationDateInput = document.getElementById('yogurtExpirationDate');
    const yogurtAdditionalInfoTextarea = document.getElementById('yogurtAdditionalInfo');
    const yogurtImageInput = document.getElementById('yogurtImage');
    const currentYogurtImagePreview = document.getElementById('currentYogurtImagePreview');
    const addYogurtBtn = document.getElementById('addYogurt');
    const updateYogurtBtn = document.getElementById('updateYogurt');
    const deleteSelectedYogurtBtn = document.getElementById('deleteSelectedYogurt');
    const yogurtList = document.getElementById('yogurtList');
    const clearAllYogurtsBtn = document.getElementById('clearAllYogurts');

    // --- Elementos de la Pestaña de Inventario ---
    const inventoryProductNameInput = document.getElementById('inventoryProductName');
    const inventoryQuantityInput = document.getElementById('inventoryQuantity');
    const addOrUpdateInventoryBtn = document.getElementById('addOrUpdateInventory');
    const deleteInventoryItemBtn = document.getElementById('deleteInventoryItem');
    const inventoryList = document.getElementById('inventoryList');
    const clearAllInventoryBtn = document.getElementById('clearAllInventory');

    // --- Elementos de la Pestaña de Reportes ---
    const generateReportsBtn = document.getElementById('generateReports');
    const barChartCanvas = document.getElementById('barChart');
    const pieChartCanvas = document.getElementById('pieChart');
    const lineChartCanvas = document.getElementById('lineChart');


    // --- Funciones de Utilidad para localStorage ---
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

    // --- Cargar todos los datos al inicio ---
    const loadAllData = () => {
        sales = loadData('sales');
        clients = loadData('clients');
        yogurts = loadData('yogurts');
        inventory = loadData('inventory');
    };

    // --- Funciones de Pestañas ---
    function openTab(tabId) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        tabButtons.forEach(button => {
            button.classList.remove('active', 'btn-primary');
            button.classList.add('btn-secondary');
        });

        const targetTab = document.getElementById(tabId);
        const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

        if (targetTab && targetButton) {
            targetTab.classList.add('active');
            targetButton.classList.add('active', 'btn-primary');
            targetButton.classList.remove('btn-secondary');
            localStorage.setItem('activeTab', tabId); // Guarda la pestaña activa

            // Lógica específica para cada pestaña al activarse
            switch (tabId) {
                case 'resumen':
                    updateSummaryCounts();
                    updateRecentSalesActivity();
                    break;
                case 'ventas':
                    populateProductSelectForSales(); // Llenar el select de productos
                    renderCartItems(); // Renderizar el carrito actual
                    renderSales(); // Renderizar el historial de ventas
                    break;
                case 'clientes':
                    renderClients();
                    clearClientForm();
                    break;
                case 'yogurt':
                    renderYogurts();
                    clearYogurtForm();
                    break;
                case 'inventario':
                    renderInventory();
                    clearInventoryForm();
                    break;
                case 'reportes':
                    // Destruir gráficos previos para evitar renderizado incorrecto
                    if (barChartInstance) barChartInstance.destroy();
                    if (pieChartInstance) pieChartInstance.destroy();
                    if (lineChartInstance) lineChartInstance.destroy();

                    // Ocultar los canvas inicialmente
                    barChartCanvas.style.display = 'none';
                    pieChartCanvas.style.display = 'none';
                    lineChartCanvas.style.display = 'none';
                    break;
            }
        } else {
            console.warn(`No se encontró el botón o contenido para la pestaña: ${tabId}. Volviendo a la pestaña predeterminada.`);
            openTab('resumen'); // Volver a la pestaña resumen si la guardada no existe
        }
    }


    // --- Funciones de Resumen ---
    const updateSummaryCounts = () => {
        totalSalesSummaryResumen.textContent = `$${calculateTotalSales(sales).toFixed(2)}`;
        totalUnitsSoldResumen.textContent = `${calculateTotalUnitsSold(sales)} unidades`;
        totalClientsResumen.textContent = clients.length;
        totalYogurtsResumen.textContent = yogurts.length;
        totalInventoryItemsResumen.textContent = inventory.length + ' tipos';
        currentTotalStockResumen.textContent = `${calculateTotalStock()} unidades`;
    };

    const updateRecentSalesActivity = () => {
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
            // Para ventas multiproducto, mostrar el primer producto o un resumen
            const firstProduct = sale.products[0];
            const productSummary = firstProduct ? `${firstProduct.productName} (${firstProduct.quantity} unid.)` : 'Venta sin productos';

            li.innerHTML = `
                <span>Venta: ${productSummary} por $${sale.totalAmount.toFixed(2)}</span>
                <span class="activity-date">${saleDate}</span>
            `;
            recentSalesList.appendChild(li);
        });
    };

    // --- Funciones de Ventas (Multiproducto) ---

    // Llenar el select de productos
    const populateProductSelectForSales = () => {
        cartProductNameSelect.innerHTML = '<option value="">Selecciona un producto</option>'; // Limpiar y añadir opción por defecto
        yogurts.forEach(yogurt => {
            const option = document.createElement('option');
            option.value = yogurt.id; // Usar el ID del producto
            option.textContent = `${yogurt.name} (${yogurt.flavor}) - $${parseFloat(yogurt.price).toFixed(2)}`;
            option.dataset.price = parseFloat(yogurt.price).toFixed(2); // Guardar el precio para autocompletar
            cartProductNameSelect.appendChild(option);
        });
    };

    // Auto-llenar precio unitario al seleccionar un producto
    const autoFillUnitPrice = () => {
        const selectedOption = cartProductNameSelect.options[cartProductNameSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            cartUnitPriceInput.value = selectedOption.dataset.price || '';
        } else {
            cartUnitPriceInput.value = '';
        }
    };

    // Añadir producto al carrito
    let editingCartItemId = null;
    const addOrUpdateCartItem = () => {
        const productId = cartProductNameSelect.value;
        const productName = cartProductNameSelect.options[cartProductNameSelect.selectedIndex].text.split('(')[0].trim();
        const quantity = parseInt(cartQuantityInput.value);
        const unitPrice = parseFloat(cartUnitPriceInput.value);

        if (!productId || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
            alert('Por favor, selecciona un producto e ingresa una cantidad y un precio unitario válidos.');
            return;
        }

        const productInInventory = inventory.find(item => item.productId === productId);
        if (!productInInventory || productInInventory.quantity < quantity) {
            alert(`No hay suficiente stock de ${productName}. Stock disponible: ${productInInventory ? productInInventory.quantity : 0}`);
            return;
        }

        if (editingCartItemId) {
            // Actualizar ítem existente en el carrito
            const itemIndex = cartItems.findIndex(item => item.id === editingCartItemId);
            if (itemIndex !== -1) {
                // Antes de actualizar, revertir stock del item original si la cantidad cambia
                const originalItem = cartItems[itemIndex];
                const originalProductInInventory = inventory.find(item => item.productId === originalItem.productId);
                if (originalProductInInventory) {
                    originalProductInInventory.quantity += originalItem.quantity; // Devolver stock original
                }

                // Actualizar el item del carrito
                cartItems[itemIndex] = {
                    id: editingCartItemId,
                    productId,
                    productName,
                    quantity,
                    unitPrice
                };

                // Reducir el stock actualizado
                if (productInInventory) {
                    productInInventory.quantity -= quantity;
                }
            }
            editingCartItemId = null;
            addCartItemBtn.style.display = 'block';
            updateCartItemBtn.style.display = 'none';
            cancelEditCartItemBtn.style.display = 'none';
        } else {
            // Añadir nuevo ítem al carrito
            const existingCartItemIndex = cartItems.findIndex(item => item.productId === productId);
            if (existingCartItemIndex !== -1) {
                // Si el producto ya está en el carrito, actualizar la cantidad
                const existingItem = cartItems[existingCartItemIndex];
                const newQuantity = existingItem.quantity + quantity;

                if (productInInventory.quantity < newQuantity) {
                    alert(`No hay suficiente stock de ${productName} para añadir más. Stock disponible: ${productInInventory.quantity}. Ya tienes ${existingItem.quantity} en el carrito.`);
                    return;
                }
                existingItem.quantity = newQuantity;
                productInInventory.quantity -= quantity; // Reducir del stock
            } else {
                // Si el producto no está en el carrito, añadirlo
                cartItems.push({
                    id: generateUniqueId(),
                    productId,
                    productName,
                    quantity,
                    unitPrice
                });
                productInInventory.quantity -= quantity; // Reducir del stock
            }
        }

        saveData('inventory', inventory); // Guardar inventario actualizado
        renderCartItems();
        clearCartItemForm();
        updateSummaryCounts(); // Actualizar resumen
    };

    // Renderizar ítems del carrito
    const renderCartItems = () => {
        currentSaleItemsList.innerHTML = '';
        let total = 0;

        if (cartItems.length === 0) {
            currentSaleItemsList.innerHTML = '<p>No hay productos en la venta actual.</p>';
        } else {
            cartItems.forEach(item => {
                const li = document.createElement('li');
                li.dataset.id = item.id;
                const itemTotal = item.quantity * item.unitPrice;
                total += itemTotal;
                li.innerHTML = `
                    <span>${item.productName} - ${item.quantity} unid. x $${item.unitPrice.toFixed(2)} = $${itemTotal.toFixed(2)}</span>
                    <div class="item-actions">
                        <button class="btn-small btn-secondary edit-cart-item" data-id="${item.id}">Editar</button>
                        <button class="btn-small btn-danger remove-cart-item" data-id="${item.id}">X</button>
                    </div>
                `;
                currentSaleItemsList.appendChild(li);
            });
        }
        currentSaleTotal.textContent = `Total de la Venta Actual: $${total.toFixed(2)}`;
    };

    // Editar ítem del carrito
    const editCartItem = (id) => {
        const itemToEdit = cartItems.find(item => item.id === id);
        if (itemToEdit) {
            editingCartItemId = id;
            cartProductNameSelect.value = itemToEdit.productId;
            cartQuantityInput.value = itemToEdit.quantity;
            cartUnitPriceInput.value = itemToEdit.unitPrice;

            addCartItemBtn.style.display = 'none';
            updateCartItemBtn.style.display = 'block';
            cancelEditCartItemBtn.style.display = 'block';
        }
    };

    // Eliminar ítem del carrito
    const removeCartItem = (id) => {
        const itemToRemove = cartItems.find(item => item.id === id);
        if (itemToRemove) {
            cartItems = cartItems.filter(item => item.id !== id);

            // Devolver stock al inventario
            const productInInventory = inventory.find(item => item.productId === itemToRemove.productId);
            if (productInInventory) {
                productInInventory.quantity += itemToRemove.quantity;
                saveData('inventory', inventory); // Guardar inventario actualizado
            }
        }
        renderCartItems();
        clearCartItemForm();
        updateSummaryCounts();
    };

    // Limpiar formulario de carrito
    const clearCartItemForm = () => {
        cartProductNameSelect.value = '';
        cartQuantityInput.value = '1';
        cartUnitPriceInput.value = '';
        editingCartItemId = null;
        addCartItemBtn.style.display = 'block';
        updateCartItemBtn.style.display = 'none';
        cancelEditCartItemBtn.style.display = 'none';
    };

    // Registrar Venta Multiproducto
    const registerMultiProductSale = () => {
        if (cartItems.length === 0) {
            alert('El carrito está vacío. Añade productos antes de registrar la venta.');
            return;
        }

        const saleTotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const paymentType = finalSalePaymentTypeSelect.value;

        const newSale = {
            id: generateUniqueId(),
            products: [...cartItems], // Copia profunda de los ítems del carrito
            totalAmount: saleTotal,
            paymentType: paymentType,
            date: new Date().toISOString()
        };

        sales.push(newSale);
        saveData('sales', sales);
        cartItems = []; // Limpiar carrito después de registrar
        saveData('inventory', inventory); // Asegurar que el inventario esté guardado con los cambios

        renderCartItems(); // Renderizar carrito vacío
        renderSales(); // Actualizar historial de ventas
        updateSummaryCounts(); // Actualizar el resumen
        updateRecentSalesActivity(); // Actualizar actividad reciente
        alert('Venta registrada con éxito!');
    };

    // Limpiar Carrito Completo
    const clearCart = () => {
        if (confirm('¿Estás seguro de que quieres limpiar todo el carrito? Se restaurará el stock de los productos.')) {
            // Devolver stock al inventario
            cartItems.forEach(item => {
                const productInInventory = inventory.find(inv => inv.productId === item.productId);
                if (productInInventory) {
                    productInInventory.quantity += item.quantity;
                }
            });
            cartItems = [];
            saveData('inventory', inventory); // Guardar inventario actualizado
            renderCartItems();
            clearCartItemForm();
            updateSummaryCounts();
        }
    };


    // Renderizar Ventas Registradas (Historial)
    const renderSales = () => {
        salesList.innerHTML = '';
        const currentSearchTerm = searchSaleProductInput.value.toLowerCase();
        const startDate = filterSaleStartDateInput.value ? new Date(filterSaleStartDateInput.value) : null;
        const endDate = filterSaleEndDateInput.value ? new Date(filterSaleEndDateInput.value) : null;

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const matchesDate = (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate);
            const matchesProduct = sale.products.some(item =>
                item.productName.toLowerCase().includes(currentSearchTerm)
            );
            return matchesDate && matchesProduct;
        });

        if (filteredSales.length === 0) {
            salesList.innerHTML = '<p>No hay ventas registradas que coincidan con los filtros.</p>';
            totalSalesSummary.textContent = 'Total de ventas registradas: $0.00';
            return;
        }

        let totalFilteredSalesAmount = 0;
        filteredSales.forEach(sale => {
            totalFilteredSalesAmount += sale.totalAmount;
            const li = document.createElement('li');
            li.dataset.id = sale.id;
            const saleDate = new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            // Construir la lista de productos para la visualización
            const productsHtml = sale.products.map(item =>
                `${item.productName} (${item.quantity} unid. x $${item.unitPrice.toFixed(2)})`
            ).join(', ');

            li.innerHTML = `
                <span class="sale-info">
                    ID: ${sale.id.substring(0, 6)}...<br>
                    Productos: ${productsHtml}<br>
                    Total: $${sale.totalAmount.toFixed(2)} (${sale.paymentType})<br>
                    Fecha: ${saleDate}
                </span>
                <div class="item-actions">
                    <button class="btn-small btn-secondary view-sale" data-id="${sale.id}">Ver Detalle</button>
                    <button class="btn-small btn-danger delete-sale" data-id="${sale.id}">Eliminar</button>
                </div>
            `;
            salesList.appendChild(li);
        });

        totalSalesSummary.textContent = `Total de ventas registradas: $${totalFilteredSalesAmount.toFixed(2)}`;
    };

    // Ver detalle de venta (para pop-up o más información)
    const viewSaleDetail = (id) => {
        const sale = sales.find(s => s.id === id);
        if (sale) {
            let detailHtml = `
                <h3>Detalle de Venta #${sale.id.substring(0, 8)}</h3>
                <p><strong>Fecha:</strong> ${new Date(sale.date).toLocaleString()}</p>
                <p><strong>Tipo de Pago:</strong> ${sale.paymentType}</p>
                <h4>Productos:</h4>
                <ul>
            `;
            sale.products.forEach(item => {
                detailHtml += `<li>${item.productName} - ${item.quantity} unid. x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}</li>`;
            });
            detailHtml += `
                </ul>
                <p><strong>Total de la Venta:</strong> $${sale.totalAmount.toFixed(2)}</p>
                <button class="btn-primary" onclick="alert('Funcionalidad de edición aún no implementada para ventas multiproducto.');">Editar Venta</button>
                <button class="btn-danger" onclick="deleteSale('${sale.id}');">Eliminar Venta</button>
            `;
            // En un entorno real, esto se mostraría en un modal o div específico.
            // Por simplicidad, usaremos alert o console.log
            console.log(detailHtml);
            alert(`Detalle de Venta:\n${detailHtml.replace(/<[^>]*>?/gm, '')}`); // Eliminar HTML para el alert
        }
    };

    // Eliminar venta
    const deleteSale = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer y el stock será restaurado.')) {
            const saleToDelete = sales.find(sale => sale.id === id);
            if (saleToDelete) {
                // Restaurar stock de los productos vendidos
                saleToDelete.products.forEach(item => {
                    const productInInventory = inventory.find(inv => inv.productId === item.productId);
                    if (productInInventory) {
                        productInInventory.quantity += item.quantity;
                    }
                });
                sales = sales.filter(sale => sale.id !== id);
                saveData('sales', sales);
                saveData('inventory', inventory); // Guardar inventario actualizado
                renderSales();
                updateSummaryCounts();
                updateRecentSalesActivity();
                alert('Venta eliminada y stock restaurado.');
            }
        }
    };

    // Calcular ventas totales
    const calculateTotalSales = (salesArray) => {
        return salesArray.reduce((total, sale) => total + sale.totalAmount, 0);
    };

    // Calcular unidades totales vendidas
    const calculateTotalUnitsSold = (salesArray) => {
        return salesArray.reduce((totalUnits, sale) =>
            totalUnits + sale.products.reduce((productUnits, item) => productUnits + item.quantity, 0),
            0
        );
    };


    // --- Funciones de Clientes ---
    const addClient = () => {
        const name = clientNameInput.value.trim();
        const alias = clientAliasInput.value.trim();
        const contact = clientContactInput.value.trim();
        const address = clientAddressInput.value.trim();
        const notes = clientNotesTextarea.value.trim();

        if (!name) {
            alert('El nombre del cliente es obligatorio.');
            return;
        }

        const newClient = {
            id: generateUniqueId(),
            name,
            alias,
            contact,
            address,
            notes,
            registeredDate: new Date().toISOString()
        };

        clients.push(newClient);
        saveData('clients', clients);
        renderClients();
        clearClientForm();
        updateSummaryCounts();
        alert('Cliente añadido con éxito!');
    };

    const renderClients = () => {
        clientList.innerHTML = '';
        const searchTerm = searchClientNameInput.value.toLowerCase();

        const filteredClients = clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            client.alias.toLowerCase().includes(searchTerm)
        );

        if (filteredClients.length === 0) {
            clientList.innerHTML = '<p>No hay clientes registrados que coincidan con la búsqueda.</p>';
            return;
        }

        filteredClients.forEach(client => {
            const li = document.createElement('li');
            li.dataset.id = client.id;
            li.innerHTML = `
                <span>
                    <strong>${client.name}</strong> (${client.alias || 'N/A'})<br>
                    Contacto: ${client.contact || 'N/A'}<br>
                    Dirección: ${client.address || 'N/A'}
                </span>
                <div class="item-actions">
                    <button class="btn-small btn-secondary edit-client" data-id="${client.id}">Editar</button>
                    <button class="btn-small btn-danger delete-client" data-id="${client.id}">Eliminar</button>
                </div>
            `;
            clientList.appendChild(li);
        });
    };

    const editClient = (id) => {
        const clientToEdit = clients.find(client => client.id === id);
        if (clientToEdit) {
            selectedClientId = id;
            clientNameInput.value = clientToEdit.name;
            clientAliasInput.value = clientToEdit.alias;
            clientContactInput.value = clientToEdit.contact;
            clientAddressInput.value = clientToEdit.address;
            clientNotesTextarea.value = clientToEdit.notes;

            addClientBtn.style.display = 'none';
            updateClientBtn.style.display = 'inline-block';
            deleteSelectedClientBtn.style.display = 'inline-block';
        }
    };

    const updateClient = () => {
        if (!selectedClientId) {
            alert('No hay cliente seleccionado para actualizar.');
            return;
        }

        const clientIndex = clients.findIndex(client => client.id === selectedClientId);
        if (clientIndex !== -1) {
            const name = clientNameInput.value.trim();
            if (!name) {
                alert('El nombre del cliente es obligatorio.');
                return;
            }

            clients[clientIndex] = {
                ...clients[clientIndex], // Mantener fecha de registro
                name,
                alias: clientAliasInput.value.trim(),
                contact: clientContactInput.value.trim(),
                address: clientAddressInput.value.trim(),
                notes: clientNotesTextarea.value.trim()
            };
            saveData('clients', clients);
            renderClients();
            clearClientForm();
            alert('Cliente actualizado con éxito!');
        }
    };

    const deleteClient = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            clients = clients.filter(client => client.id !== id);
            saveData('clients', clients);
            renderClients();
            clearClientForm();
            updateSummaryCounts();
            alert('Cliente eliminado.');
        }
    };

    const clearClientForm = () => {
        clientNameInput.value = '';
        clientAliasInput.value = '';
        clientContactInput.value = '';
        clientAddressInput.value = '';
        clientNotesTextarea.value = '';
        selectedClientId = null;

        addClientBtn.style.display = 'inline-block';
        updateClientBtn.style.display = 'none';
        deleteSelectedClientBtn.style.display = 'none';
    };


    // --- Funciones de Productos (Yogurt) ---
    const addYogurt = () => {
        const name = yogurtNameInput.value.trim();
        const flavor = yogurtFlavorInput.value.trim();
        const price = parseFloat(yogurtPriceInput.value);
        const additionalPrices = yogurtAdditionalPricesTextarea.value.trim();
        const expirationDate = yogurtExpirationDateInput.value;
        const additionalInfo = yogurtAdditionalInfoTextarea.value.trim();
        const imageFile = yogurtImageInput.files[0];

        if (!name || !flavor || isNaN(price) || price <= 0) {
            alert('Nombre, sabor y precio válido del producto son obligatorios.');
            return;
        }

        // Leer imagen como Base64
        let imageUrl = '';
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageUrl = e.target.result;
                const newYogurt = {
                    id: generateUniqueId(),
                    name,
                    flavor,
                    price,
                    additionalPrices,
                    expirationDate,
                    additionalInfo,
                    imageUrl,
                    creationDate: new Date().toISOString()
                };
                yogurts.push(newYogurt);
                saveData('yogurts', yogurts);
                renderYogurts();
                clearYogurtForm();
                updateSummaryCounts();
                populateProductSelectForSales(); // Actualizar select de ventas
                alert('Producto añadido con éxito!');
            };
            reader.readAsDataURL(imageFile);
        } else {
            const newYogurt = {
                id: generateUniqueId(),
                name,
                flavor,
                price,
                additionalPrices,
                expirationDate,
                additionalInfo,
                imageUrl: '', // Sin imagen
                creationDate: new Date().toISOString()
            };
            yogurts.push(newYogurt);
            saveData('yogurts', yogurts);
            renderYogurts();
            clearYogurtForm();
            updateSummaryCounts();
            populateProductSelectForSales(); // Actualizar select de ventas
            alert('Producto añadido con éxito!');
        }
    };

    const renderYogurts = () => {
        yogurtList.innerHTML = '';
        if (yogurts.length === 0) {
            yogurtList.innerHTML = '<p>No hay productos de yogurt registrados.</p>';
            return;
        }

        yogurts.forEach(yogurt => {
            const li = document.createElement('li');
            li.dataset.id = yogurt.id;
            const expirationInfo = yogurt.expirationDate ? `<br>Caducidad (prox. prod.): ${new Date(yogurt.expirationDate).toLocaleDateString()}` : '';
            const imgHtml = yogurt.imageUrl ? `<img src="${yogurt.imageUrl}" alt="${yogurt.name}" class="product-thumbnail">` : '';

            li.innerHTML = `
                ${imgHtml}
                <span>
                    <strong>${yogurt.name}</strong> - ${yogurt.flavor}<br>
                    Precio: $${yogurt.price.toFixed(2)}${expirationInfo}
                </span>
                <div class="item-actions">
                    <button class="btn-small btn-secondary edit-yogurt" data-id="${yogurt.id}">Editar</button>
                    <button class="btn-small btn-danger delete-yogurt" data-id="${yogurt.id}">Eliminar</button>
                </div>
            `;
            yogurtList.appendChild(li);
        });
    };

    const editYogurt = (id) => {
        const yogurtToEdit = yogurts.find(yogurt => yogurt.id === id);
        if (yogurtToEdit) {
            selectedYogurtId = id;
            yogurtNameInput.value = yogurtToEdit.name;
            yogurtFlavorInput.value = yogurtToEdit.flavor;
            yogurtPriceInput.value = yogurtToEdit.price;
            yogurtAdditionalPricesTextarea.value = yogurtToEdit.additionalPrices;
            yogurtExpirationDateInput.value = yogurtToEdit.expirationDate;
            yogurtAdditionalInfoTextarea.value = yogurtToEdit.additionalInfo;

            if (yogurtToEdit.imageUrl) {
                currentYogurtImagePreview.src = yogurtToEdit.imageUrl;
                currentYogurtImagePreview.style.display = 'block';
            } else {
                currentYogurtImagePreview.style.display = 'none';
            }

            addYogurtBtn.style.display = 'none';
            updateYogurtBtn.style.display = 'inline-block';
            deleteSelectedYogurtBtn.style.display = 'inline-block';
        }
    };

    const updateYogurt = () => {
        if (!selectedYogurtId) {
            alert('No hay producto seleccionado para actualizar.');
            return;
        }

        const yogurtIndex = yogurts.findIndex(yogurt => yogurt.id === selectedYogurtId);
        if (yogurtIndex !== -1) {
            const name = yogurtNameInput.value.trim();
            const flavor = yogurtFlavorInput.value.trim();
            const price = parseFloat(yogurtPriceInput.value);
            const additionalPrices = yogurtAdditionalPricesTextarea.value.trim();
            const expirationDate = yogurtExpirationDateInput.value;
            const additionalInfo = yogurtAdditionalInfoTextarea.value.trim();
            const imageFile = yogurtImageInput.files[0];

            if (!name || !flavor || isNaN(price) || price <= 0) {
                alert('Nombre, sabor y precio válido del producto son obligatorios.');
                return;
            }

            // Manejo de la imagen (mantener si no se cambia, actualizar si hay nueva)
            let imageUrl = yogurts[yogurtIndex].imageUrl; // Mantener imagen existente por defecto

            const updateProduct = () => {
                yogurts[yogurtIndex] = {
                    ...yogurts[yogurtIndex],
                    name,
                    flavor,
                    price,
                    additionalPrices,
                    expirationDate,
                    additionalInfo,
                    imageUrl // Usará la nueva imagen o la existente
                };
                saveData('yogurts', yogurts);
                renderYogurts();
                clearYogurtForm();
                updateSummaryCounts();
                populateProductSelectForSales(); // Actualizar select de ventas
                alert('Producto actualizado con éxito!');
            };

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageUrl = e.target.result;
                    updateProduct();
                };
                reader.readAsDataURL(imageFile);
            } else {
                // Si no se selecciona nueva imagen, pero había una, mantenerla.
                // Si no se selecciona y no había, se mantiene vacía (imageUrl ya tiene el valor correcto).
                updateProduct();
            }
        }
    };

    const deleteYogurt = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este producto? Se eliminará de tu catálogo y de las ventas/inventario si está asociado.')) {
            // Eliminar de productos
            yogurts = yogurts.filter(yogurt => yogurt.id !== id);
            saveData('yogurts', yogurts);

            // Eliminar de inventario si existe
            inventory = inventory.filter(item => item.productId !== id);
            saveData('inventory', inventory);

            // También se deberían manejar las ventas si el producto fue vendido,
            // pero para simplificar, por ahora solo lo removemos del inventario y catálogo.
            // Para ventas complejas, una venta eliminada no debería borrar el producto si fue vendido.

            renderYogurts();
            renderInventory(); // Actualizar inventario
            clearYogurtForm();
            updateSummaryCounts();
            populateProductSelectForSales(); // Actualizar select de ventas
            alert('Producto eliminado.');
        }
    };

    const clearYogurtForm = () => {
        yogurtNameInput.value = '';
        yogurtFlavorInput.value = '';
        yogurtPriceInput.value = '';
        yogurtAdditionalPricesTextarea.value = '';
        yogurtExpirationDateInput.value = '';
        yogurtAdditionalInfoTextarea.value = '';
        yogurtImageInput.value = ''; // Limpiar la selección del archivo
        currentYogurtImagePreview.src = '#';
        currentYogurtImagePreview.style.display = 'none';
        selectedYogurtId = null;

        addYogurtBtn.style.display = 'inline-block';
        updateYogurtBtn.style.display = 'none';
        deleteSelectedYogurtBtn.style.display = 'none';
    };


    // --- Funciones de Inventario ---
    const addOrUpdateInventory = () => {
        const productName = inventoryProductNameInput.value.trim();
        const quantity = parseInt(inventoryQuantityInput.value);

        if (!productName || isNaN(quantity) || quantity < 0) { // Permitir 0 para vaciar stock
            alert('Por favor, ingresa un nombre de producto y una cantidad válida.');
            return;
        }

        const product = yogurts.find(y => y.name.toLowerCase() === productName.toLowerCase());
        if (!product) {
            alert('Este producto no existe en tu catálogo de productos. Añádelo primero en la pestaña "Productos".');
            return;
        }

        const existingItemIndex = inventory.findIndex(item => item.productId === product.id);

        if (existingItemIndex !== -1) {
            // Actualizar stock de un producto existente
            inventory[existingItemIndex].quantity = quantity;
            alert(`Stock de ${product.name} actualizado a ${quantity} unidades.`);
        } else {
            // Añadir nuevo producto al inventario
            inventory.push({
                id: generateUniqueId(),
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                lastUpdated: new Date().toISOString()
            });
            alert(`Producto ${product.name} añadido al inventario con ${quantity} unidades.`);
        }

        saveData('inventory', inventory);
        renderInventory();
        clearInventoryForm();
        updateSummaryCounts();
    };

    const renderInventory = () => {
        inventoryList.innerHTML = '';
        if (inventory.length === 0) {
            inventoryList.innerHTML = '<p>El inventario está vacío.</p>';
            return;
        }

        inventory.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            const productDetail = yogurts.find(y => y.id === item.productId);
            const productNameDisplay = productDetail ? `${productDetail.name} (${productDetail.flavor})` : item.productName;

            li.innerHTML = `
                <span>
                    <strong>${productNameDisplay}</strong>: ${item.quantity} unidades
                </span>
                <div class="item-actions">
                    <button class="btn-small btn-secondary edit-inventory" data-id="${item.id}">Editar</button>
                    <button class="btn-small btn-danger delete-inventory" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            inventoryList.appendChild(li);
        });
    };

    const editInventoryItem = (id) => {
        const itemToEdit = inventory.find(item => item.id === id);
        if (itemToEdit) {
            selectedInventoryItemId = id;
            inventoryProductNameInput.value = itemToEdit.productName;
            inventoryQuantityInput.value = itemToEdit.quantity;
            addOrUpdateInventoryBtn.textContent = 'Actualizar Stock';
            deleteInventoryItemBtn.style.display = 'inline-block';
        }
    };

    const deleteInventoryItem = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
            inventory = inventory.filter(item => item.id !== id);
            saveData('inventory', inventory);
            renderInventory();
            clearInventoryForm();
            updateSummaryCounts();
            alert('Artículo de inventario eliminado.');
        }
    };

    const clearInventoryForm = () => {
        inventoryProductNameInput.value = '';
        inventoryQuantityInput.value = '';
        selectedInventoryItemId = null;
        addOrUpdateInventoryBtn.textContent = 'Añadir/Actualizar Stock';
        deleteInventoryItemBtn.style.display = 'none';
    };

    const calculateTotalStock = () => {
        return inventory.reduce((total, item) => total + item.quantity, 0);
    };

    // --- Funciones de Reportes (Chart.js) ---
    const generateReports = () => {
        if (sales.length === 0) {
            alert('No hay datos de ventas para generar reportes.');
            // Ocultar los canvas si no hay datos
            barChartCanvas.style.display = 'none';
            pieChartCanvas.style.display = 'none';
            lineChartCanvas.style.display = 'none';
            return;
        }

        // Mostrar los canvas
        barChartCanvas.style.display = 'block';
        pieChartCanvas.style.display = 'block';
        lineChartCanvas.style.display = 'block';

        // 1. Ventas por Producto (Bar Chart)
        const productSales = {}; // {productId: {productName, totalQuantity, totalRevenue}}
        sales.forEach(sale => {
            sale.products.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productName: item.productName,
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }
                productSales[item.productId].totalQuantity += item.quantity;
                productSales[item.productId].totalRevenue += (item.quantity * item.unitPrice);
            });
        });

        const productLabels = Object.values(productSales).map(p => p.productName);
        const productQuantities = Object.values(productSales).map(p => p.totalQuantity);
        const productRevenues = Object.values(productSales).map(p => p.totalRevenue);

        if (barChartInstance) barChartInstance.destroy(); // Destruir instancia anterior
        barChartInstance = new Chart(barChartCanvas, {
            type: 'bar',
            data: {
                labels: productLabels,
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: productQuantities,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Ingresos por Producto ($)',
                    data: productRevenues,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#cbd5e0' }
                    },
                    x: {
                        ticks: { color: '#cbd5e0' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e0' } }
                }
            }
        });


        // 2. Distribución de Ventas (Pie Chart) - por tipo de pago
        const paymentTypeSales = sales.reduce((acc, sale) => {
            acc[sale.paymentType] = (acc[sale.paymentType] || 0) + sale.totalAmount;
            return acc;
        }, {});

        const paymentLabels = Object.keys(paymentTypeSales);
        const paymentData = Object.values(paymentTypeSales);

        if (pieChartInstance) pieChartInstance.destroy(); // Destruir instancia anterior
        pieChartInstance = new Chart(pieChartCanvas, {
            type: 'pie',
            data: {
                labels: paymentLabels,
                datasets: [{
                    data: paymentData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)', // Contado
                        'rgba(54, 162, 235, 0.6)'  // Crédito
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#cbd5e0' } }
                }
            }
        });

        // 3. Ventas Diarias (Line Chart)
        const dailySales = {};
        sales.forEach(sale => {
            const date = new Date(sale.date).toISOString().split('T')[0]; // YYYY-MM-DD
            dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
        });

        const sortedDates = Object.keys(dailySales).sort();
        const dailyRevenueData = sortedDates.map(date => dailySales[date]);

        if (lineChartInstance) lineChartInstance.destroy(); // Destruir instancia anterior
        lineChartInstance = new Chart(lineChartCanvas, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Ventas Diarias ($)',
                    data: dailyRevenueData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
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
                        ticks: { color: '#cbd5e0' }
                    },
                    x: {
                        ticks: { color: '#cbd5e0' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e0' } }
                }
            }
        });
    };


    // --- Event Listeners ---

    // Manejo de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            openTab(tabId);
        });
    });

    // Pestaña de Ventas (Multiproducto)
    cartProductNameSelect.addEventListener('change', autoFillUnitPrice);
    addCartItemBtn.addEventListener('click', addOrUpdateCartItem);
    updateCartItemBtn.addEventListener('click', addOrUpdateCartItem); // Reutilizar para actualizar
    cancelEditCartItemBtn.addEventListener('click', clearCartItemForm);

    currentSaleItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-cart-item')) {
            editCartItem(event.target.dataset.id);
        } else if (event.target.classList.contains('remove-cart-item')) {
            removeCartItem(event.target.dataset.id);
        }
    });

    registerMultiProductSaleBtn.addEventListener('click', registerMultiProductSale);
    clearCartBtn.addEventListener('click', clearCart);

    // Filtros de Historial de Ventas
    applySaleFiltersBtn.addEventListener('click', renderSales);
    clearSaleFiltersBtn.addEventListener('click', () => {
        searchSaleProductInput.value = '';
        filterSaleStartDateInput.value = '';
        filterSaleEndDateInput.value = '';
        renderSales();
    });

    // Manejo de selección y eliminación en el historial de ventas
    salesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-sale')) {
            deleteSale(event.target.dataset.id);
        } else if (event.target.classList.contains('view-sale')) {
            viewSaleDetail(event.target.dataset.id);
        }
    });
    clearAllSalesBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODAS las ventas? Esta acción no se puede deshacer y el stock será restaurado.')) {
            // Restaurar stock de TODAS las ventas antes de borrar
            sales.forEach(sale => {
                sale.products.forEach(item => {
                    const productInInventory = inventory.find(inv => inv.productId === item.productId);
                    if (productInInventory) {
                        productInInventory.quantity += item.quantity;
                    }
                });
            });
            sales = [];
            saveData('sales', sales);
            saveData('inventory', inventory); // Guardar inventario actualizado
            renderSales();
            updateSummaryCounts();
            updateRecentSalesActivity();
            alert('Todas las ventas han sido eliminadas y el stock restaurado.');
        }
    });

    // Pestaña de Clientes
    addClientBtn.addEventListener('click', addClient);
    updateClientBtn.addEventListener('click', updateClient);
    deleteSelectedClientBtn.addEventListener('click', () => {
        if (selectedClientId) {
            deleteClient(selectedClientId);
        } else {
            alert('Por favor, selecciona un cliente para eliminar.');
        }
    });
    clearClientFormBtn.addEventListener('click', clearClientForm);

    // Filtros de Clientes
    applyClientFiltersBtn.addEventListener('click', renderClients);
    searchClientNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            renderClients();
        }
    });
    clearClientFiltersBtn.addEventListener('click', () => {
        searchClientNameInput.value = '';
        renderClients();
    });

    clientList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-client')) {
            editClient(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-client')) {
            deleteClient(event.target.dataset.id);
        } else if (event.target.tagName === 'SPAN' || event.target.tagName === 'STRONG') { // Permitir selección al hacer clic en el texto
            const li = event.target.closest('li');
            if (li) {
                const id = li.dataset.id;
                if (selectedClientId === id) {
                    clearClientForm();
                } else {
                    editClient(id);
                }
            }
        }
    });
    clearAllClientsBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los clientes?')) {
            clients = [];
            saveData('clients', clients);
            renderClients();
            updateSummaryCounts();
            alert('Todos los clientes han sido eliminados.');
        }
    });


    // Pestaña de Productos (Yogurt)
    yogurtImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentYogurtImagePreview.src = e.target.result;
                currentYogurtImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            currentYogurtImagePreview.src = '#';
            currentYogurtImagePreview.style.display = 'none';
        }
    });

    addYogurtBtn.addEventListener('click', addYogurt);
    updateYogurtBtn.addEventListener('click', updateYogurt);
    deleteSelectedYogurtBtn.addEventListener('click', () => {
        if (selectedYogurtId) {
            deleteYogurt(selectedYogurtId);
        } else {
            alert('Por favor, selecciona un producto para eliminar.');
        }
    });

    yogurtList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-yogurt')) {
            editYogurt(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-yogurt')) {
            deleteYogurt(event.target.dataset.id);
        } else if (event.target.tagName === 'SPAN' || event.target.tagName === 'STRONG' || event.target.tagName === 'IMG') { // Permitir selección al hacer clic en el texto o imagen
            const li = event.target.closest('li');
            if (li) {
                const id = li.dataset.id;
                if (selectedYogurtId === id) {
                    clearYogurtForm();
                } else {
                    editYogurt(id);
                }
            }
        }
    });
    clearAllYogurtsBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los productos de yogurt?')) {
            yogurts = [];
            inventory = []; // También limpiar inventario si se borran todos los productos
            saveData('yogurts', yogurts);
            saveData('inventory', inventory);
            renderYogurts();
            renderInventory();
            updateSummaryCounts();
            populateProductSelectForSales(); // Actualizar select de ventas
            alert('Todos los productos y el inventario asociado han sido eliminados.');
        }
    });


    // Pestaña de Inventario
    addOrUpdateInventoryBtn.addEventListener('click', addOrUpdateInventory);
    deleteInventoryItemBtn.addEventListener('click', () => {
        if (selectedInventoryItemId) {
            if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
                deleteInventoryItem(selectedInventoryItemId);
            }
        }
    });
    clearAllInventoryBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres limpiar todo el inventario?')) {
            inventory = [];
            saveData('inventory', inventory);
            renderInventory();
            updateSummaryCounts();
            alert('Todo el inventario ha sido limpiado.');
        }
    });

    inventoryList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-inventory')) {
            editInventoryItem(event.target.dataset.id);
        } else if (event.target.classList.contains('delete-inventory')) {
            if (confirm('¿Estás seguro de que quieres eliminar este artículo del inventario?')) {
                deleteInventoryItem(event.target.dataset.id);
            }
        } else if (event.target.tagName === 'SPAN' || event.target.tagName === 'STRONG') { // Permitir selección al hacer clic en el texto
            const li = event.target.closest('li');
            if (li) {
                const id = li.dataset.id;
                if (selectedInventoryItemId === id) {
                    clearInventoryForm();
                } else {
                    editInventoryItem(id);
                }
            }
        }
    });

    // Pestaña de Reportes
    generateReportsBtn.addEventListener('click', generateReports);


    // --- Inicialización al cargar la página ---
    loadAllData(); // Cargar todos los datos desde localStorage
    updateSummaryCounts(); // Actualizar el resumen
    updateRecentSalesActivity(); // Actualizar la actividad reciente en el resumen

    // Cargar la pestaña activa al recargar la página o ir a resumen por defecto
    const storedTab = localStorage.getItem('activeTab');
    if (storedTab) {
        openTab(storedTab);
    } else {
        openTab('resumen'); // Pestaña por defecto
    }

    // Inicializar select de productos en la pestaña de ventas si es la activa
    // (openTab ya lo hace al activar la pestaña de ventas, pero si se carga directo en ventas)
    if (document.getElementById('ventas').classList.contains('active')) {
        populateProductSelectForSales();
        renderCartItems();
    }
});
