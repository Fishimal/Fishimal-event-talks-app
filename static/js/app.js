// BigQuery Release Notes App JS

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseUpdates = [];
    let selectedUpdateIds = new Set();
    let currentFilterType = 'all';
    let currentSearchQuery = '';

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = document.getElementById('spinner-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const typeFilters = document.getElementById('type-filters');
    const notesGrid = document.getElementById('notes-grid');
    
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
    
    // Selection Bar
    const selectionBar = document.getElementById('selection-bar');
    const selectedCountSpan = document.getElementById('selected-count');
    const selectedBadge = document.querySelector('.selected-badge');
    const btnDeselectAll = document.getElementById('btn-deselect-all');
    const btnTweetSelected = document.getElementById('btn-tweet-selected');
    
    // Modal
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const closeModalBtn = document.getElementById('close-modal');
    const btnCopyTweet = document.getElementById('btn-copy-tweet');
    const btnPostTweet = document.getElementById('btn-post-tweet');
    const copyTextSpan = document.getElementById('copy-text');
    const charProgressCircle = document.getElementById('char-progress');
    const charCountText = document.getElementById('char-count-text');
    
    // Toast
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Progress Ring Setup
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    if (charProgressCircle) {
        charProgressCircle.style.strokeDasharray = circumference;
        charProgressCircle.style.strokeDashoffset = circumference;
    }

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
    }

    function updateStats() {
        if (!releaseUpdates.length) return;
        
        valTotal.textContent = releaseUpdates.length;
        
        const features = releaseUpdates.filter(up => up.type === 'Feature').length;
        const issues = releaseUpdates.filter(up => up.type === 'Issue' || up.type === 'Fixed').length;
        const changes = releaseUpdates.filter(up => up.type === 'Changed' || up.type === 'Deprecated').length;
        
        valFeatures.textContent = features;
        valIssues.textContent = issues;
        valChanges.textContent = changes;
    }

    // --- Rendering Logic ---

    function getBadgeClass(type) {
        const t = type.toLowerCase();
        if (t === 'feature') return 'badge feature';
        if (t === 'issue' || t === 'fixed') return 'badge issue';
        if (t === 'changed') return 'badge changed';
        if (t === 'deprecated') return 'badge deprecated';
        return 'badge default';
    }

    function renderUpdates() {
        // Filter elements
        const filtered = releaseUpdates.filter(up => {
            // Type Filter
            const matchesType = currentFilterType === 'all' || up.type.toLowerCase() === currentFilterType.toLowerCase();
            
            // Search Filter
            const matchesSearch = !currentSearchQuery || 
                up.date.toLowerCase().includes(currentSearchQuery) ||
                up.type.toLowerCase().includes(currentSearchQuery) ||
                up.text.toLowerCase().includes(currentSearchQuery);
                
            return matchesType && matchesSearch;
        });

        // Show/Hide Grid or Empty State
        if (filtered.length === 0) {
            notesGrid.style.display = 'none';
            emptyState.style.display = 'flex';
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
        }
        
        updateSelectionUI();
    }

    function attachCardEventListeners() {
        // Checkbox changes
        document.querySelectorAll('.note-checkbox').forEach(cb => {
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

    function generateTweetText(updates) {
        if (updates.length === 1) {
            const up = updates[0];
            // Format single tweet nicely
            const header = `📢 BigQuery ${up.type} (${up.date}):\n\n`;
            const footer = `\n\n#GoogleCloud #BigQuery`;
            
            // Limit description size to fit in tweet limit
            const allowedDescLength = 280 - header.length - footer.length;
            let desc = up.text;
            if (desc.length > allowedDescLength) {
                desc = desc.substring(0, allowedDescLength - 3) + '...';
            }
            return `${header}${desc}${footer}`;
        } else {
            // Bulk update tweet (e.g. multiple items)
            let text = `🚀 Latest BigQuery Updates:\n\n`;
            
            updates.forEach((up, idx) => {
                const bullet = `🔹 [${up.type}] ${up.text}`;
                // Keep brief summaries
                const summary = bullet.length > 80 ? bullet.substring(0, 77) + '...' : bullet;
                text += `${summary}\n`;
            });
            
            text += `\n#GoogleCloud #BigQuery`;
            
            // If it exceeds, truncate it intelligently
            if (text.length > 280) {
                text = text.substring(0, 277) + '...';
            }
            return text;
        }
    }

    function openTweetModal(updates) {
        const tweetText = generateTweetText(updates);
        tweetTextarea.value = tweetText;
        updateCharCount();
        tweetModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeTweetModal() {
        tweetModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Unlock background scroll
        copyTextSpan.textContent = 'Copy Text';
    }

    function updateCharCount() {
        const text = tweetTextarea.value;
        const len = text.length;
        const limit = 280;
        const remaining = limit - len;
        
        charCountText.textContent = remaining;
        
        // Progress ring logic
        const percent = Math.min(100, (len / limit) * 100);
        const offset = circumference - (percent / 100) * circumference;
        charProgressCircle.style.strokeDashoffset = offset;
        
        // Color changes based on limit
        if (remaining < 0) {
            charCountText.className = 'char-count danger';
            charProgressCircle.style.stroke = 'var(--error)';
            btnPostTweet.disabled = true;
            btnPostTweet.style.opacity = 0.5;
            btnPostTweet.style.cursor = 'not-allowed';
        } else if (remaining <= 40) {
            charCountText.className = 'char-count warning';
            charProgressCircle.style.stroke = 'var(--warning)';
            btnPostTweet.disabled = false;
            btnPostTweet.style.opacity = 1;
            btnPostTweet.style.cursor = 'pointer';
        } else {
            charCountText.className = 'char-count';
            charProgressCircle.style.stroke = 'var(--primary-accent)';
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
    
    // Search input typing (debounced slightly or real-time)
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

    // Deselect All
    btnDeselectAll.addEventListener('click', () => {
        selectedUpdateIds.clear();
        document.querySelectorAll('.note-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
        updateSelectionUI();
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

    // Textarea typing character count
    tweetTextarea.addEventListener('input', updateCharCount);

    // Copy Tweet Content
    btnCopyTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        navigator.clipboard.writeText(text).then(() => {
            copyTextSpan.textContent = 'Copied!';
            showToast('Tweet text copied to clipboard!');
            setTimeout(() => {
                copyTextSpan.textContent = 'Copy Text';
            }, 2000);
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            showToast('Failed to copy to clipboard.');
        });
    });

    // Post Tweet Intent
    btnPostTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
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
                    const matchesType = currentFilterType === 'all' || up.type.toLowerCase() === currentFilterType.toLowerCase();
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
