const tagList = (function () {
    const createElement = (element, attributes, ...children) => {
      const el = document.createElement(element);
      for (const attribute in attributes) {
        el.setAttribute(attribute, attributes[attribute]);
      }
      children.forEach((child) => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else {
          el.appendChild(child);
        }
      });
      return el;
    };
  
    const tagsFromDb = [
      'Surreal art',
      'Abstract painting',
      'Neon lights',
      'Glowing sunset',
      'Digital artwork'
    ];
    const usableTags = [...new Set(tagsFromDb)];
    const selectedTags = [];
    let preTagTopContainer = false;
    let realTagDefiner = '';
  
    const updateAddButton = (value) => {
      if (value.trim() !== '') {
        const addButton = createElement(
          'button',
          { onClick: () => addOrSelectTag(value.trim()) },
            `Click to add "${value}" (or press Tab)`
        );
        document.getElementById('add-new-tag-btn-container').appendChild(addButton);
      }
    };
  
    const resetFilter = () => {
      realTagDefiner = '';
      updateUsableTagsDisplay();
    };
  
    const addOrSelectTag = (newTag) => {
      const isNewTag = !usableTags.includes(newTag);
      const isNotSelected = !selectedTags.includes(newTag);
  
      if (isNewTag && newTag !== '') {
        usableTags.push(newTag);
      }
  
      if (isNewTag || isNotSelected) {
        selectedTags.push(newTag);
      }
  
      resetFilter();
      updateSelectedTagsDisplay();
      document.getElementById('add-new-tag-btn-container').innerHTML = '';
    };
  
    const updateUsableTagsDisplay = () => {
      const filterText = realTagDefiner.toLowerCase().trim();
      const preTagContainer = document.getElementById('pre-tag-container');
      if (!preTagContainer) {
        return;
      }
      const existingTags = preTagContainer.querySelectorAll('.pre-tag');
      existingTags.forEach((tag) => tag.remove());
  
      usableTags.forEach((tag) => {
        if (tag.toLowerCase().includes(filterText) || filterText === '') {
          const tagEl = createElement(
            'div',
            { className: 'pre-tag', onClick: () => selectTag(tag) },
            tag,
            createElement(
              'span',
              { className: 'delete-btn', onClick: () => deleteTag(tag) },
              createElement('span', { className: 'delete-btn-inner' })
            )
          );
          if (selectedTags.includes(tag)) {
            tagEl.classList.add('selected-tag');
          } else {
            tagEl.classList.remove('selected-tag');
          }
          preTagContainer.appendChild(tagEl);
        }
      });
    };
  
    const selectTag = (tag) => {
      const tagIndex = selectedTags.indexOf(tag);
      if (tagIndex === -1) {
        selectedTags.push(tag);
      } else {
        selectedTags.splice(tagIndex, 1);
      }
      updateSelectedTagsDisplay();
      updateUsableTagsDisplay();
    };
  
    const deleteTag = (tag) => {
      usableTags = usableTags.filter((t) => t !== tag);
      selectedTags = selectedTags.filter((t) => t !== tag);
      updateUsableTagsDisplay();
      updateSelectedTagsDisplay();
    };
  
    const updateSelectedTagsDisplay = () => {
      const realTagContainer = document.getElementById('real-tag-container');
      if (!realTagContainer) {
        return;
      }
      const existingTags = realTagContainer.querySelectorAll('.real-tag');
      existingTags.forEach((tag) => tag.remove());
  
      selectedTags.forEach((tag) => {
        const tagEl = createElement(
          'div',
          { className: 'real-tag' },
          tag,
          createElement(
            'span',
            { className: 'delete-btn', onClick: () => deleteTag(tag) },
            createElement('span', { className: 'delete-btn-inner' })
          )
        );
        realTagContainer.insertBefore(tagEl, document.getElementById('real-tag-definer'));
      });
    };
  
    const togglePreTagTopContainer = () => {
      preTagTopContainer = !preTagTopContainer;
      document.getElementById('pre-tag-top-container').style.display = preTagTopContainer ? 'block' : 'none';
    };
  
    const handleRealTagDefinerKeyDown = (event) => {
      if (event.key === 'Tab' && realTagDefiner.trim() !== '') {
        event.preventDefault();
        addOrSelectTag(realTagDefiner.trim());
      }
    };
  
    const init = () => {
      updateAddButton(realTagDefiner);
      updateUsableTagsDisplay();
  
      const realTagDefinerElement = document.getElementById('real-tag-definer');
      if (realTagDefinerElement) {
        realTagDefinerElement.addEventListener('input', (event) => {
          realTagDefiner = event.target.value;
          updateAddButton(realTagDefiner);
          updateUsableTagsDisplay();
        });
      }
  
      const realTagContainerElement = document.getElementById('real-tag-container');
      if (realTagContainerElement) {
        realTagContainerElement.addEventListener('click', () => {
          if (event.target === realTagContainerElement) {
            realTagDefinerElement.focus();
          }
        });
      }
  
      if (realTagContainerElement) {
        realTagContainerElement.addEventListener('click', togglePreTagTopContainer);
      }
  
      document.addEventListener('click', (event) => {
        if (
          !document.getElementById('pre-tag-top-container').contains(event.target) &&
          !document.getElementById('real-tag-container').contains(event.target)
        ) {
          preTagTopContainer = false;
          document.getElementById('pre-tag-top-container').style.display = 'none';
        }
      });
  
      if (realTagDefinerElement) {
        realTagDefinerElement.addEventListener('keydown', handleRealTagDefinerKeyDown);
      }
    };
  
    return {
      init,
    };
  })();
  
  document.addEventListener('DOMContentLoaded', () => {
    tagList.init();
  });