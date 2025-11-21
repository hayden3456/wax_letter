<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
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

        let previewSubject = letter.subject;
        let previewBody = letter.body;

        Object.keys(sampleData).forEach(key => {
            const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
            previewSubject = previewSubject.replace(regex, sampleData[key]);
            previewBody = previewBody.replace(regex, sampleData[key]);
        });

        return { subject: previewSubject, body: previewBody };
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
            const subject = substituteContent($appState.letter.subject, address);
            const body = substituteContent($appState.letter.body, address);
            const closing = $appState.letter.closing || '';
            const signature = $appState.letter.signature || '';

            // Add subject/greeting
            if (subject) {
                doc.setFontSize(12);
                doc.setFont('times', 'normal');
                const subjectLines = doc.splitTextToSize(subject, maxWidth);
                doc.text(subjectLines, margin, yPosition);
                yPosition += subjectLines.length * 7 + 10;
            }

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

            // Add closing
            if (closing) {
                if (yPosition > pageHeight - margin - 20) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.setFontSize(11);
                doc.text(closing, margin, yPosition);
                yPosition += 10;
            }

            // Add signature
            if (signature) {
                if (yPosition > pageHeight - margin - 20) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.setFontSize(11);
                doc.setFont('times', 'italic');
                doc.text(signature, margin, yPosition);
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

            // You could add sender info here if available
            // For now, leaving space for it
            const returnAddressX = 10;
            const returnAddressY = 12;

            // If we have campaign name, use it as sender
            if ($appState.letter.signature) {
                doc.text($appState.letter.signature, returnAddressX, returnAddressY);
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
</script>

<div class="step-container">
    <h2>Step 4: Review Your Campaign</h2>
    <p class="step-description">Review all your inputs before launching your campaign.</p>

    <div class="campaign-name-section">
        <label for="campaignName">Campaign Name</label>
        <input 
            id="campaignName"
            type="text" 
            bind:value={$appState.name}
            placeholder="Enter a name for your campaign..."
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
                <p class="review-greeting">{previewContent.subject}</p>
                <p class="review-body">{previewContent.body}</p>
                <p class="review-closing">{$appState.letter.closing}</p>
                <p class="review-signature">{$appState.letter.signature}</p>
            </div>
            <button class="btn-link" on:click={() => dispatch('edit', 3)}>Edit</button>
        </div>
    </div>

    <div class="campaign-summary">
        <h3>Campaign Summary</h3>
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-value">{$appState.addresses.length}</span>
                <span class="stat-label">Letters</span>
            </div>
            <div class="stat">
                <span class="stat-value">{$appState.addresses.length}</span>
                <span class="stat-label">Wax Seals</span>
            </div>
        </div>
    </div>

    <!-- Preview Letters Section -->
    <div class="preview-letters-section">
        <h3>Preview Individual Letters</h3>
        <p class="preview-description">Download personalized PDFs for each recipient to preview how their letter and envelope will look.</p>

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
                            Letter
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
                            Envelope
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <div class="step-actions center">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
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
        font-size: 1rem;
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
        font-size: 0.95rem;
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
        padding: 1rem 1.25rem;
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
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: bold;
        flex-shrink: 0;
    }

    .recipient-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .recipient-details strong {
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .recipient-address {
        font-size: 0.85rem;
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
        gap: 0.35rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
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
        font-size: 1rem;
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
    }
</style>
