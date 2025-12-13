<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let activeTab = 'csv';
    let csvInput;
    let manualForm = {
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        zip: ''
    };
    let validationMessage = '';
    let validationType = ''; // 'error' or 'success'
    let editingIndex = -1;
    let editForm = {
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        zip: ''
    };
    let showClearConfirmation = false;

    function switchTab(tab) {
        activeTab = tab;
        // Cancel editing when switching tabs
        cancelEdit();
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleCSVUpload(files[0]);
        }
    }

    function handleCSVUpload(file) {
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const csvData = e.target.result;
            parseCSV(csvData);
        };
        reader.readAsText(file);
    }

    function parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            showValidationError('CSV file must contain a header row and at least one data row.');
            return;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const validation = validateCSVHeaders(headers);
        
        if (!validation.valid) {
            showValidationError(validation.message);
            return;
        }

        const addresses = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const address = {};
                headers.forEach((header, index) => {
                    address[header] = values[index].trim();
                });

                const normalized = normalizeAddress(address, headers);
                if (normalized) {
                    addresses.push(normalized);
                }
            }
        }

        if (addresses.length === 0) {
            showValidationError('No valid addresses found in the CSV file.');
            return;
        }

        $appState.addresses = addresses;
        showValidationSuccess(`Successfully loaded ${addresses.length} addresses.`);
    }

    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result.map(val => val.replace(/^"|"$/g, '').trim());
    }

    function validateCSVHeaders(headers) {
        const hasFullName = headers.includes('name') || headers.includes('fullname') || headers.includes('full name');
        const hasFirstLast = headers.includes('firstname') || headers.includes('first name') || headers.includes('first');
        const hasLastName = headers.includes('lastname') || headers.includes('last name') || headers.includes('last');
        const hasName = hasFullName || (hasFirstLast && hasLastName) || hasFirstLast;

        const hasFullAddress = headers.includes('address') || headers.includes('full address');
        const hasStreet = headers.includes('street') || headers.includes('street address') || headers.includes('address1');
        const hasCity = headers.includes('city');
        const hasAddress = hasFullAddress || (hasStreet && hasCity);

        if (!hasName) return { valid: false, message: 'CSV must include a Name column (or First Name/Last Name columns).' };
        if (!hasAddress) return { valid: false, message: 'CSV must include an Address column (or Street, City, State, ZIP columns).' };

        return { valid: true };
    }

    function normalizeAddress(address, headers) {
        const normalized = {
            firstName: '',
            lastName: '',
            fullName: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            fullAddress: ''
        };

        if (address['name'] || address['fullname'] || address['full name']) {
            normalized.fullName = address['name'] || address['fullname'] || address['full name'];
            const nameParts = normalized.fullName.split(' ');
            normalized.firstName = nameParts[0] || '';
            normalized.lastName = nameParts.slice(1).join(' ') || '';
        } else {
            normalized.firstName = address['firstname'] || address['first name'] || address['first'] || '';
            normalized.lastName = address['lastname'] || address['last name'] || address['last'] || '';
            normalized.fullName = `${normalized.firstName} ${normalized.lastName}`.trim();
        }

        if (address['address'] || address['full address']) {
            normalized.fullAddress = address['address'] || address['full address'];
        } else {
            normalized.street = address['street'] || address['street address'] || address['address1'] || '';
            normalized.city = address['city'] || '';
            normalized.state = address['state'] || '';
            normalized.zip = address['zip'] || address['zipcode'] || address['zip code'] || address['postal'] || '';
            normalized.fullAddress = `${normalized.street}, ${normalized.city}, ${normalized.state} ${normalized.zip}`.trim();
        }

        if (!normalized.fullName || (!normalized.fullAddress && !normalized.street)) {
            return null;
        }

        return normalized;
    }

    function addManualAddress() {
        const { firstName, lastName, street, city, state, zip } = manualForm;
        
        if (!firstName || !lastName || !street || !city || !state || !zip) {
            showValidationError('Please fill in all required fields.');
            return;
        }

        const address = {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            street,
            city,
            state,
            zip,
            fullAddress: `${street}, ${city}, ${state} ${zip}`
        };

        $appState.addresses = [...$appState.addresses, address];
        
        // Reset form
        manualForm = { firstName: '', lastName: '', street: '', city: '', state: '', zip: '' };
        validationMessage = '';
    }

    function removeAddress(index) {
        const newAddresses = [...$appState.addresses];
        newAddresses.splice(index, 1);
        $appState.addresses = newAddresses;
        
        // Cancel editing if we're editing this address
        if (editingIndex === index) {
            cancelEdit();
        } else if (editingIndex > index) {
            // Adjust editing index if needed
            editingIndex--;
        }
    }

    function startEdit(index) {
        const address = $appState.addresses[index];
        editingIndex = index;
        editForm = {
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zip: address.zip || ''
        };
        validationMessage = '';
    }

    function saveEdit() {
        const { firstName, lastName, street, city, state, zip } = editForm;
        
        if (!firstName || !lastName || !street || !city || !state || !zip) {
            showValidationError('Please fill in all required fields.');
            return;
        }

        const updatedAddress = {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            street,
            city,
            state,
            zip,
            fullAddress: `${street}, ${city}, ${state} ${zip}`
        };

        const newAddresses = [...$appState.addresses];
        newAddresses[editingIndex] = updatedAddress;
        $appState.addresses = newAddresses;
        
        cancelEdit();
        showValidationSuccess('Address updated successfully.');
    }

    function cancelEdit() {
        editingIndex = -1;
        editForm = {
            firstName: '',
            lastName: '',
            street: '',
            city: '',
            state: '',
            zip: ''
        };
        validationMessage = '';
    }

    function clearAllAddresses() {
        showClearConfirmation = true;
    }

    function confirmClearAll() {
        $appState.addresses = [];
        showClearConfirmation = false;
        cancelEdit();
        showValidationSuccess('All addresses cleared.');
    }

    function cancelClearAll() {
        showClearConfirmation = false;
    }

    function showValidationError(msg) {
        validationMessage = msg;
        validationType = 'error';
    }

    function showValidationSuccess(msg) {
        validationMessage = msg;
        validationType = 'success';
    }

    function downloadSampleCSV() {
        const sampleData = `First Name,Last Name,Street,City,State,ZIP
John,Smith,123 Main Street,New York,NY,10001
Jane,Doe,456 Oak Avenue,Los Angeles,CA,90210
Robert,Johnson,789 Pine Boulevard,Chicago,IL,60601
Emily,Williams,321 Maple Drive,Houston,TX,77001
Michael,Brown,654 Cedar Lane,Phoenix,AZ,85001`;

        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-addresses.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
</script>

<div class="step-container">
    <h2>Step 2: Add Recipient Addresses</h2>
    <p class="step-description">Upload a CSV file or manually enter addresses for your mailing list.</p>

    <div class="tab-container">
        <button class="tab-btn {activeTab === 'csv' ? 'active' : ''}" on:click={() => switchTab('csv')}>Upload CSV</button>
        <button class="tab-btn {activeTab === 'manual' ? 'active' : ''}" on:click={() => switchTab('manual')}>Manual Entry</button>
    </div>

    {#if activeTab === 'csv'}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
            class="upload-area" 
            on:click={() => csvInput.click()}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleFileDrop}
        >
            <div class="upload-icon">📄</div>
            <p>Drag & drop your CSV file here or click to browse</p>
            <p class="upload-hint">CSV must include: Name (or First/Last Name) and Address fields</p>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <p class="sample-download" on:click|stopPropagation={downloadSampleCSV}>Download sample CSV</p>
            <input
                type="file"
                bind:this={csvInput}
                accept=".csv"
                hidden
                on:change={(e) => handleCSVUpload(e.target.files[0])}
            >
        </div>
        
        {#if $appState.addresses.length > 0}
            <div class="csv-preview">
                <div class="addresses-header">
                    <h4>Addresses ({$appState.addresses.length})</h4>
                    <button class="btn-clear-all" on:click={clearAllAddresses}>Clear All</button>
                </div>
                <div class="address-list">
                    {#each $appState.addresses as address, index}
                        {#if editingIndex === index}
                            <div class="address-item editing">
                                <div class="edit-form-inline">
                                    <div class="form-row">
                                        <input type="text" bind:value={editForm.firstName} placeholder="First Name">
                                        <input type="text" bind:value={editForm.lastName} placeholder="Last Name">
                                    </div>
                                    <input type="text" bind:value={editForm.street} placeholder="Street Address">
                                    <div class="form-row">
                                        <input type="text" bind:value={editForm.city} placeholder="City">
                                        <input type="text" bind:value={editForm.state} placeholder="State">
                                        <input type="text" bind:value={editForm.zip} placeholder="ZIP">
                                    </div>
                                </div>
                                <div class="address-item-actions">
                                    <button class="btn-save" on:click={saveEdit} title="Save">✓</button>
                                    <button class="btn-cancel" on:click={cancelEdit} title="Cancel">✕</button>
                                </div>
                            </div>
                        {:else}
                            <div class="address-item">
                                <div class="address-item-content">
                                    <div class="address-item-name">{address.fullName}</div>
                                    <div class="address-item-address">{address.fullAddress}</div>
                                </div>
                                <div class="address-item-actions">
                                    <button class="btn-edit" on:click={() => startEdit(index)} title="Edit">✎</button>
                                    <button class="btn-delete" on:click={() => removeAddress(index)} title="Delete">−</button>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    {:else}
        <div class="manual-entry-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName">First Name *</label>
                    <input type="text" id="firstName" bind:value={manualForm.firstName} placeholder="John">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name *</label>
                    <input type="text" id="lastName" bind:value={manualForm.lastName} placeholder="Doe">
                </div>
            </div>
            <div class="form-group">
                <label for="streetAddress">Street Address *</label>
                <input type="text" id="streetAddress" bind:value={manualForm.street} placeholder="123 Main Street">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="city">City *</label>
                    <input type="text" id="city" bind:value={manualForm.city} placeholder="New York">
                </div>
                <div class="form-group">
                    <label for="state">State *</label>
                    <input type="text" id="state" bind:value={manualForm.state} placeholder="NY">
                </div>
                <div class="form-group">
                    <label for="zipCode">ZIP Code *</label>
                    <input type="text" id="zipCode" bind:value={manualForm.zip} placeholder="10001">
                </div>
            </div>
            <button class="btn-secondary" on:click={addManualAddress}>Add Address</button>
        </div>

        {#if $appState.addresses.length > 0}
            <div class="manual-addresses">
                <div class="addresses-header">
                    <h4>Added Addresses ({$appState.addresses.length})</h4>
                    <button class="btn-clear-all" on:click={clearAllAddresses}>Clear All</button>
                </div>
                <div class="address-list">
                    {#each $appState.addresses as address, index}
                        {#if editingIndex === index}
                            <div class="address-item editing">
                                <div class="edit-form-inline">
                                    <div class="form-row">
                                        <input type="text" bind:value={editForm.firstName} placeholder="First Name">
                                        <input type="text" bind:value={editForm.lastName} placeholder="Last Name">
                                    </div>
                                    <input type="text" bind:value={editForm.street} placeholder="Street Address">
                                    <div class="form-row">
                                        <input type="text" bind:value={editForm.city} placeholder="City">
                                        <input type="text" bind:value={editForm.state} placeholder="State">
                                        <input type="text" bind:value={editForm.zip} placeholder="ZIP">
                                    </div>
                                </div>
                                <div class="address-item-actions">
                                    <button class="btn-save" on:click={saveEdit} title="Save">✓</button>
                                    <button class="btn-cancel" on:click={cancelEdit} title="Cancel">✕</button>
                                </div>
                            </div>
                        {:else}
                            <div class="address-item">
                                <div class="address-item-content">
                                    <div class="address-item-name">{address.fullName}</div>
                                    <div class="address-item-address">{address.fullAddress}</div>
                                </div>
                                <div class="address-item-actions">
                                    <button class="btn-edit" on:click={() => startEdit(index)} title="Edit">✎</button>
                                    <button class="btn-delete" on:click={() => removeAddress(index)} title="Delete">−</button>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    {/if}

    {#if validationMessage}
        <div class="validation-message {validationType}" style="display: block;">
            {validationMessage}
        </div>
    {/if}

    <div class="return-address-section">
        <h3>Return Address</h3>
        <p class="section-description">This address will appear on the envelope as the return address</p>
        
        <div class="form-group">
            <label for="returnAddressName">Name / Company</label>
            <input 
                type="text" 
                id="returnAddressName" 
                bind:value={$appState.returnAddress.name} 
                placeholder="Your name or company name"
            >
        </div>

        <div class="form-group">
            <label for="returnAddressStreet">Street Address</label>
            <input 
                type="text" 
                id="returnAddressStreet" 
                bind:value={$appState.returnAddress.street} 
                placeholder="123 Main St, Suite 100"
            >
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="returnAddressCity">City</label>
                <input 
                    type="text" 
                    id="returnAddressCity" 
                    bind:value={$appState.returnAddress.city} 
                    placeholder="City"
                >
            </div>
            <div class="form-group">
                <label for="returnAddressState">State</label>
                <input 
                    type="text" 
                    id="returnAddressState" 
                    bind:value={$appState.returnAddress.state} 
                    placeholder="State"
                >
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="returnAddressZip">ZIP Code</label>
                <input 
                    type="text" 
                    id="returnAddressZip" 
                    bind:value={$appState.returnAddress.zip} 
                    placeholder="12345"
                >
            </div>
            <div class="form-group">
                <label for="returnAddressCountry">Country</label>
                <input 
                    type="text" 
                    id="returnAddressCountry" 
                    bind:value={$appState.returnAddress.country} 
                    placeholder="USA"
                >
            </div>
        </div>
    </div>

    <div class="step-actions">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
        <button class="btn-primary" on:click={() => dispatch('next')} disabled={$appState.addresses.length === 0}>Next: Write Letter</button>
    </div>
</div>

<!-- Confirmation Dialog -->
{#if showClearConfirmation}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={cancelClearAll}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="modal-content" on:click={(e) => e.stopPropagation()}>
            <h3>Clear All Addresses?</h3>
            <p>Are you sure you want to remove all {$appState.addresses.length} addresses? This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn-secondary" on:click={cancelClearAll}>Cancel</button>
                <button class="btn-danger" on:click={confirmClearAll}>Clear All</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .tab-container {
        display: flex;
        gap: 0;
        margin: 2rem 0;
        border-bottom: 3px solid var(--border-color);
        background: var(--card-background);
        border-radius: 8px 8px 0 0;
        padding: 0.5rem 0.5rem 0 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tab-btn {
        flex: 1;
        padding: 1.2rem 2rem;
        border: none;
        border-bottom: 3px solid transparent;
        background: transparent;
        cursor: pointer;
        font-family: inherit;
        font-size: 1.7rem;
        font-weight: bold;
        color: var(--text-light);
        transition: all 0.3s;
        border-radius: 8px 8px 0 0;
        position: relative;
        margin-bottom: -3px;
    }

    .tab-btn:hover {
        background: rgba(0, 0, 0, 0.03);
        color: var(--text-color);
        transform: none;
    }

    .tab-btn.active {
        background: white;
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
        transform: none;
    }

    .tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--primary-color);
    }

    .return-address-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 2px solid var(--border-color);
    }

    .return-address-section h3 {
        color: var(--primary-color);
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
    }

    .section-description {
        color: var(--text-light);
        font-size: 1.4rem;
        margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
        .tab-container {
            margin: 1rem 0;
            padding: 0.3rem 0.3rem 0 0.3rem;
        }

        .tab-btn {
            padding: 0.8rem 1rem;
            font-size: 1.2rem;
        }

        .return-address-section {
            margin-top: 2rem;
            padding-top: 1.5rem;
        }

        .return-address-section h3 {
            font-size: 1.5rem;
        }

        .section-description {
            font-size: 1.1rem;
            margin-bottom: 1rem;
        }
    }

    @media (max-width: 480px) {
        .tab-container {
            flex-direction: column;
            padding: 0;
            border-radius: 8px;
            gap: 0;
        }

        .tab-btn {
            border-radius: 0;
            padding: 0.7rem 0.8rem;
            font-size: 1.1rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 0;
        }

        .tab-btn:first-child {
            border-radius: 8px 8px 0 0;
        }

        .tab-btn:last-child {
            border-bottom: 3px solid transparent;
        }

        .tab-btn.active {
            border-left: 3px solid var(--primary-color);
            border-bottom-color: var(--border-color);
        }

        .tab-btn.active::after {
            display: none;
        }

        .return-address-section h3 {
            font-size: 1.3rem;
        }

        .section-description {
            font-size: 1rem;
        }
    }
</style>
