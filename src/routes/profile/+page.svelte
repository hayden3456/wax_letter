<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';
    import { userStore } from '$lib/stores/userStore';
    import { auth } from '$lib/firebase';
    import {
        sendPasswordResetEmail,
        updateProfile as updateFirebaseProfile,
        EmailAuthProvider,
        reauthenticateWithCredential,
        updatePassword
    } from 'firebase/auth';

    // State
    let activeTab = $state('profile');
    let saveStatus = $state('');
    let passwordResetStatus = $state('');
    let passwordChangeStatus = $state('');

    // Profile form state
    let firstName = $state('');
    let lastName = $state('');
    let displayName = $state('');
    let phoneNumber = $state('');

    // Return address state
    let addressName = $state('');
    let addressStreet = $state('');
    let addressCity = $state('');
    let addressState = $state('');
    let addressZip = $state('');
    let addressCountry = $state('USA');

    // Password change state
    let currentPassword = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');

    // Notification preferences
    let emailNotifications = $state(true);
    let orderUpdates = $state(true);

    // Load profile on mount
    onMount(async () => {
        // Wait for auth to load
        const unsubscribe = authStore.subscribe(async (state) => {
            if (!state.loading) {
                if (!state.user) {
                    goto('/login');
                    return;
                }

                // Load user profile
                try {
                    await userStore.loadProfile(state.user.uid, state.user.email);
                    await userStore.loadOrders();
                } catch (error) {
                    console.error('Error loading profile:', error);
                }
            }
        });

        return () => unsubscribe();
    });

    // Sync form state with store
    $effect(() => {
        if ($userStore.profile) {
            firstName = $userStore.profile.firstName || '';
            lastName = $userStore.profile.lastName || '';
            displayName = $userStore.profile.displayName || '';
            phoneNumber = $userStore.profile.phoneNumber || '';

            const addr = $userStore.profile.defaultReturnAddress || {};
            addressName = addr.name || '';
            addressStreet = addr.street || '';
            addressCity = addr.city || '';
            addressState = addr.state || '';
            addressZip = addr.zip || '';
            addressCountry = addr.country || 'USA';

            const prefs = $userStore.profile.preferences || {};
            emailNotifications = prefs.emailNotifications !== false;
            orderUpdates = prefs.orderUpdates !== false;
        }
    });

    // Save profile information
    async function saveProfileInfo() {
        try {
            saveStatus = 'saving';

            await userStore.updateProfile({
                firstName,
                lastName,
                displayName,
                phoneNumber
            });

            // Also update Firebase Auth display name
            if (auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, {
                    displayName: displayName || `${firstName} ${lastName}`.trim()
                });
            }

            saveStatus = 'success';
            setTimeout(() => saveStatus = '', 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            saveStatus = 'error';
        }
    }

    // Save return address
    async function saveReturnAddress() {
        try {
            saveStatus = 'saving';

            await userStore.updateProfile({
                defaultReturnAddress: {
                    name: addressName,
                    street: addressStreet,
                    city: addressCity,
                    state: addressState,
                    zip: addressZip,
                    country: addressCountry
                }
            });

            saveStatus = 'success';
            setTimeout(() => saveStatus = '', 3000);
        } catch (error) {
            console.error('Error saving address:', error);
            saveStatus = 'error';
        }
    }

    // Save notification preferences
    async function savePreferences() {
        try {
            saveStatus = 'saving';

            await userStore.updateProfile({
                preferences: {
                    emailNotifications,
                    orderUpdates
                }
            });

            saveStatus = 'success';
            setTimeout(() => saveStatus = '', 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
            saveStatus = 'error';
        }
    }

    // Send password reset email
    async function sendResetEmail() {
        if (!$authStore.user?.email) return;

        try {
            passwordResetStatus = 'sending';
            await sendPasswordResetEmail(auth, $authStore.user.email);
            passwordResetStatus = 'sent';
        } catch (error) {
            console.error('Error sending reset email:', error);
            passwordResetStatus = 'error';
        }
    }

    // Change password directly
    async function changePassword() {
        if (!currentPassword || !newPassword || !confirmPassword) {
            passwordChangeStatus = 'empty';
            return;
        }

        if (newPassword !== confirmPassword) {
            passwordChangeStatus = 'mismatch';
            return;
        }

        if (newPassword.length < 6) {
            passwordChangeStatus = 'weak';
            return;
        }

        try {
            passwordChangeStatus = 'changing';

            // Re-authenticate user
            if (!$authStore.user?.email || !auth.currentUser) {
                passwordChangeStatus = 'error';
                return;
            }

            const credential = EmailAuthProvider.credential(
                $authStore.user.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await updatePassword(auth.currentUser, newPassword);

            passwordChangeStatus = 'success';
            currentPassword = '';
            newPassword = '';
            confirmPassword = '';

            setTimeout(() => passwordChangeStatus = '', 3000);
        } catch (err) {
            console.error('Error changing password:', err);
            const error = /** @type {any} */ (err);
            if (error.code === 'auth/wrong-password') {
                passwordChangeStatus = 'wrong-password';
            } else {
                passwordChangeStatus = 'error';
            }
        }
    }

    // Format date for display
    /** @param {any} timestamp */
    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Get status badge class
    /** @param {string} status */
    function getStatusClass(status) {
        switch (status) {
            case 'completed':
            case 'sent':
                return 'status-success';
            case 'processing':
            case 'in_progress':
                return 'status-processing';
            case 'draft':
                return 'status-draft';
            default:
                return 'status-default';
        }
    }
</script>

<svelte:head>
    <title>Profile Settings - Wax Letter</title>
</svelte:head>

<div class="profile-container">
    <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account settings and preferences</p>
    </div>

    {#if $authStore.loading || $userStore.loading}
        <div class="loading-state">
            <p>Loading your profile...</p>
        </div>
    {:else if $authStore.user}
        <!-- Tab Navigation -->
        <div class="profile-tabs">
            <button
                class="tab-btn"
                class:active={activeTab === 'profile'}
                onclick={() => activeTab = 'profile'}
            >
                Profile Info
            </button>
            <button
                class="tab-btn"
                class:active={activeTab === 'address'}
                onclick={() => activeTab = 'address'}
            >
                Return Address
            </button>
            <button
                class="tab-btn"
                class:active={activeTab === 'security'}
                onclick={() => activeTab = 'security'}
            >
                Security
            </button>
            <button
                class="tab-btn"
                class:active={activeTab === 'orders'}
                onclick={() => activeTab = 'orders'}
            >
                Order History
            </button>
            <button
                class="tab-btn"
                class:active={activeTab === 'notifications'}
                onclick={() => activeTab = 'notifications'}
            >
                Notifications
            </button>
        </div>

        <!-- Status Message -->
        {#if saveStatus}
            <div class="status-message" class:success={saveStatus === 'success'} class:error={saveStatus === 'error'}>
                {#if saveStatus === 'saving'}
                    Saving changes...
                {:else if saveStatus === 'success'}
                    Changes saved successfully!
                {:else if saveStatus === 'error'}
                    Error saving changes. Please try again.
                {/if}
            </div>
        {/if}

        <!-- Profile Info Tab -->
        {#if activeTab === 'profile'}
            <div class="profile-section">
                <h2>Personal Information</h2>
                <p class="section-description">Update your personal details</p>

                <div class="form-container">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                bind:value={firstName}
                                placeholder="Enter your first name"
                            />
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                bind:value={lastName}
                                placeholder="Enter your last name"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="displayName">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            bind:value={displayName}
                            placeholder="How would you like to be called?"
                        />
                    </div>

                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={$authStore.user.email}
                            disabled
                        />
                        <span class="form-hint">Email cannot be changed</span>
                    </div>

                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            bind:value={phoneNumber}
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <button class="btn-primary" onclick={saveProfileInfo}>
                        Save Profile
                    </button>
                </div>
            </div>
        {/if}

        <!-- Return Address Tab -->
        {#if activeTab === 'address'}
            <div class="profile-section">
                <h2>Default Return Address</h2>
                <p class="section-description">This address will be used as the default return address for your mailings</p>

                <div class="form-container">
                    <div class="form-group">
                        <label for="addressName">Name / Company</label>
                        <input
                            type="text"
                            id="addressName"
                            bind:value={addressName}
                            placeholder="Your name or company name"
                        />
                    </div>

                    <div class="form-group">
                        <label for="addressStreet">Street Address</label>
                        <input
                            type="text"
                            id="addressStreet"
                            bind:value={addressStreet}
                            placeholder="123 Main St, Suite 100"
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressCity">City</label>
                            <input
                                type="text"
                                id="addressCity"
                                bind:value={addressCity}
                                placeholder="City"
                            />
                        </div>
                        <div class="form-group">
                            <label for="addressState">State</label>
                            <input
                                type="text"
                                id="addressState"
                                bind:value={addressState}
                                placeholder="State"
                            />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="addressZip">ZIP Code</label>
                            <input
                                type="text"
                                id="addressZip"
                                bind:value={addressZip}
                                placeholder="12345"
                            />
                        </div>
                        <div class="form-group">
                            <label for="addressCountry">Country</label>
                            <input
                                type="text"
                                id="addressCountry"
                                bind:value={addressCountry}
                                placeholder="USA"
                            />
                        </div>
                    </div>

                    <button class="btn-primary" onclick={saveReturnAddress}>
                        Save Address
                    </button>
                </div>
            </div>
        {/if}

        <!-- Security Tab -->
        {#if activeTab === 'security'}
            <div class="profile-section">
                <h2>Password & Security</h2>
                <p class="section-description">Manage your password and security settings</p>

                <!-- Password Reset via Email -->
                <div class="security-card">
                    <h3>Reset Password via Email</h3>
                    <p>We'll send a password reset link to your email address.</p>

                    <button class="btn-secondary" onclick={sendResetEmail}>
                        Send Reset Email
                    </button>

                    {#if passwordResetStatus}
                        <div class="inline-status" class:success={passwordResetStatus === 'sent'} class:error={passwordResetStatus === 'error'}>
                            {#if passwordResetStatus === 'sending'}
                                Sending email...
                            {:else if passwordResetStatus === 'sent'}
                                Password reset email sent! Check your inbox.
                            {:else if passwordResetStatus === 'error'}
                                Error sending email. Please try again.
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Direct Password Change -->
                <div class="security-card">
                    <h3>Change Password Directly</h3>
                    <p>Update your password by entering your current password and a new one.</p>

                    <div class="form-container">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                bind:value={currentPassword}
                                placeholder="Enter current password"
                            />
                        </div>

                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                bind:value={newPassword}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                bind:value={confirmPassword}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <button class="btn-primary" onclick={changePassword}>
                            Change Password
                        </button>

                        {#if passwordChangeStatus}
                            <div class="inline-status"
                                class:success={passwordChangeStatus === 'success'}
                                class:error={['error', 'mismatch', 'weak', 'wrong-password', 'empty'].includes(passwordChangeStatus)}
                            >
                                {#if passwordChangeStatus === 'changing'}
                                    Updating password...
                                {:else if passwordChangeStatus === 'success'}
                                    Password changed successfully!
                                {:else if passwordChangeStatus === 'mismatch'}
                                    Passwords do not match.
                                {:else if passwordChangeStatus === 'weak'}
                                    Password must be at least 6 characters.
                                {:else if passwordChangeStatus === 'wrong-password'}
                                    Current password is incorrect.
                                {:else if passwordChangeStatus === 'empty'}
                                    Please fill in all password fields.
                                {:else if passwordChangeStatus === 'error'}
                                    Error changing password. Please try again.
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Order History Tab -->
        {#if activeTab === 'orders'}
            <div class="profile-section">
                <h2>Order History</h2>
                <p class="section-description">View your past campaigns and orders</p>

                {#if $userStore.orders && $userStore.orders.length > 0}
                    <div class="orders-list">
                        {#each $userStore.orders as order}
                            <div class="order-card">
                                <div class="order-header">
                                    <h3>{order.name}</h3>
                                    <span class="status-badge {getStatusClass(order.status)}">
                                        {order.status}
                                    </span>
                                </div>
                                <div class="order-details">
                                    <div class="order-detail">
                                        <span class="detail-label">Recipients:</span>
                                        <span class="detail-value">{order.recipientCount}</span>
                                    </div>
                                    <div class="order-detail">
                                        <span class="detail-label">Created:</span>
                                        <span class="detail-value">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div class="order-detail">
                                        <span class="detail-label">Last Updated:</span>
                                        <span class="detail-value">{formatDate(order.updatedAt)}</span>
                                    </div>
                                    {#if order.totalCost}
                                        <div class="order-detail">
                                            <span class="detail-label">Total Cost:</span>
                                            <span class="detail-value">${order.totalCost.toFixed(2)}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="order-actions">
                                    <a href="/campaign/{order.id}" class="btn-secondary-small">
                                        View Details
                                    </a>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="empty-state">
                        <p>No orders yet</p>
                        <p class="empty-hint">Your campaign history will appear here once you create your first mailing.</p>
                        <a href="/campaign/step/1" class="btn-primary">
                            Start Your First Campaign
                        </a>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Notifications Tab -->
        {#if activeTab === 'notifications'}
            <div class="profile-section">
                <h2>Notification Preferences</h2>
                <p class="section-description">Control how you receive updates about your orders</p>

                <div class="form-container">
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={emailNotifications}
                            />
                            <span class="checkbox-text">
                                <strong>Email Notifications</strong>
                                <small>Receive general updates and announcements via email</small>
                            </span>
                        </label>
                    </div>

                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={orderUpdates}
                            />
                            <span class="checkbox-text">
                                <strong>Order Updates</strong>
                                <small>Get notified when your campaigns are processed, shipped, or delivered</small>
                            </span>
                        </label>
                    </div>

                    <button class="btn-primary" onclick={savePreferences}>
                        Save Preferences
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .profile-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 2rem;
    }

    .profile-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .profile-header h1 {
        color: var(--primary-color);
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }

    .profile-header p {
        color: var(--text-light);
        font-size: 1.2rem;
    }

    .loading-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-light);
    }

    /* Tabs */
    .profile-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    .profile-tabs .tab-btn {
        padding: 0.75rem 1.25rem;
        font-size: 1rem;
    }

    /* Status Message */
    .status-message {
        padding: 1rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        text-align: center;
        margin-bottom: 1.5rem;
        font-weight: bold;
    }

    .status-message.success {
        background: #e6ffe6;
        color: var(--success-color);
        border: 2px solid var(--success-color);
    }

    .status-message.error {
        background: #ffe6e6;
        color: var(--error-color);
        border: 2px solid var(--error-color);
    }

    /* Profile Section */
    .profile-section {
        background: var(--card-background);
        padding: 2rem;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        box-shadow: var(--shadow);
    }

    .profile-section h2 {
        color: var(--primary-color);
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
    }

    .section-description {
        color: var(--text-light);
        margin-bottom: 1.5rem;
    }

    /* Form Container */
    .form-container {
        max-width: 750px;
    }

    .form-hint {
        font-size: 0.95rem;
        color: var(--text-light);
        margin-top: 0.25rem;
        display: block;
    }

    /* Security Cards */
    .security-card {
        background: white;
        padding: 1.5rem;
        border: 2px solid var(--border-color);
        border-radius: 15px;
        margin-bottom: 1.5rem;
    }

    .security-card h3 {
        color: var(--primary-color);
        font-size: 1.3rem;
        margin-bottom: 0.5rem;
    }

    .security-card p {
        color: var(--text-light);
        margin-bottom: 1rem;
    }

    .inline-status {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.95rem;
    }

    .inline-status.success {
        background: #e6ffe6;
        color: var(--success-color);
    }

    .inline-status.error {
        background: #ffe6e6;
        color: var(--error-color);
    }

    /* Orders List */
    .orders-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .order-card {
        background: white;
        padding: 1.5rem;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        transition: transform 0.2s;
    }

    .order-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow);
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .order-header h3 {
        color: var(--text-color);
        font-size: 1.3rem;
        margin: 0;
    }

    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
        text-transform: capitalize;
    }

    .status-success {
        background: #e6ffe6;
        color: var(--success-color);
    }

    .status-processing {
        background: #fff3cd;
        color: #856404;
    }

    .status-draft {
        background: #e9ecef;
        color: var(--text-light);
    }

    .status-default {
        background: #e9ecef;
        color: var(--text-light);
    }

    .order-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .order-detail {
        display: flex;
        flex-direction: column;
    }

    .detail-label {
        font-size: 0.85rem;
        color: var(--text-light);
    }

    .detail-value {
        font-weight: bold;
        color: var(--text-color);
    }

    .order-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-secondary-small {
        background: transparent;
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        padding: 0.5rem 1rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: bold;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
    }

    .btn-secondary-small:hover {
        background: rgba(152, 41, 42, 0.1);
        transform: translateY(-2px);
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border: 2px dashed var(--border-color);
        border-radius: 15px;
    }

    .empty-state p {
        color: var(--text-light);
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }

    .empty-hint {
        font-size: 1rem !important;
        margin-bottom: 1.5rem !important;
    }

    /* Checkbox Group */
    .checkbox-group {
        margin-bottom: 1.5rem;
    }

    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        cursor: pointer;
        padding: 1rem;
        background: white;
        border: 2px solid var(--border-color);
        border-radius: 15px;
        transition: all 0.2s;
    }

    .checkbox-label:hover {
        border-color: var(--primary-color);
    }

    .checkbox-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-top: 0.25rem;
        cursor: pointer;
    }

    .checkbox-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .checkbox-text strong {
        color: var(--text-color);
    }

    .checkbox-text small {
        color: var(--text-light);
        font-size: 0.9rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .profile-container {
            padding: 0 1rem;
        }

        .profile-tabs {
            gap: 0.25rem;
        }

        .profile-tabs .tab-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
        }

        .profile-section {
            padding: 1.5rem;
        }

        .order-details {
            grid-template-columns: 1fr 1fr;
        }
    }
</style>
