<script>
    import { authStore } from '$lib/stores/authStore';
    import { appState } from '$lib/stores';
    import { db } from '$lib/firebase';
    import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
    import { deleteCampaign, associateCampaignWithUser } from '$lib/firestoreService';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import { browser } from '$app/environment';

    let campaigns = [];
    let loading = true;
    let unclaimedCampaigns = [];

    // Protect route (only on client side)
    $: if (browser && !$authStore.loading && !$authStore.user) {
        goto('/login');
    }

    onMount(async () => {
        // Wait for auth to initialize
        const unsubscribe = authStore.subscribe(async ($auth) => {
            if ($auth.user) {
                await fetchCampaigns($auth.user.uid);
            } else if (!$auth.loading) {
                // handled by reactive statement
            }
        });

        return unsubscribe;
    });

    async function fetchCampaigns(uid) {
        try {
            console.log('🔍 Fetching campaigns for user:', uid);
            const q = query(
                collection(db, 'campaigns'),
                where('userId', '==', uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            campaigns = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: safeConvertDate(data.createdAt)
                };
            });
            
            // Sort manually as fallback (in case createdAt conversion failed)
            campaigns.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
            
            console.log(`✅ Loaded ${campaigns.length} campaigns for user ${uid}`);
        } catch (e) {
            // Check if it's an index error - suppress the error message since we have a fallback
            const isIndexError = e.code === 'failed-precondition' || 
                                 e.message?.includes('index') || 
                                 e.message?.includes('requires an index');
            
            if (!isIndexError) {
                console.error("Error fetching campaigns with userId filter:", e);
            }
            
            // If index is missing or other error, try without orderBy
            try {
                const qFallback = query(
                    collection(db, 'campaigns'),
                    where('userId', '==', uid)
                );
                const querySnapshot = await getDocs(qFallback);
                campaigns = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: safeConvertDate(data.createdAt)
                    };
                });
                
                // Sort manually by createdAt (newest first)
                campaigns.sort((a, b) => {
                    if (!a.createdAt || !b.createdAt) return 0;
                    return b.createdAt.getTime() - a.createdAt.getTime();
                });
                
                if (isIndexError) {
                    console.log(`⚠️ Index not created yet. Loaded ${campaigns.length} campaigns (sorted manually). Create the index to improve performance.`);
                } else {
                    console.log(`⚠️ Loaded ${campaigns.length} campaigns (no orderBy)`);
                }
            } catch (fallbackError) {
                console.error("Fallback query with userId also failed:", fallbackError);
                // Last resort: try to get ALL campaigns (for debugging)
                try {
                    console.log('🔄 Attempting to load ALL campaigns (no filter)...');
                    const allCampaignsQuery = query(collection(db, 'campaigns'));
                    const allSnapshot = await getDocs(allCampaignsQuery);
                    const allCampaigns = allSnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: safeConvertDate(data.createdAt)
                        };
                    });
                    
                    // Sort manually
                    allCampaigns.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.getTime() - a.createdAt.getTime();
                    });
                    
                    console.log(`📊 Total campaigns in database: ${allCampaigns.length}`);
                    console.log('Campaign userIds:', allCampaigns.map(c => ({ id: c.id, userId: c.userId })));
                    
                    // Show campaigns that match this user OR have no userId
                    const userCampaigns = allCampaigns.filter(c => c.userId === uid);
                    unclaimedCampaigns = allCampaigns.filter(c => !c.userId);
                    campaigns = [...userCampaigns, ...unclaimedCampaigns];
                    console.log(`✅ Showing ${userCampaigns.length} user campaigns + ${unclaimedCampaigns.length} unclaimed campaigns`);
                } catch (allError) {
                    console.error("Failed to load any campaigns:", allError);
                }
            }
        } finally {
            loading = false;
        }
    }

    function formatDate(date) {
        if (!date) return '';
        try {
            // Handle different date formats
            let dateObj;
            if (date instanceof Date) {
                dateObj = date;
            } else if (typeof date === 'string') {
                dateObj = new Date(date);
            } else if (date.toDate && typeof date.toDate === 'function') {
                dateObj = date.toDate();
            } else {
                return '';
            }
            
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(dateObj);
        } catch (e) {
            console.error('Error formatting date:', e);
            return '';
        }
    }

    function safeConvertDate(timestamp) {
        if (!timestamp) return null;
        try {
            // If it's already a Date
            if (timestamp instanceof Date) {
                return timestamp;
            }
            // If it's a Firestore Timestamp object
            if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
                try {
                    return timestamp.toDate();
                } catch (e) {
                    // If toDate() fails, try other methods
                    if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
                        // It's a Timestamp-like object, convert manually
                        return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
                    }
                }
            }
            // If it has seconds property (Firestore Timestamp format)
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
                return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
            }
            // If it's a string or number
            if (typeof timestamp === 'string' || typeof timestamp === 'number') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return null;
        } catch (e) {
            // Silently fail - don't log errors for date conversion
            return null;
        }
    }

    function startNewCampaign() {
        // Reset the store to clear any existing campaign data
        appState.reset();
        goto('/campaign/step/1');
    }

    function startSampleLetter() {
        // Reset the store and mark as sample
        appState.reset();
        appState.update(s => ({ ...s, isSample: true, name: 'Sample Letter' }));
        goto('/sample/step/1');
    }

    async function handleDeleteCampaign(event, campaignId, campaignName) {
        // Prevent the card click event from firing
        event.preventDefault();
        event.stopPropagation();
        
        const confirmMsg = campaignName 
            ? `Delete "${campaignName}"?` 
            : 'Delete this campaign?';
        
        if (confirm(confirmMsg)) {
            try {
                await deleteCampaign(campaignId);
                // Remove from local array
                campaigns = campaigns.filter(c => c.id !== campaignId);
                unclaimedCampaigns = unclaimedCampaigns.filter(c => c.id !== campaignId);
                console.log('✅ Campaign deleted:', campaignId);
            } catch (error) {
                console.error('Failed to delete campaign:', error);
                alert('Failed to delete campaign. Please try again.');
            }
        }
    }

    async function claimCampaign(event, campaignId) {
        // Prevent the card click event from firing
        event.preventDefault();
        event.stopPropagation();
        
        if (!$authStore.user) return;
        
        try {
            await associateCampaignWithUser(campaignId, $authStore.user.uid);
            // Move from unclaimed to claimed
            const campaign = unclaimedCampaigns.find(c => c.id === campaignId);
            if (campaign) {
                campaign.userId = $authStore.user.uid;
                unclaimedCampaigns = unclaimedCampaigns.filter(c => c.id !== campaignId);
            }
            console.log('✅ Campaign claimed:', campaignId);
        } catch (error) {
            console.error('Failed to claim campaign:', error);
            alert('Failed to claim campaign. Please try again.');
        }
    }
</script>

<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>My Campaigns</h1>
        <div class="header-actions">
            <button onclick={startSampleLetter} class="btn-secondary-outline">Get a Sample Letter</button>
            <button onclick={startNewCampaign} class="btn-primary">Start New Campaign</button>
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading campaigns...</p>
        </div>
    {:else if campaigns.length === 0}
        <div class="empty-state" in:fade>
            <div class="empty-icon">&#128237;</div>
            <h2>No campaigns yet</h2>
            <p>Start your first bulk mailing campaign today!</p>
            <div class="empty-actions">
                <button onclick={startNewCampaign} class="btn-primary">Create Campaign</button>
                <button onclick={startSampleLetter} class="btn-secondary">Try a Sample First</button>
            </div>
            <p class="sample-hint">New to wax seals? Order a sample letter for $15 to see our quality.</p>
        </div>
    {:else}
        <div class="campaign-grid" in:fade>
            {#each campaigns as campaign}
                <a href="/campaign/step/1?edit={campaign.id}" class="campaign-card-link">
                    <div class="campaign-card {!campaign.userId ? 'unclaimed' : ''}">
                        <button 
                            class="delete-btn" 
                            onclick={(e) => handleDeleteCampaign(e, campaign.id, campaign.name)}
                            title="Delete campaign"
                        >
                            ✕
                        </button>
                        {#if !campaign.userId}
                            <button 
                                class="claim-btn" 
                                onclick={(e) => claimCampaign(e, campaign.id)}
                                title="Claim this campaign"
                            >
                                📌 Claim
                            </button>
                        {/if}
                        <div class="campaign-status {campaign.status || 'draft'}">
                            {campaign.status || 'Draft'}
                        </div>
                        {#if !campaign.userId}
                            <div class="unclaimed-badge">
                                ⚠️ Unclaimed
                            </div>
                        {/if}
                        <h3>{campaign.name || 'Untitled Campaign'}</h3>
                        <div class="campaign-details">
                            <div class="detail">
                                <span class="icon">📅</span>
                                <span>{formatDate(campaign.createdAt)}</span>
                            </div>
                            <div class="detail">
                                <span class="icon">✉️</span>
                                <span>{campaign.recipientCount || campaign.addresses?.length || 0} Recipients</span>
                            </div>
                            {#if campaign.stampImage || campaign.stampImageUrl}
                                <div class="detail">
                                    <span class="icon">🔏</span>
                                    <span>Custom Wax Seal</span>
                                </div>
                            {/if}
                        </div>
                        <div class="campaign-actions">
                            <span class="btn-text">Continue Editing →</span>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .btn-secondary-outline {
        background: transparent;
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        padding: 0.8rem 1.5rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-secondary-outline:hover {
        background: var(--primary-color);
        color: white;
        transform: scale(1.05);
    }

    h1 {
        color: var(--primary-color);
        margin: 0;
    }

    .loading-state, .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--card-background);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        border: 2px solid var(--border-color);
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-weight: bold;
        cursor: pointer;
        border: none;
        transition: all 0.3s ease;
    }

    .btn-primary:hover {
        transform: scale(1.05);
        filter: brightness(0.9);
    }

    .empty-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
        flex-wrap: wrap;
    }

    .sample-hint {
        font-size: 0.9rem;
        color: var(--text-muted, #666);
        margin-top: 1.5rem;
        font-style: italic;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--primary-light);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .campaign-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
    }

    .campaign-card-link {
        text-decoration: none;
        color: inherit;
        display: block;
        transition: transform 0.3s;
    }

    .campaign-card-link:hover {
        transform: translateY(-5px);
    }

    .campaign-card {
        background: var(--card-background);
        padding: 1.5rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        box-shadow: var(--shadow);
        border: 2px solid var(--border-color);
        transition: box-shadow 0.3s;
        position: relative;
        cursor: pointer;
    }

    .campaign-card-link:hover .campaign-card {
        box-shadow: var(--shadow-lg);
    }

    .campaign-status {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 0.8rem;
        padding: 0.2rem 0.6rem;
        border-radius: 10px;
        font-weight: bold;
        text-transform: uppercase;
    }

    .campaign-status.draft { background: #eee; color: #666; }
    .campaign-status.pending { background: var(--secondary-color); color: #fff; }
    .campaign-status.completed { background: var(--accent-color); color: #fff; }

    .delete-btn {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        z-index: 10;
    }

    .campaign-card:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn:hover {
        background: #cc0000;
        transform: scale(1.1);
    }

    .claim-btn {
        position: absolute;
        top: 0.5rem;
        left: 3rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 15px;
        padding: 0.4rem 0.8rem;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        z-index: 10;
        font-weight: bold;
    }

    .campaign-card:hover .claim-btn {
        opacity: 1;
    }

    .claim-btn:hover {
        background: var(--primary-dark);
        transform: scale(1.05);
    }

    .unclaimed-badge {
        position: absolute;
        top: 3rem;
        right: 1rem;
        font-size: 0.75rem;
        padding: 0.3rem 0.6rem;
        border-radius: 10px;
        font-weight: bold;
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffc107;
    }

    .campaign-card.unclaimed {
        border: 2px solid #ffc107;
        background: linear-gradient(135deg, #fffbf0 0%, var(--card-background) 100%);
    }

    h3 {
        margin: 1.5rem 0 1rem;
        color: var(--text-color);
    }

    .campaign-details {
        margin-bottom: 1.5rem;
        color: var(--text-light);
    }

    .detail {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .campaign-actions {
        border-top: 1px solid #eee;
        padding-top: 1rem;
        text-align: right;
    }

    .btn-text {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: bold;
    }

    .btn-text:hover {
        text-decoration: underline;
    }
    
    .btn-secondary {
        display: inline-block;
        background: var(--secondary-color);
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        text-decoration: none;
        font-weight: bold;
        margin-top: 1rem;
        transition: transform 0.2s;
    }
    
    .btn-secondary:hover {
        transform: scale(1.05);
    }
</style>
