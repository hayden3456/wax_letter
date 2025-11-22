<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

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

    // Initialize form with existing address if available
    $: if ($appState.addresses.length > 0) {
        const addr = $appState.addresses[0];
        if (!manualForm.firstName && addr.firstName) {
            manualForm = {
                firstName: addr.firstName || '',
                lastName: addr.lastName || '',
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                zip: addr.zip || ''
            };
        }
    }

    function saveAddress() {
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

        // Replace any existing addresses with just this one
        $appState.addresses = [address];
        showValidationSuccess('Address saved successfully!');
    }

    function showValidationError(msg) {
        validationMessage = msg;
        validationType = 'error';
    }

    function showValidationSuccess(msg) {
        validationMessage = msg;
        validationType = 'success';
    }

    function handleNext() {
        // Auto-save before proceeding
        const { firstName, lastName, street, city, state, zip } = manualForm;

        if (!firstName || !lastName || !street || !city || !state || !zip) {
            showValidationError('Please fill in all required fields before continuing.');
            return;
        }

        saveAddress();
        dispatch('next');
    }

    $: hasValidAddress = $appState.addresses.length > 0 ||
        (manualForm.firstName && manualForm.lastName && manualForm.street &&
         manualForm.city && manualForm.state && manualForm.zip);
</script>

<div class="step-container">
    <h2>Step 2: Add Recipient Address</h2>
    <p class="step-description">Enter the address of the person you want to send your sample letter to.</p>

    <div class="sample-note">
        <span class="note-icon">i</span>
        <span>Sample letters are limited to one recipient. This helps you see exactly what your letter will look like before ordering in bulk.</span>
    </div>

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
    </div>

    {#if validationMessage}
        <div class="validation-message {validationType}" style="display: block;">
            {validationMessage}
        </div>
    {/if}

    <div class="step-actions">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
        <button class="btn-primary" on:click={handleNext} disabled={!hasValidAddress}>Next: Write Letter</button>
    </div>
</div>

<style>
    .step-container {
        max-width: 750px;
        margin: 2rem auto;
        padding: 2rem;
    }

    h2 {
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }

    .step-description {
        color: var(--text-light);
        margin-bottom: 2rem;
    }

    .sample-note {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #f0f7ff;
        border: 1px solid #b3d7ff;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 2rem;
        font-size: 1.4rem;
        color: #0066cc;
    }

    .note-icon {
        background: #0066cc;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.4rem;
        flex-shrink: 0;
    }

    .manual-entry-form {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text-color);
        font-size: 1.4rem;
    }

    input {
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1.4rem;
        transition: border-color 0.3s;
    }

    input:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .validation-message {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 500;
    }

    .validation-message.error {
        background: #fee;
        color: #c33;
        border: 1px solid #fcc;
    }

    .validation-message.success {
        background: #efe;
        color: #363;
        border: 1px solid #cfc;
    }

    .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        gap: 1rem;
    }

    .btn-primary, .btn-secondary {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 1.4rem;
        cursor: pointer;
        border: none;
        transition: all 0.3s ease;
        font-weight: 600;
    }

    .btn-primary {
        background: var(--primary-color, #8b4513);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--primary-hover, #6d3610);
        transform: translateY(-2px);
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: white;
        color: var(--primary-color, #8b4513);
        border: 2px solid var(--primary-color, #8b4513);
    }

    .btn-secondary:hover {
        background: #f8f8f8;
    }

    @media (max-width: 768px) {
        .step-container {
            padding: 1rem;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .step-actions {
            flex-direction: column;
        }

        .step-actions button {
            width: 100%;
        }
    }
</style>
