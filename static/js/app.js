// BigQuery Release Notes App JS

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseUpdates = [];
    let selectedUpdateIds = new Set();
    let currentFilterType = 'all';
    let currentSearchQuery = '';
    let activeTweets = []; // Holds the active drafts in the modal

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = document.getElementById('spinner-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const typeFilters = document.getElementById('type-filters');
    const notesGrid = document.getElementById('notes-grid');
    const btnSelectAllFiltered = document.getElementById('btn-select-all-filtered');
    
    // States
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const btnRetry = document.getElementById('btn-retry');
    const btnResetSearch = document.getElementById('btn-reset-search');
    
    // Stats
    const valTotal = document.getElementById('val-total');
    const valFeatures = document.getElementById('val-features');
    const valIssues = document.getElementById('val-issues');
    const valChanges = document.getElementById('val-changes');
    const valAnnouncements = document.getElementById('val-announcements');
    
    // Selection Bar
    const selectionBar = document.getElementById('selection-bar');
    const selectedCountSpan = document.getElementById('selected-count');
    const selectedBadge = document.querySelector('.selected-badge');
    const btnDeselectAll = document.getElementById('btn-deselect-all');
    const btnTweetSelected = document.getElementById('btn-tweet-selected');
    
    // Modal
    const tweetModal = document.getElementById('tweet-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const btnCopyTweet = document.getElementById('btn-copy-tweet');
    const btnPostTweet = document.getElementById('btn-post-tweet');
    const copyTextSpan = document.getElementById('copy-text');
    
    // Toast
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Progress Ring Setup Constants
    const radius = 14;
    const circumference = 2 * Math.PI * radius;

    // --- API Calls ---

    async function fetchReleaseNotes() {
        setLoading(true);
        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            
            if (data.success) {
                releaseUpdates = data.updates;
                selectedUpdateIds.clear();
                updateStats();
                renderUpdates();
                setLoading(false);
            } else {
                showError(data.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showError('Network error. Check if the backend is running.');
        }
    }

    // --- UI State Helpers ---

    function setLoading(isLoading) {
        const btnExportCsv = document.getElementById('btn-export-csv');
        if (isLoading) {
            loadingState.style.display = 'flex';
            errorState.style.display = 'none';
            emptyState.style.display = 'none';
            notesGrid.style.display = 'none';
            btnRefresh.disabled = true;
            spinnerIcon.classList.add('spin');
            if (btnExportCsv) btnExportCsv.style.display = 'none';
            if (btnSelectAllFiltered) btnSelectAllFiltered.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            btnRefresh.disabled = false;
            spinnerIcon.classList.remove('spin');
            if (btnExportCsv && releaseUpdates.length > 0) {
                btnExportCsv.style.display = 'inline-flex';
            }
        }
    }

    function showError(msg) {
        setLoading(false);
        errorState.style.display = 'flex';
        errorMessage.textContent = msg;
        notesGrid.style.display = 'none';
        if (btnSelectAllFiltered) btnSelectAllFiltered.style.display = 'none';
    }

    function updateStats() {
        if (!releaseUpdates.length) return;
        
        valTotal.textContent = releaseUpdates.length;
        
        const features = releaseUpdates.filter(up => up.type.toLowerCase() === 'feature').length;
        const issues = releaseUpdates.filter(up => ['issue', 'fixed', 'known issue'].includes(up.type.toLowerCase())).length;
        const changes = releaseUpdates.filter(up => ['change', 'changed', 'breaking', 'deprecated'].includes(up.type.toLowerCase())).length;
        const announcements = releaseUpdates.filter(up => up.type.toLowerCase() === 'announcement').length;
        
        valFeatures.textContent = features;
        valIssues.textContent = issues;
        valChanges.textContent = changes;
        if (valAnnouncements) {
            valAnnouncements.textContent = announcements;
        }
    }

    // --- Rendering Logic ---

    function getBadgeClass(type) {
        const t = type.toLowerCase();
        if (t === 'feature') return 'badge feature';
        if (t === 'issue' || t === 'fixed' || t === 'known issue') return 'badge issue';
        if (t === 'change' || t === 'changed' || t === 'breaking') return 'badge changed';
        if (t === 'deprecated') return 'badge deprecated';
        if (t === 'announcement') return 'badge announcement';
        return 'badge default';
    }

    function renderUpdates() {
        // Filter elements
        const filtered = releaseUpdates.filter(up => {
            // Type Filter
            let matchesType = false;
            if (currentFilterType === 'all') {
                matchesType = true;
            } else if (currentFilterType.toLowerCase() === 'feature') {
                matchesType = up.type.toLowerCase() === 'feature';
            } else if (currentFilterType.toLowerCase() === 'issue') {
                matchesType = ['issue', 'fixed', 'known issue'].includes(up.type.toLowerCase());
            } else if (currentFilterType.toLowerCase() === 'changed') {
                matchesType = ['change', 'changed', 'breaking', 'deprecated'].includes(up.type.toLowerCase());
            } else if (currentFilterType.toLowerCase() === 'announcement') {
                matchesType = up.type.toLowerCase() === 'announcement';
            }
            
            // Search Filter
            const matchesSearch = !currentSearchQuery || 
                up.date.toLowerCase().includes(currentSearchQuery) ||
                up.type.toLowerCase().includes(currentSearchQuery) ||
                up.text.toLowerCase().includes(currentSearchQuery);
                
            return matchesType && matchesSearch;
        });

        // Show/Hide Grid or Empty State
        if (releaseUpdates.length === 0) {
            notesGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.querySelector('h3').textContent = 'No updates found';
            emptyState.querySelector('p').textContent = 'The release notes feed is currently empty.';
            btnResetSearch.style.display = 'none';
            if (btnSelectAllFiltered) btnSelectAllFiltered.style.display = 'none';
        } else if (filtered.length === 0) {
            notesGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.querySelector('h3').textContent = 'No updates match your search';
            emptyState.querySelector('p').textContent = 'Try refining your filters or search terms.';
            btnResetSearch.style.display = 'block';
            if (btnSelectAllFiltered) btnSelectAllFiltered.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            notesGrid.style.display = 'grid';
            
            notesGrid.innerHTML = '';
            
            filtered.forEach(update => {
                const isSelected = selectedUpdateIds.has(update.id);
                
                const card = document.createElement('article');
                card.className = `note-card ${isSelected ? 'selected' : ''}`;
                card.id = `card-${update.id}`;
                card.dataset.id = update.id;
                
                card.innerHTML = `
                    <div class="note-select-wrapper">
                        <label class="custom-checkbox">
                            <input type="checkbox" class="note-checkbox" ${isSelected ? 'checked' : ''} data-id="${update.id}">
                            <span class="checkmark"></span>
                        </label>
                    </div>
                    <div class="note-main-content">
                        <div class="note-header">
                            <div class="note-meta">
                                <span class="note-date">${update.date}</span>
                                <span class="${getBadgeClass(update.type)}">${update.type}</span>
                            </div>
                            <div class="note-actions">
                                <button class="card-copy-btn" data-id="${update.id}" title="Copy update to clipboard">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                                <button class="card-tweet-btn" data-id="${update.id}" title="Compose Tweet for this update">
                                    <i class="fa-brands fa-x-twitter"></i>
                                </button>
                            </div>
                        </div>
                        <div class="note-description">
                            ${update.html}
                        </div>
                    </div>
                `;
                
                notesGrid.appendChild(card);
            });
            
            // Re-attach event listeners to new cards
            attachCardEventListeners();

            // Update Select All Filtered button
            if (btnSelectAllFiltered) {
                btnSelectAllFiltered.style.display = 'inline-flex';
                const allFilteredSelected = filtered.every(up => selectedUpdateIds.has(up.id));
                const icon = btnSelectAllFiltered.querySelector('i');
                const text = btnSelectAllFiltered.querySelector('span');
                if (allFilteredSelected) {
                    icon.className = 'fa-solid fa-square-minus';
                    text.textContent = 'Deselect All Visible';
                } else {
                    icon.className = 'fa-solid fa-square-check';
                    text.textContent = 'Select All Visible';
                }
            }
        }
        
        updateSelectionUI();
    }

    function attachCardEventListeners() {
        // Card Body Click Selection (Change 1)
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignore clicks on checkboxes, links, copy/tweet buttons, or code snippets
                if (
                    e.target.closest('a') || 
                    e.target.closest('button') || 
                    e.target.closest('.card-tweet-btn') || 
                    e.target.closest('.card-copy-btn') ||
                    e.target.closest('.custom-checkbox') ||
                    e.target.closest('code')
                ) {
                    return;
                }
                
                const id = card.dataset.id;
                const checkbox = card.querySelector('.note-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    if (checkbox.checked) {
                        selectedUpdateIds.add(id);
                        card.classList.add('selected');
                    } else {
                        selectedUpdateIds.delete(id);
                        card.classList.remove('selected');
                    }
                    updateSelectionUI();
                    
                    // Sync the "Select All Filtered" button text/icon
                    syncSelectAllButtonState();
                }
            });
        });

        // Checkbox click event propagation block
        document.querySelectorAll('.note-checkbox').forEach(cb => {
            cb.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering card body click toggle
            });
            
            cb.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const card = document.getElementById(`card-${id}`);
                
                if (e.target.checked) {
                    selectedUpdateIds.add(id);
                    if (card) card.classList.add('selected');
                } else {
                    selectedUpdateIds.delete(id);
                    if (card) card.classList.remove('selected');
                }
                
                updateSelectionUI();
                syncSelectAllButtonState();
            });
        });

        // Click on individual card Copy buttons
        document.querySelectorAll('.card-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnEl = e.currentTarget;
                const id = btnEl.dataset.id;
                const update = releaseUpdates.find(up => up.id === id);
                if (update) {
                    navigator.clipboard.writeText(update.text).then(() => {
                        const icon = btnEl.querySelector('i');
                        icon.className = 'fa-solid fa-circle-check';
                        showToast('Update copied to clipboard!');
                        setTimeout(() => {
                            icon.className = 'fa-regular fa-copy';
                        }, 2000);
                    }).catch(err => {
                        console.error('Copy failed:', err);
                        showToast('Failed to copy text.');
                    });
                }
            });
        });

        // Click on individual card Tweet buttons
        document.querySelectorAll('.card-tweet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnEl = e.currentTarget;
                const id = btnEl.dataset.id;
                const update = releaseUpdates.find(up => up.id === id);
                if (update) {
                    openTweetModal([update]);
                }
            });
        });
    }

    function syncSelectAllButtonState() {
        if (!btnSelectAllFiltered) return;
        
        // Get currently filtered updates
        const filtered = releaseUpdates.filter(up => {
            let matchesType = false;
            if (currentFilterType === 'all') {
                matchesType = true;
            } else if (currentFilterType.toLowerCase() === 'feature') {
                matchesType = up.type.toLowerCase() === 'feature';
            } else if (currentFilterType.toLowerCase() === 'issue') {
                matchesType = ['issue', 'fixed', 'known issue'].includes(up.type.toLowerCase());
            } else if (currentFilterType.toLowerCase() === 'changed') {
                matchesType = ['change', 'changed', 'breaking', 'deprecated'].includes(up.type.toLowerCase());
            } else if (currentFilterType.toLowerCase() === 'announcement') {
                matchesType = up.type.toLowerCase() === 'announcement';
            }
            
            const matchesSearch = !currentSearchQuery || 
                up.date.toLowerCase().includes(currentSearchQuery) ||
                up.type.toLowerCase().includes(currentSearchQuery) ||
                up.text.toLowerCase().includes(currentSearchQuery);
                
            return matchesType && matchesSearch;
        });

        if (filtered.length > 0) {
            const allFilteredSelected = filtered.every(up => selectedUpdateIds.has(up.id));
            const icon = btnSelectAllFiltered.querySelector('i');
            const text = btnSelectAllFiltered.querySelector('span');
            if (allFilteredSelected) {
                icon.className = 'fa-solid fa-square-minus';
                text.textContent = 'Deselect All Visible';
            } else {
                icon.className = 'fa-solid fa-square-check';
                text.textContent = 'Select All Visible';
            }
        }
    }

    // --- Selection UI ---

    function updateSelectionUI() {
        const count = selectedUpdateIds.size;
        if (count > 0) {
            selectionBar.style.display = 'flex';
            selectedCountSpan.textContent = `${count} update${count > 1 ? 's' : ''} selected`;
            selectedBadge.textContent = count;
        } else {
            selectionBar.style.display = 'none';
        }
    }

    // --- Tweet Creation and Modal ---

    function generateSingleTweetText(up) {
        const header = `📢 BigQuery ${up.type} (${up.date}):\n\n`;
        const footer = `\n\n#GoogleCloud #BigQuery`;
        
        // Limit description size to fit in tweet limit
        const allowedDescLength = 280 - header.length - footer.length;
        let desc = up.text;
        if (desc.length > allowedDescLength) {
            desc = desc.substring(0, allowedDescLength - 3) + '...';
        }
        return `${header}${desc}${footer}`;
    }

    function generateThreadTexts(updates) {
        const total = updates.length;
        return updates.map((up, idx) => {
            const header = `📢 BigQuery ${up.type} (${up.date}) (${idx + 1}/${total}):\n\n`;
            const footer = `\n\n#GoogleCloud #BigQuery`;
            
            const allowedDescLength = 280 - header.length - footer.length;
            let desc = up.text;
            if (desc.length > allowedDescLength) {
                desc = desc.substring(0, allowedDescLength - 3) + '...';
            }
            return `${header}${desc}${footer}`;
        });
    }

    function openTweetModal(updates) {
        const modalContainer = document.getElementById('modal-body-container');
        if (!modalContainer) return;

        if (updates.length === 1) {
            // Render Single Composer
            const up = updates[0];
            const tweetText = generateSingleTweetText(up);
            activeTweets = [tweetText];

            modalContainer.innerHTML = `
                <div class="single-composer">
                    <div class="tweet-preview-header">
                        <div class="avatar">BQ</div>
                        <div class="user-meta">
                            <span class="user-name">BigQuery News</span>
                            <span class="user-handle">@BigQueryRelease</span>
                        </div>
                    </div>
                    <textarea id="tweet-textarea" class="tweet-textarea" placeholder="What's happening in BigQuery?"></textarea>
                    <div class="tweet-meta-controls">
                        <div class="tweet-char-counter">
                            <svg class="progress-ring" width="36" height="36">
                                <circle class="progress-ring__circle-bg" stroke="var(--ring-bg)" stroke-width="3" fill="transparent" r="14" cx="18" cy="18" />
                                <circle class="progress-ring__circle" id="char-progress" stroke="#06b6d4" stroke-width="3" fill="transparent" r="14" cx="18" cy="18" />
                            </svg>
                            <span class="char-count" id="char-count-text">280</span>
                        </div>
                    </div>
                </div>
            `;

            // Wire up elements & values
            const textarea = document.getElementById('tweet-textarea');
            textarea.value = tweetText;
            
            // Set footer button text
            copyTextSpan.textContent = 'Copy Text';
            btnPostTweet.querySelector('span').textContent = 'Tweet on X';

            // Events
            textarea.addEventListener('input', () => {
                activeTweets[0] = textarea.value;
                updateCharCountForSingle(textarea);
            });

            updateCharCountForSingle(textarea);

        } else {
            // Render Thread Composer (Change 1)
            const threadTexts = generateThreadTexts(updates);
            activeTweets = [...threadTexts];

            let html = `<div class="thread-composer" style="max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">`;
            
            updates.forEach((up, idx) => {
                html += `
                    <div class="thread-tweet-item">
                        <div class="tweet-preview-header">
                            <div class="avatar">BQ</div>
                            <div class="user-meta">
                                <span class="user-name">BigQuery News</span>
                                <span class="user-handle">@BigQueryRelease (${idx + 1}/${updates.length})</span>
                            </div>
                        </div>
                        <textarea class="tweet-textarea thread-textarea" data-index="${idx}" placeholder="Draft tweet...">${threadTexts[idx]}</textarea>
                        <div class="tweet-meta-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                            <button class="btn btn-secondary btn-sm btn-copy-thread-item" data-index="${idx}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; height: auto;">
                                <i class="fa-regular fa-copy"></i>
                                <span>Copy Tweet ${idx + 1}</span>
                            </button>
                            <div class="tweet-char-counter">
                                <svg class="progress-ring" width="36" height="36">
                                    <circle class="progress-ring__circle-bg" stroke="var(--ring-bg)" stroke-width="3" fill="transparent" r="14" cx="18" cy="18" />
                                    <circle class="progress-ring__circle thread-char-progress" data-index="${idx}" stroke="#06b6d4" stroke-width="3" fill="transparent" r="14" cx="18" cy="18" />
                                </svg>
                                <span class="char-count thread-char-count-text" data-index="${idx}">280</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            modalContainer.innerHTML = html;

            // Set footer button text
            copyTextSpan.textContent = 'Copy Entire Thread';
            btnPostTweet.querySelector('span').textContent = 'Post Thread (1st Tweet)';

            // Listeners for textareas
            const textareas = modalContainer.querySelectorAll('.thread-textarea');
            textareas.forEach(ta => {
                ta.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    activeTweets[idx] = e.target.value;
                    updateCharCountForThreadItem(e.target);
                    checkPostButtonStateForThread();
                });
                updateCharCountForThreadItem(ta);
            });

            // Listeners for individual copy buttons
            modalContainer.querySelectorAll('.btn-copy-thread-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.index);
                    const tweetText = activeTweets[idx];
                    navigator.clipboard.writeText(tweetText).then(() => {
                        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Copied!</span>`;
                        showToast(`Tweet ${idx + 1} copied!`);
                        setTimeout(() => {
                            btn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Copy Tweet ${idx + 1}</span>`;
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy thread item:', err);
                        showToast('Failed to copy tweet.');
                    });
                });
            });

            checkPostButtonStateForThread();
        }

        tweetModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeTweetModal() {
        tweetModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Unlock background scroll
        copyTextSpan.textContent = 'Copy Text';
    }

    function updateCharCountForSingle(textarea) {
        const charProgressCircle = document.getElementById('char-progress');
        const charCountText = document.getElementById('char-count-text');

        const len = textarea.value.length;
        const limit = 280;
        const remaining = limit - len;
        
        if (charCountText) charCountText.textContent = remaining;
        
        // Progress ring logic
        const percent = Math.min(100, (len / limit) * 100);
        const offset = circumference - (percent / 100) * circumference;
        if (charProgressCircle) {
            charProgressCircle.style.strokeDasharray = circumference;
            charProgressCircle.style.strokeDashoffset = offset;
        }
        
        // Color changes based on limit
        if (remaining < 0) {
            if (charCountText) charCountText.className = 'char-count danger';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--error)';
            btnPostTweet.disabled = true;
            btnPostTweet.style.opacity = 0.5;
            btnPostTweet.style.cursor = 'not-allowed';
        } else if (remaining <= 40) {
            if (charCountText) charCountText.className = 'char-count warning';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--warning)';
            btnPostTweet.disabled = false;
            btnPostTweet.style.opacity = 1;
            btnPostTweet.style.cursor = 'pointer';
        } else {
            if (charCountText) charCountText.className = 'char-count';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--primary-accent)';
            btnPostTweet.disabled = false;
            btnPostTweet.style.opacity = 1;
            btnPostTweet.style.cursor = 'pointer';
        }
    }

    function updateCharCountForThreadItem(textarea) {
        const idx = textarea.dataset.index;
        const parent = textarea.closest('.thread-tweet-item');
        const charProgressCircle = parent.querySelector(`.thread-char-progress`);
        const charCountText = parent.querySelector(`.thread-char-count-text`);

        const len = textarea.value.length;
        const limit = 280;
        const remaining = limit - len;
        
        if (charCountText) charCountText.textContent = remaining;
        
        const percent = Math.min(100, (len / limit) * 100);
        const offset = circumference - (percent / 100) * circumference;
        if (charProgressCircle) {
            charProgressCircle.style.strokeDasharray = circumference;
            charProgressCircle.style.strokeDashoffset = offset;
        }
        
        if (remaining < 0) {
            if (charCountText) charCountText.className = 'char-count danger';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--error)';
        } else if (remaining <= 40) {
            if (charCountText) charCountText.className = 'char-count warning';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--warning)';
        } else {
            if (charCountText) charCountText.className = 'char-count';
            if (charProgressCircle) charProgressCircle.style.stroke = 'var(--primary-accent)';
        }
    }

    function checkPostButtonStateForThread() {
        const hasOverLimit = activeTweets.some(txt => txt.length > 280);
        
        if (hasOverLimit) {
            btnPostTweet.disabled = true;
            btnPostTweet.style.opacity = 0.5;
            btnPostTweet.style.cursor = 'not-allowed';
        } else {
            btnPostTweet.disabled = false;
            btnPostTweet.style.opacity = 1;
            btnPostTweet.style.cursor = 'pointer';
        }
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.style.display = 'flex';
        
        // Fade in
        setTimeout(() => {
            toast.style.opacity = 1;
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
    }

    // --- Event Listeners ---

    // Refresh and Retry
    btnRefresh.addEventListener('click', fetchReleaseNotes);
    btnRetry.addEventListener('click', fetchReleaseNotes);
    
    // Search input typing
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        
        if (currentSearchQuery.length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        renderUpdates();
    });

    // Clear Search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderUpdates();
        searchInput.focus();
    });

    // Reset search from empty state
    btnResetSearch.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        currentFilterType = 'all';
        
        document.querySelectorAll('.filter-tag').forEach(tag => {
            if (tag.dataset.type === 'all') tag.classList.add('active');
            else tag.classList.remove('active');
        });
        
        renderUpdates();
    });

    // Type filters clicking
    typeFilters.addEventListener('click', (e) => {
        const tag = e.target.closest('.filter-tag');
        if (!tag) return;
        
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        
        currentFilterType = tag.dataset.type;
        renderUpdates();
    });

    // Select All Filtered button listener (Change 1)
    if (btnSelectAllFiltered) {
        btnSelectAllFiltered.addEventListener('click', () => {
            // Get currently filtered visible updates
            const filtered = releaseUpdates.filter(up => {
                let matchesType = false;
                if (currentFilterType === 'all') {
                    matchesType = true;
                } else if (currentFilterType.toLowerCase() === 'feature') {
                    matchesType = up.type.toLowerCase() === 'feature';
                } else if (currentFilterType.toLowerCase() === 'issue') {
                    matchesType = ['issue', 'fixed', 'known issue'].includes(up.type.toLowerCase());
                } else if (currentFilterType.toLowerCase() === 'changed') {
                    matchesType = ['change', 'changed', 'breaking', 'deprecated'].includes(up.type.toLowerCase());
                } else if (currentFilterType.toLowerCase() === 'announcement') {
                    matchesType = up.type.toLowerCase() === 'announcement';
                }
                
                const matchesSearch = !currentSearchQuery || 
                    up.date.toLowerCase().includes(currentSearchQuery) ||
                    up.type.toLowerCase().includes(currentSearchQuery) ||
                    up.text.toLowerCase().includes(currentSearchQuery);
                    
                return matchesType && matchesSearch;
            });
            
            const allFilteredSelected = filtered.every(up => selectedUpdateIds.has(up.id));
            
            if (allFilteredSelected) {
                // Deselect all filtered
                filtered.forEach(up => {
                    selectedUpdateIds.delete(up.id);
                    const cb = document.querySelector(`.note-checkbox[data-id="${up.id}"]`);
                    if (cb) cb.checked = false;
                    const card = document.getElementById(`card-${up.id}`);
                    if (card) card.classList.remove('selected');
                });
                showToast(`Deselected ${filtered.length} updates`);
            } else {
                // Select all filtered
                filtered.forEach(up => {
                    selectedUpdateIds.add(up.id);
                    const cb = document.querySelector(`.note-checkbox[data-id="${up.id}"]`);
                    if (cb) cb.checked = true;
                    const card = document.getElementById(`card-${up.id}`);
                    if (card) card.classList.add('selected');
                });
                showToast(`Selected ${filtered.length} updates`);
            }
            
            renderUpdates();
        });
    }

    // Deselect All
    btnDeselectAll.addEventListener('click', () => {
        selectedUpdateIds.clear();
        document.querySelectorAll('.note-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
        updateSelectionUI();
        syncSelectAllButtonState();
    });

    // Tweet Selected
    btnTweetSelected.addEventListener('click', () => {
        if (selectedUpdateIds.size === 0) return;
        
        // Gather selected updates in chronological order
        const selected = releaseUpdates.filter(up => selectedUpdateIds.has(up.id));
        openTweetModal(selected);
    });

    // Close Modal
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Copy Tweet Content
    btnCopyTweet.addEventListener('click', () => {
        if (activeTweets.length === 0) return;

        let textToCopy = "";
        let successMessage = "";
        
        if (activeTweets.length === 1) {
            textToCopy = activeTweets[0];
            successMessage = 'Tweet text copied to clipboard!';
        } else {
            // Join all tweets with dividers
            textToCopy = activeTweets.map((t, i) => `[Tweet ${i + 1}/${activeTweets.length}]\n${t}`).join('\n\n====================\n\n');
            successMessage = 'Entire thread copied to clipboard!';
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = activeTweets.length === 1 ? 'Copy Text' : 'Copy Entire Thread';
            copyTextSpan.textContent = 'Copied!';
            showToast(successMessage);
            setTimeout(() => {
                copyTextSpan.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            showToast('Failed to copy to clipboard.');
        });
    });

    // Post Tweet Intent
    btnPostTweet.addEventListener('click', () => {
        if (activeTweets.length === 0) return;
        
        // Open Web Intent for the 1st tweet
        const firstTweet = activeTweets[0];
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(firstTweet)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        
        // If it's a thread, copy the remaining tweets to help the user thread them
        if (activeTweets.length > 1) {
            showToast('Posted 1st tweet! Copied remaining tweets to clipboard.');
            const remainingText = activeTweets.slice(1).map((t, i) => `[Reply ${i + 1}]\n${t}`).join('\n\n');
            navigator.clipboard.writeText(remainingText).catch(e => console.error(e));
        }
        
        closeTweetModal();
    });

    // Export to CSV click handler
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            let itemsToExport = [];
            
            // Check if any specific updates are selected
            if (selectedUpdateIds.size > 0) {
                itemsToExport = releaseUpdates.filter(up => selectedUpdateIds.has(up.id));
            } else {
                // If not, export visible filtered items
                itemsToExport = releaseUpdates.filter(up => {
                    let matchesType = false;
                    if (currentFilterType === 'all') {
                        matchesType = true;
                    } else if (currentFilterType.toLowerCase() === 'feature') {
                        matchesType = up.type.toLowerCase() === 'feature';
                    } else if (currentFilterType.toLowerCase() === 'issue') {
                        matchesType = ['issue', 'fixed', 'known issue'].includes(up.type.toLowerCase());
                    } else if (currentFilterType.toLowerCase() === 'changed') {
                        matchesType = ['change', 'changed', 'breaking', 'deprecated'].includes(up.type.toLowerCase());
                    } else if (currentFilterType.toLowerCase() === 'announcement') {
                        matchesType = up.type.toLowerCase() === 'announcement';
                    }
                    
                    const matchesSearch = !currentSearchQuery || 
                        up.date.toLowerCase().includes(currentSearchQuery) ||
                        up.type.toLowerCase().includes(currentSearchQuery) ||
                        up.text.toLowerCase().includes(currentSearchQuery);
                    return matchesType && matchesSearch;
                });
            }
            
            if (itemsToExport.length === 0) {
                showToast('No updates available to export.');
                return;
            }
            
            // Generate CSV
            const csvRows = [['Date', 'Type', 'Description']];
            itemsToExport.forEach(item => {
                // Escape quotes inside fields
                const escapedDate = item.date.replace(/"/g, '""');
                const escapedType = item.type.replace(/"/g, '""');
                const escapedText = item.text.replace(/"/g, '""');
                csvRows.push([
                    `"${escapedDate}"`,
                    `"${escapedType}"`,
                    `"${escapedText}"`
                ]);
            });
            
            const csvContent = csvRows.map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            
            const dateStr = new Date().toISOString().slice(0, 10);
            const exportSource = selectedUpdateIds.size > 0 ? 'selected' : currentFilterType;
            link.setAttribute('download', `bigquery_release_notes_${exportSource}_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`Exported ${itemsToExport.length} updates to CSV!`);
        });
    }

    // --- Theme Toggle Logic ---
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-mode');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun theme-toggle-icon';
        }
    } else {
        document.body.classList.remove('light-mode');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon theme-toggle-icon';
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            if (themeIcon) {
                if (isLight) {
                    themeIcon.className = 'fa-solid fa-sun theme-toggle-icon';
                    showToast('Switched to Light Mode');
                } else {
                    themeIcon.className = 'fa-solid fa-moon theme-toggle-icon';
                    showToast('Switched to Dark Mode');
                }
            }
        });
    }

    // --- Init ---
    fetchReleaseNotes();
});
