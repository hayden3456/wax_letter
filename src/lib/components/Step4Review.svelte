<script>
    import { appState } from '$lib/stores';
    import { authStore } from '$lib/stores/authStore';
    import { createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import jsPDF from 'jspdf';

    const dispatch = createEventDispatcher();

    // Track which PDFs are being generated
    let generatingLetterFor = null;
    let generatingEnvelopeFor = null;

    $: previewContent = getPreviewContent($appState.letter);

    function getPreviewContent(letter) {
        const sampleData = {
            '{{FirstName}}': 'John',
            '{{LastName}}': 'Doe',
            '{{FullName}}': 'John Doe',
            '{{City}}': 'New York'
        };

        let previewBody = letter.body || '';

        Object.keys(sampleData).forEach(key => {
            const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
            previewBody = previewBody.replace(regex, sampleData[key]);
        });

        return { body: previewBody };
    }

    // Substitute placeholders with actual recipient data
    function substituteContent(text, address) {
        if (!text) return '';

        const replacements = {
            '{{FirstName}}': address.firstName || '',
            '{{LastName}}': address.lastName || '',
            '{{FullName}}': address.fullName || `${address.firstName || ''} ${address.lastName || ''}`.trim(),
            '{{Company}}': address.company || '',
            '{{Address}}': address.street || address.fullAddress || '',
            '{{City}}': address.city || '',
            '{{State}}': address.state || '',
            '{{Zip}}': address.zip || ''
        };

        let result = text;
        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
            result = result.replace(regex, replacements[key]);
        });

        return result;
    }

    // Generate letter PDF for a specific recipient
    function generateLetterPDF(address, index) {
        if (!browser) return;

        generatingLetterFor = index;

        try {
            const doc = new jsPDF();

            // Set up document margins and dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 25;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Get personalized content
            const body = substituteContent($appState.letter.body, address);

            // Add body
            if (body) {
                doc.setFontSize(11);
                doc.setFont('times', 'normal');
                const bodyLines = doc.splitTextToSize(body, maxWidth);

                // Handle page breaks
                for (let i = 0; i < bodyLines.length; i++) {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.text(bodyLines[i], margin, yPosition);
                    yPosition += 7;
                }
                yPosition += 10;
            }

            // Save the PDF
            const fileName = `letter-${address.firstName || 'recipient'}-${address.lastName || index + 1}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating letter PDF:', error);
            alert('There was an error generating the letter PDF. Please try again.');
        } finally {
            generatingLetterFor = null;
        }
    }

    // Generate envelope PDF for a specific recipient
    // #10 envelope dimensions: 9.5" x 4.125" (241.3mm x 104.775mm)
    function generateEnvelopePDF(address, index) {
        if (!browser) return;

        generatingEnvelopeFor = index;

        try {
            // Create landscape PDF with #10 envelope dimensions
            // Width: 9.5 inches = 241.3mm, Height: 4.125 inches = 104.775mm
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [104.775, 241.3]
            });

            const pageWidth = 241.3;
            const pageHeight = 104.775;

            // Return address (top-left corner)
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const returnAddressX = 10;
            let returnAddressY = 12;
            const returnAddressLineHeight = 4;

            // Display return address if available
            const returnAddr = $appState.returnAddress;
            if (returnAddr.name || returnAddr.street) {
                if (returnAddr.name) {
                    doc.text(returnAddr.name, returnAddressX, returnAddressY);
                    returnAddressY += returnAddressLineHeight;
                }
                if (returnAddr.street) {
                    doc.text(returnAddr.street, returnAddressX, returnAddressY);
                    returnAddressY += returnAddressLineHeight;
                }
                const cityStateZip = [
                    returnAddr.city,
                    returnAddr.state,
                    returnAddr.zip
                ].filter(Boolean).join(', ').replace(/, ([^,]+)$/, ' $1');
                if (cityStateZip) {
                    doc.text(cityStateZip, returnAddressX, returnAddressY);
                    returnAddressY += returnAddressLineHeight;
                }
                if (returnAddr.country && returnAddr.country !== 'USA') {
                    doc.text(returnAddr.country, returnAddressX, returnAddressY);
                }
            }

            // Recipient address (center-right of envelope)
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');

            const recipientX = pageWidth * 0.45;
            const recipientY = pageHeight * 0.45;
            const lineHeight = 5;

            let currentY = recipientY;

            // Recipient name
            const fullName = address.fullName || `${address.firstName || ''} ${address.lastName || ''}`.trim();
            if (fullName) {
                doc.text(fullName, recipientX, currentY);
                currentY += lineHeight;
            }

            // Street address
            if (address.street) {
                doc.text(address.street, recipientX, currentY);
                currentY += lineHeight;
            }

            // City, State ZIP
            const cityStateZip = [
                address.city,
                address.state,
                address.zip
            ].filter(Boolean).join(', ').replace(/, ([^,]+)$/, ' $1');

            if (cityStateZip) {
                doc.text(cityStateZip, recipientX, currentY);
            }

            // Save the PDF
            const fileName = `envelope-${address.firstName || 'recipient'}-${address.lastName || index + 1}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating envelope PDF:', error);
            alert('There was an error generating the envelope PDF. Please try again.');
        } finally {
            generatingEnvelopeFor = null;
        }
    }

    function startCampaign() {
        dispatch('start');
    }

    async function saveForLater() {
        if (!$authStore.user) return;
        
        try {
            // Save the current campaign state to Firestore
            await appState.saveToFirestore($appState, $authStore.user.uid);
            // Navigate to dashboard
            goto('/dashboard');
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert('There was an error saving your campaign. Please try again.');
        }
    }
</script>

<div class="step-container">
    <h2>Step 4: Review Your Mail</h2>
    <p class="step-description">Review all your inputs before launching your mail.</p>

    <div class="campaign-name-section">
        <label for="campaignName">Title</label>
        <input 
            id="campaignName"
            type="text" 
            bind:value={$appState.name}
            placeholder="To find this group of mail in the future..."
            class="campaign-name-input"
        />
    </div>

    <div class="review-grid">
        <div class="review-card">
            <h3>Wax Seal Design</h3>
            <div class="review-seal">
                <img src={$appState.stampImage} alt="Your wax seal">
            </div>
            <button class="btn-link" on:click={() => dispatch('edit', 1)}>Edit</button>
        </div>

        <div class="review-card">
            <h3>Recipients</h3>
            <div class="review-recipients">
                <p><strong>{$appState.addresses.length}</strong> addresses</p>
                <div class="review-address-preview">
                    {#each $appState.addresses.slice(0, 3) as address}
                        <div>{address.fullName} - {address.city || ''}</div>
                    {/each}
                    {#if $appState.addresses.length > 3}
                        <div style="font-style: italic;">... and {$appState.addresses.length - 3} more</div>
                    {/if}
                </div>
            </div>
            <button class="btn-link" on:click={() => dispatch('edit', 2)}>Edit</button>
        </div>

        <div class="review-card full-width">
            <h3>Letter Content</h3>
            <div class="review-letter">
                <p class="review-body">{previewContent.body}</p>
            </div>
            <button class="btn-link" on:click={() => dispatch('edit', 3)}>Edit</button>
        </div>

        <div class="review-card">
            <h3>Return Address</h3>
            <div class="review-return-address">
                {#if $appState.returnAddress.name || $appState.returnAddress.street}
                    <div class="address-display">
                        {#if $appState.returnAddress.name}
                            <div><strong>{$appState.returnAddress.name}</strong></div>
                        {/if}
                        {#if $appState.returnAddress.street}
                            <div>{$appState.returnAddress.street}</div>
                        {/if}
                        {#if $appState.returnAddress.city || $appState.returnAddress.state || $appState.returnAddress.zip}
                            <div>
                                {[
                                    $appState.returnAddress.city,
                                    $appState.returnAddress.state,
                                    $appState.returnAddress.zip
                                ].filter(Boolean).join(', ').replace(/, ([^,]+)$/, ' $1')}
                            </div>
                        {/if}
                        {#if $appState.returnAddress.country && $appState.returnAddress.country !== 'USA'}
                            <div>{$appState.returnAddress.country}</div>
                        {/if}
                    </div>
                {:else}
                    <div class="address-placeholder">No return address set</div>
                {/if}
            </div>
            <button class="btn-link" on:click={() => dispatch('edit', 3)}>Edit</button>
        </div>
    </div>

    <div class="campaign-summary">
        <div class="summary-stats">
        <span class="stat-label">
            {$appState.addresses.length} Letters Planned
        </span>
        </div>
    </div>

    <!-- Preview Letters Section -->
    <div class="preview-letters-section">
        <h3>Preview Individual Letters</h3>
        
        <div class="recipients-preview-list">
            {#each $appState.addresses as address, index}
                <div class="recipient-preview-item">
                    <div class="recipient-info">
                        <span class="recipient-number">#{index + 1}</span>
                        <div class="recipient-details">
                            <strong>{address.fullName || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Unknown'}</strong>
                            <span class="recipient-address">
                                {address.city || ''}{address.city && address.state ? ', ' : ''}{address.state || ''}
                            </span>
                        </div>
                    </div>
                    <div class="preview-actions">
                        <button
                            class="btn-preview-download"
                            on:click={() => generateLetterPDF(address, index)}
                            disabled={generatingLetterFor === index}
                            title="Download letter PDF for {address.fullName || 'this recipient'}"
                        >
                            {#if generatingLetterFor === index}
                                <span class="spinner-small"></span>
                            {:else}
                                <span class="icon">&#128196;</span>
                            {/if}
                            Download Letter
                        </button>
                        <button
                            class="btn-preview-download"
                            on:click={() => generateEnvelopePDF(address, index)}
                            disabled={generatingEnvelopeFor === index}
                            title="Download envelope PDF for {address.fullName || 'this recipient'}"
                        >
                            {#if generatingEnvelopeFor === index}
                                <span class="spinner-small"></span>
                            {:else}
                                <span class="icon">&#9993;</span>
                            {/if}
                            DownloadEnvelope
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <div class="step-actions center">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
        {#if $authStore.user && !$authStore.loading}
            <button class="btn-secondary" on:click={saveForLater}>Save for Later</button>
        {/if}
        {#if !$authStore.user && !$authStore.loading}
            <a href="/login" class="sign-in-link">Sign In To Save Progress</a>
        {/if}
        <button class="btn-primary large" on:click={startCampaign}>Continue to Payment</button>
    </div>
</div>

<style>
    .campaign-name-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--card-background);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        border: 2px solid var(--border-color);
    }

    .campaign-name-section label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    .campaign-name-input {
        width: 100%;
        padding: 0.75rem;
        font-size: 1.4rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        box-sizing: border-box;
        transition: border-color 0.3s;
    }

    .campaign-name-input:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .campaign-name-input::placeholder {
        color: #999;
    }

    /* Preview Letters Section */
    .preview-letters-section {
        margin-top: 2rem;
        padding: 1.5rem;
        background: var(--card-background);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        border: 2px solid var(--border-color);
    }

    .preview-letters-section h3 {
        margin-bottom: 0.5rem;
        color: var(--primary-color);
    }

    .preview-description {
        color: var(--text-light);
        margin-bottom: 1.5rem;
        font-size: 1.4rem;
    }

    .recipients-preview-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: white;
    }

    .recipient-preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s;
    }

    .recipient-preview-item:last-child {
        border-bottom: none;
    }

    .recipient-preview-item:hover {
        background-color: var(--background-color);
    }

    .recipient-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        min-width: 0;
    }

    .recipient-number {
        background: var(--primary-color);
        color: white;
        padding: 0.4rem 0.7rem;
        border-radius: 4px;
        font-size: 1.4rem;
        font-weight: bold;
        flex-shrink: 0;
    }

    .recipient-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .recipient-details strong {
        font-size: 1.4rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .recipient-address {
        font-size: 1.4rem;
        color: var(--text-light);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .preview-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .btn-preview-download {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        font-size: 1.4rem;
        font-family: inherit;
        font-weight: 600;
        border: 2px solid var(--border-color);
        border-radius: 6px;
        background: var(--secondary-color);
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .btn-preview-download:hover:not(:disabled) {
        background: #f0d385;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-preview-download:active:not(:disabled) {
        transform: translateY(0);
    }

    .btn-preview-download:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-preview-download .icon {
        font-size: 1.4rem;
    }

    .spinner-small {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Scrollbar styling for the preview list */
    .recipients-preview-list::-webkit-scrollbar {
        width: 8px;
    }

    .recipients-preview-list::-webkit-scrollbar-track {
        background: var(--background-color);
        border-radius: 4px;
    }

    .recipients-preview-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }

    .recipients-preview-list::-webkit-scrollbar-thumb:hover {
        background: var(--text-light);
    }

    .step-actions.center {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
        flex-wrap: wrap;
    }

    .sign-in-link {
        display: inline-block;
        padding: 1rem 2rem;
        background-color: var(--primary-color);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: var(--shadow);
        transition: all 0.3s ease;
        font-size: 1.4rem;
    }

    .sign-in-link:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    @media (max-width: 640px) {
        .recipient-preview-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .preview-actions {
            width: 100%;
        }

        .btn-preview-download {
            flex: 1;
            justify-content: center;
        }

        .step-actions.center {
            flex-direction: column;
        }

        .sign-in-link {
            width: 100%;
            text-align: center;
        }
    }
</style>
