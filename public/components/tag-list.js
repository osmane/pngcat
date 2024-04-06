class TagList extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._tagsFromDb = []
    this._usableTags = []
    this._selectedTags = []
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/components/tag-list.css');
    
    this.shadowRoot.innerHTML = `
            <div class="container real-tag-container-cl" id="real-tag-container">
                <input type="text" id="real-tag-definer" class="real-tag-definer-cl" placeholder="Define a tag">
            </div>
            <div class="top-container" id="pre-tag-top-container" style="display: none;">
                <div class="container" id="add-tag-btn-top-container">
                    <div id="add-new-tag-btn-container"></div>
                    <div class="right-margined-title">Tag history</div>
                </div>
                <div class="container" id="pre-tag-container"></div>
            </div>
        `
    this.shadowRoot.appendChild(linkElem);
  }

  init() {
    const realTagDefiner = this.shadowRoot.getElementById('real-tag-definer')
    const preTagTopContainer = this.shadowRoot.getElementById('pre-tag-top-container')
    const realTagContainer = this.shadowRoot.getElementById('real-tag-container')

    this.shadowRoot.querySelector('#real-tag-container').addEventListener('click', () => {
      this.shadowRoot.querySelector('#pre-tag-top-container').style.display = 'block'
      this.shadowRoot.querySelector('#real-tag-container input[type="text"]').focus();      
    })

    realTagDefiner.addEventListener('input', (event) => {
      this.updateAddButton(event.target.value)
    })

    realTagDefiner.addEventListener('focus', () => {
      this.updateUsableTagsDisplay()
      preTagTopContainer.style.display = 'block'
      // preTagTopContainer.style.width = this.style.width
      const rect = this.getBoundingClientRect();
      preTagTopContainer.style.width = rect.width + 24 + 'px'
      preTagTopContainer.style.left = rect.left + window.scrollX-13 + 'px'
    })

    realTagDefiner.addEventListener('keydown', (event) => {      
      if ((event.key === 'Tab' || event.key === 'Enter') && event.target.value.trim() !== '') {
        event.preventDefault(); 
        this.addOrSelectTag(event.target.value.trim(), event.key === 'Tab' ? 'tab' : 'enter');        
      }
    });

    this.shadowRoot.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-btn') ||
        (event.target.parentElement && event.target.parentElement.classList.contains('delete-btn'))) {        
        const upperEl = event.target.closest('.pre-tag') ? event.target.closest('.pre-tag') : event.target.closest('.real-tag')
        const tagText = upperEl.textContent.trim()
        if (upperEl.classList.contains('pre-tag')) {
          this.usableTags = this.usableTags.filter(t => t !== tagText)
          this.selectedTags = this.selectedTags.filter(t => t !== tagText)
        } else if (upperEl.classList.contains('real-tag')) {
          this.selectedTags = this.selectedTags.filter(t => t !== tagText)
        }
      } else if (event.target.classList.contains('pre-tag') ||
        (event.target.parentElement && event.target.parentElement.classList.contains('pre-tag'))) {
        const relatedTag = event.target.classList.contains('pre-tag') ? event.target : event.target.parentElement
        const tagText = relatedTag.querySelector('.tag-data').textContent.trim()
        this.addOrSelectTag(tagText, 'pre-tag')
      }

      this.updateUsableTagsDisplay()
      this.updateSelectedTagsDisplay()
    })

    document.addEventListener('click', (event) => {
      const path = event.composedPath()
      if (!path.includes(preTagTopContainer) && !path.includes(realTagContainer)) {
        preTagTopContainer.style.display = 'none'
      }
    })
  }

  updateAddButton(value) {
    const addNewTagBtnContainer = this.shadowRoot.getElementById('add-new-tag-btn-container')
    addNewTagBtnContainer.innerHTML = ''

    if (value.trim()) {
      const addButton = document.createElement('button')
      addButton.textContent = `Click to add "${value}" (Tab or Enter)`
      addButton.addEventListener('click', () => {
        this.addOrSelectTag(value.trim(), 'button')
      })
      addNewTagBtnContainer.appendChild(addButton)
    }
  }

  addOrSelectTag(newTag, eventSource) {
    if (this._selectedTags.includes(newTag) && (eventSource === 'pre-tag')) {
      this.selectedTags = this._selectedTags.filter(t => t !== newTag)
    } else {
      if (!this._selectedTags.includes(newTag)) {
        this._selectedTags.push(newTag)
        this.selectedTags = this._selectedTags
      }
      if (!this.usableTags.includes(newTag)) {
        this.usableTags.push(newTag)
        this.usableTags = this.usableTags
      }
    }
    this.shadowRoot.getElementById('real-tag-definer').value = ''
    this.updateUsableTagsDisplay()
    this.updateSelectedTagsDisplay()
    const addNewTagBtnContainer = this.shadowRoot.getElementById('add-new-tag-btn-container')
    addNewTagBtnContainer.innerHTML = ''
  }

  updateUsableTagsDisplay() {
    const preTagContainer = this.shadowRoot.getElementById('pre-tag-container')
    preTagContainer.innerHTML = ''
    this.usableTags.forEach(tag => {
      const tagEl = document.createElement('div')
      tagEl.className = 'pre-tag'
      if (this._selectedTags.includes(tag)) {
        tagEl.classList.add('selected-tag')
      } else {
        tagEl.classList.remove('selected-tag')
      }

      const dataSpan = document.createElement('span')
      dataSpan.className = 'tag-data'
      dataSpan.textContent = tag
      tagEl.appendChild(dataSpan)

      this.addDeleteButton(tagEl)

      preTagContainer.appendChild(tagEl)
    })
  }

  updateSelectedTagsDisplay() {
    const realTagContainer = this.shadowRoot.getElementById('real-tag-container')
    realTagContainer.querySelectorAll('.real-tag').forEach(tag => tag.remove())
    this._selectedTags.forEach(tag => {
      const tagEl = document.createElement('div')
      tagEl.className = 'real-tag'
      const dataSpan = document.createElement('span')
      dataSpan.className = 'tag-data'
      dataSpan.textContent = tag
      tagEl.appendChild(dataSpan)
      this.addDeleteButton(tagEl)
      realTagContainer.insertBefore(tagEl, this.shadowRoot.getElementById('real-tag-definer'))
    })

  }

  addDeleteButton(tagEl) {
    const deleteBtn = document.createElement('span')
    deleteBtn.classList.add('delete-btn')
    if (tagEl.classList.contains('pre-tag')) {
      deleteBtn.title = 'Remove from history'
    }
    tagEl.appendChild(deleteBtn)
    const deleteBtnInner = document.createElement('span')
    deleteBtnInner.classList.add('delete-btn-inner')
    deleteBtn.appendChild(deleteBtnInner)
  }

  get tagsFromDb() {
    return this._tagsFromDb
  }

  set tagsFromDb(tags) {
    if (!this.arraysEqual(this._tagsFromDb, tags)) {
      this._tagsFromDb = tags
      this._usableTags = [...new Set(this._tagsFromDb)]
      this.updateUsableTagsDisplay()
      this.updateUserInteraction()
    }    
  }

  set selectedTags(tags) {
    this._selectedTags = tags
    console.log('_selectedTags in set selectedTags: ' + this._selectedTags)
    this.updateDocSelectedTags()
  }


  arraysEqual(a, b) {
      return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  get usableTags() {
    return this._usableTags
  }

  set usableTags(tags) {
    this._usableTags = tags
    this.tagsFromDb = this._usableTags
  }

  get selectedTags() {  
    return this._selectedTags
  }

  connectedCallback() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.loadDataFromPage();
      window.addEventListener('tagsHistoryUpdated', this.handleDataUpdate.bind(this));
      window.addEventListener('tagsHistoryUpdated', this.handleDataUpdate.bind(this));
    } 
  }

  loadDataFromPage() {
    const sharedDataEl = document.getElementsByName('sharedTagData')[0];
    const sharedDataValue = sharedDataEl.value;
    this.tagsFromDb = sharedDataValue.split(',');
    this.init(); 
  }

  handleDataUpdate(e) {
    this.tagsFromDb = e.detail;
  }

  updateUserInteraction(newData) {    
    updateTagHistory(this.tagsFromDb);
  }

  findHiddenInputInAncestors(element) {
      let parent = element.parentElement;
      while (parent !== null && parent.tagName !== 'BODY') {
          const inputs = Array.from(parent.children).filter(child => ((child.tagName === 'INPUT') && (child.type === 'hidden')));
          if (inputs.length > 0) {
              return inputs[0];
          }
          parent = parent.parentElement;
      }    
      return null;
  }

  updateDocSelectedTags() {    
    updateLocalSelectedTags(this.selectedTags, this.findHiddenInputInAncestors(this));
  }

  disconnectedCallback() {
    window.removeEventListener('tagsHistoryUpdated', this.handleDataUpdate.bind(this));
    window.removeEventListener('selectedTagsUpdated', this.handleDataUpdate.bind(this));
  }
}

customElements.define('tag-list', TagList)
