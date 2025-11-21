<script>
    import { authStore } from '$lib/stores/authStore';
    import { db } from '$lib/firebase';
    import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let campaigns = [];
    let loading = true;

    // Protect route
    $: if (!$authStore.loading && !$authStore.user) {
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
            const q = query(
                collection(db, 'campaigns'),
                where('userId', '==', uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            campaigns = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            
            console.log(`✅ Loaded ${campaigns.length} campaigns for user`);
        } catch (e) {
            console.error("Error fetching campaigns:", e);
            // If index is missing or other error, try without orderBy
            try {
                const qFallback = query(
                    collection(db, 'campaigns'),
                    where('userId', '==', uid)
                );
                const querySnapshot = await getDocs(qFallback);
                campaigns = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }));
                console.log(`⚠️ Loaded ${campaigns.length} campaigns (fallback query)`);
            } catch (fallbackError) {
                console.error("Fallback query also failed:", fallbackError);
            }
        } finally {
            loading = false;
        }
    }

    function formatDate(date) {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }
</script>

<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>My Campaigns</h1>
        <a href="/campaign/step/1" class="btn-primary">Start New Campaign</a>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading campaigns...</p>
        </div>
    {:else if campaigns.length === 0}
        <div class="empty-state" in:fade>
            <div class="empty-icon">📭</div>
            <h2>No campaigns yet</h2>
            <p>Start your first bulk mailing campaign today!</p>
            <a href="/campaign/step/1" class="btn-secondary">Create Campaign</a>
        </div>
    {:else}
        <div class="campaign-grid" in:fade>
            {#each campaigns as campaign}
                <a href="/campaign/step/1?edit={campaign.id}" class="campaign-card-link">
                    <div class="campaign-card">
                        <div class="campaign-status {campaign.status || 'draft'}">
                            {campaign.status || 'Draft'}
                        </div>
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
