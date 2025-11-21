<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

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
</style>
