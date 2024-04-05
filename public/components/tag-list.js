class TagList extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._tagsFromDb = [] // ['Surreal art', 'Abstract painting', 'Neon lights', 'Glowing sunset', 'Digital artwork']
    this._usableTags = [] // [...new Set(this._tagsFromDb)]
    this._selectedTags = []
    this.shadowRoot.innerHTML = `
            <style>
            body {
                font-family: 'Source Sans Pro', 'ui-sans-serif', 'system-ui', sans-serif;
            }
        
            .container {
                display: flex;
                flex-wrap: wrap;
                gap: 3px;
                border: 1px solid #ccc;
                padding: 3px;
                align-items: flex-start;
            }
        
            .top-container {
                display: block;
                flex-wrap: wrap;
                gap: 10px;
                border: 1px solid #ccc;
                padding: 0px;
                align-items: flex-start;
                position: absolute;
                background: white;
                z-index: 1;
            }
        
            .pre-tag {
                display: flex;
                align-items: center;
                gap: 8px;
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                padding: 4px 4px;
                order: 0;
                border-radius: 3px;
                font-size: 13px;
            }
        
            .real-tag {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 4px;
                font-size: 13px;
                background-color: #f5a439;
                border: 1px solid #fed7aa;
                ;
                border-radius: 3px;
                outline: none;
                border-color: #fed7aa;
                border-style: solid;
                order: 0;
                font-weight: 600;
            }
        
            .pre-tag span,
            .real-tag span span {
                cursor: pointer;
            }
        
            .pre-tag input[type="checkbox"] {
                margin-right: 5px;
            }
        
            #add-new-tag-btn-container {
                display: flex;
                align-items: center;
            }
        
            #add-tag-btn-top-container {
                padding: 5px;
                border: 0;
            }
        
            #pre-tag-container {
                padding: 5px;
                border: 0;
            }
        
            #real-tag-definer {
                width: 80px;
                order: 1;
                border: 0;
                outline: none;
                background: #f9f6f6;
                height: 30px;
                padding-top: 0px;
                margin-top: 0px;
                min-width: 80px;
                resize: none;
            }
        
            .selected-tag {
                border: 1px solid rgb(65, 107, 65);
                background: #f5a439;
            }
        
            .delete-btn {
                content: "";
                display: inline-block;
                background-color: transparent;
                width: 10px;
                height: 18px;
                cursor: pointer;
            }
        
            .delete-btn-inner {
                clip-path: polygon(10% 0, 0 10%, 40% 50%, 0 90%, 10% 100%, 50% 60%, 90% 100%, 100% 90%, 60% 50%, 100% 10%, 90% 0, 50% 40%);
                content: "";
                display: inline-block;
                background-color: #d40a0a67;
                width: 10px;
                height: 10px;
            }
            .right-margined-title {
                margin-left: auto;
            }
            </style>
            <div class="container" id="real-tag-container">
                <input type="text" id="real-tag-definer" placeholder="Define a tag">
            </div>
            <div class="top-container" id="pre-tag-top-container" style="display: none;">
                <div class="container" id="add-tag-btn-top-container">
                    <div id="add-new-tag-btn-container"></div>
                    <div class="right-margined-title">Tag history</div>
                </div>
                <div class="container" id="pre-tag-container"></div>
            </div>
        `

  }

  init() {
    const realTagDefiner = this.shadowRoot.getElementById('real-tag-definer')
    const preTagTopContainer = this.shadowRoot.getElementById('pre-tag-top-container')
    const realTagContainer = this.shadowRoot.getElementById('real-tag-container')

    this.shadowRoot.querySelector('#real-tag-container').addEventListener('click', () => {
      this.shadowRoot.querySelector('#pre-tag-top-container').style.display = 'block'
    })

    realTagDefiner.addEventListener('input', (event) => {
      this.updateAddButton(event.target.value)
      // this.updateUsableTagsDisplay()
    })

    realTagDefiner.addEventListener('focus', () => {
      this.updateUsableTagsDisplay()
      preTagTopContainer.style.display = 'block'
    })

    realTagDefiner.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && event.target.value.trim() !== '') {
        event.preventDefault()
        this.addOrSelectTag(event.target.value.trim(), 'tab')
        // console.log(event.target)
      }
    })

    this.shadowRoot.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-btn') ||
        (event.target.parentElement && event.target.parentElement.classList.contains('delete-btn'))) {
        // const tagText = event.target.parentElement.querySelector('.tag-data').textContent.trim()
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
      addButton.textContent = `Click to add "${value}" (TAB)`
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
        this.selectedTags = this._selectedTags // to trigger setter, do not remove
      }
      if (!this.usableTags.includes(newTag)) {
        this.usableTags.push(newTag)
        this.usableTags = this.usableTags // to trigger setter, do not remove
      }
    }
    this.shadowRoot.getElementById('real-tag-definer').value = ''
    this.updateUsableTagsDisplay()
    this.updateSelectedTagsDisplay()
    if (eventSource) {
      // console.log('event source: ' + eventSource)
    }
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
      // tagEl.textContent = tag

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
      // console.log('_tagsFromDb in set tagsFromDb: ' + this._tagsFromDb)
      this.updateUsableTagsDisplay()
      // console.log('tagsFromDb set')      
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
    //console.log('usableTags get: ' + this._usableTags)
    //console.log('_tagsFromDb in get usableTags: ' + this._tagsFromDb)
    return this._usableTags
  }

  set usableTags(tags) {
    this._usableTags = tags
    this.tagsFromDb = this._usableTags
    //console.log('usableTags set')
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
    const sharedDataEl = document.getElementsByName('sharedData')[0];
    const sharedDataValue = sharedDataEl.value;
    this.tagsFromDb = sharedDataValue.split(',');
    this.init(); 
  }

  handleDataUpdate(e) {
    this.tagsFromDb = e.detail;
  }

  // Örnek: Kullanıcı etkileşimi sonucu veriyi güncelleme ve anasayfaya bildirme
  updateUserInteraction(newData) {    
    updateTagHistory(this.tagsFromDb); // Anasayfadaki fonksiyonu çağır
  }

  updateDocSelectedTags() {    
    updateLocalSelectedTags(this.selectedTags, this.parentElement); // Anasayfadaki fonksiyonu çağır
  }


  disconnectedCallback() {
    window.removeEventListener('tagsHistoryUpdated', this.handleDataUpdate.bind(this));
    window.removeEventListener('selectedTagsUpdated', this.handleDataUpdate.bind(this));
  }
}

customElements.define('tag-list', TagList)
