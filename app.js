document.addEventListener('DOMContentLoaded', () => {
  const supplierCards = Array.from(document.querySelectorAll('.supplier-card'));
  const chips = Array.from(document.querySelectorAll('.filter-row .chip'));
  const templates = Array.from(document.querySelectorAll('.template-chip'));
  const search = document.querySelector('input[type="search"]');
  const queryStatusTitle = document.querySelector('#status .supplier-name');
  const queryStatusMeta = document.querySelector('#status .supplier-meta');
  const supplierSelect = document.querySelector('#supplier');
  const categorySelect = document.querySelector('#category');
  const prioritySelect = document.querySelector('#priority');
  const dueInput = document.querySelector('#due');
  const questionInput = document.querySelector('#question');
  const attachmentsInput = document.querySelector('#attachments');
  const attachmentCount = document.querySelector('#attachment-count');
  const activityList = document.querySelector('#activity-list');

  let activeFilter = 'all';
  let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  const supplierNames = ['Green Valley Farms', 'North Coast Dairy', 'Summit Spices Ltd', 'Allergen risk', 'Certificate', 'Expiry', 'Safety'];

  const templateMap = {
    allergen: {
      supplier: 'Green Valley Farms',
      category: 'Allergen information',
      priority: 'High',
      question: 'Please confirm whether any allergen cross-contact risks exist and attach the latest allergen declaration.',
    },
    certificate: {
      supplier: 'North Coast Dairy',
      category: 'Certificate expiry',
      priority: 'Medium',
      question: 'Please share the latest certificate and confirm the expiry date so we can update our records.',
    },
    safety: {
      supplier: 'Summit Spices Ltd',
      category: 'Ingredient safety',
      priority: 'Urgent',
      question: 'Please confirm the ingredient safety status and provide any updated supporting documentation.',
    },
  };

  const getDueDate = (daysAhead) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysAhead);
    return nextDate.toISOString().slice(0, 10);
  };

  const updateAttachmentCount = () => {
    const count = attachmentsInput?.files?.length || 0;
    if (attachmentCount) {
      attachmentCount.textContent = `${count} file${count === 1 ? '' : 's'}`;
    }
  };

  const showSearchSuggestions = (term) => {
    const suggestionsDiv = document.querySelector('#search-suggestions');
    const historyDiv = document.querySelector('#search-history');
    if (!suggestionsDiv) return;

    if (!term.trim()) {
      const historyHTML = '<span class="small">Recent</span>' + searchHistory.slice(0, 3).map(h => `<div class="suggestion-item">${h}</div>`).join('');
      historyDiv.innerHTML = historyHTML;
      suggestionsDiv.classList.add('is-visible');
      return;
    }

    const matches = supplierNames.filter(name => name.toLowerCase().includes(term.toLowerCase()));
    const historyMatches = searchHistory.filter(h => h.toLowerCase().includes(term.toLowerCase()));
    const allMatches = [...new Set([...historyMatches, ...matches])];

    if (allMatches.length === 0) {
      suggestionsDiv.classList.remove('is-visible');
      return;
    }

    const suggestionsHTML = '<span class="small">Suggestions</span>' + allMatches.map(item => `<div class="suggestion-item">${item}</div>`).join('');
    historyDiv.innerHTML = suggestionsHTML;
    suggestionsDiv.classList.add('is-visible');
  };

  const updateModalSummary = () => {
    const supplier = supplierSelect?.value || 'North Coast Dairy';
    const category = categorySelect?.value || 'Allergen information';
    const priority = prioritySelect?.value || 'Medium';
    const attachmentCountValue = attachmentsInput?.files?.length || 0;
    const modalSummary = document.querySelector('#modal-summary');
    if (modalSummary) {
      modalSummary.innerHTML = `
        <strong>Supplier:</strong> ${supplier}<br>
        <strong>Type:</strong> ${category}<br>
        <strong>Priority:</strong> ${priority}<br>
        <strong>Attachments:</strong> ${attachmentCountValue} file${attachmentCountValue === 1 ? '' : 's'}
      `;
    }
  };

  const showSubmitModal = () => {
    updateModalSummary();
    document.querySelector('#submit-modal')?.classList.add('is-visible');
  };

  const hideSubmitModal = () => {
    document.querySelector('#submit-modal')?.classList.remove('is-visible');
  };

  const setActiveChip = (label) => {
    chips.forEach((chip) => {
      const isActive = chip.dataset.filter === label;
      chip.classList.toggle('is-active', isActive);
    });
  };

  const filterCards = () => {
    const term = (search?.value || '').trim().toLowerCase();
    supplierCards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const status = card.dataset.status || 'all';
      const matchesTerm = text.includes(term);
      const matchesFilter = activeFilter === 'all' || activeFilter === status;
      card.classList.toggle('is-hidden', !(matchesTerm && matchesFilter));
    });
  };

  search?.addEventListener('input', filterCards);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter || 'all';
      setActiveChip(activeFilter);
      filterCards();
    });
  });

  templates.forEach((template) => {
    template.addEventListener('click', () => {
      const selectedTemplate = templateMap[template.dataset.template || ''];
      if (!selectedTemplate) {
        return;
      }

      if (supplierSelect) {
        supplierSelect.value = selectedTemplate.supplier;
      }
      if (categorySelect) {
        categorySelect.value = selectedTemplate.category;
      }
      if (prioritySelect) {
        prioritySelect.value = selectedTemplate.priority;
      }
      if (dueInput) {
        dueInput.value = getDueDate(selectedTemplate.priority === 'Urgent' ? 2 : 7);
      }
      if (questionInput) {
        questionInput.value = selectedTemplate.question;
      }
    });
  });

  attachmentsInput?.addEventListener('change', updateAttachmentCount);

  const searchInput = document.querySelector('#supplier-search');
  searchInput?.addEventListener('input', (e) => {
    const term = e.target.value;
    showSearchSuggestions(term);
    filterCards();
  });

  searchInput?.addEventListener('focus', () => {
    showSearchSuggestions(searchInput.value);
  });

  document.addEventListener('click', (e) => {
    const suggestionsDiv = document.querySelector('#search-suggestions');
    const searchContainer = document.querySelector('#search-container');
    if (!searchContainer?.contains(e.target)) {
      suggestionsDiv?.classList.remove('is-visible');
    }
    if (e.target.closest('.suggestion-item')) {
      const term = e.target.textContent;
      if (searchInput) {
        searchInput.value = term;
        if (!searchHistory.includes(term)) {
          searchHistory.unshift(term);
          if (searchHistory.length > 10) searchHistory.pop();
          localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
      }
      suggestionsDiv?.classList.remove('is-visible');
      filterCards();
    }
  });

  document.querySelector('#submit-query-btn')?.addEventListener('click', showSubmitModal);
  document.querySelector('#modal-cancel')?.addEventListener('click', hideSubmitModal);

  document.querySelector('#modal-confirm')?.addEventListener('click', () => {
    const supplier = supplierSelect?.value || 'North Coast Dairy';
    const category = categorySelect?.value || 'Allergen information';
    const priority = prioritySelect?.value || 'Medium';
    const attachmentCountValue = attachmentsInput?.files?.length || 0;

    if (queryStatusTitle) {
      queryStatusTitle.textContent = supplier;
    }
    if (queryStatusMeta) {
      queryStatusMeta.textContent = `Query: ${category.toLowerCase()}`;
    }

    const statusBadge = document.querySelector('#status .badge.pending');
    if (statusBadge) {
      statusBadge.textContent = priority === 'Urgent' ? 'Needs attention' : 'In progress';
    }

    if (activityList) {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon submit">📤</div>
        <div class="activity-time">Now</div>
        <p>Query sent to ${supplier} with ${attachmentCountValue} attached file${attachmentCountValue === 1 ? '' : 's'} and priority set to ${priority.toLowerCase()}.</p>
      `;
      activityList.prepend(activityItem);
    }

    hideSubmitModal();
    document.querySelector('#status')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  updateAttachmentCount();
  filterCards();
});
