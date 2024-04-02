class TagList extends HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.loadInnerHTML()
    this.initializeTags()
  }

  async loadInnerHTML () {
    try {
      const response = await fetch('/components/tag-list-innerhtml.html')
      const html = await response.text()
      this.shadowRoot.innerHTML = html
    } catch (error) {
      console.error('Error loading the innerHTML:', error)
    }
  }

  connectedCallback () {
    this.realTagDefiner = this.shadowRoot.getElementById('real-tag-definer')
    this.addNewTagBtnContainer = this.shadowRoot.getElementById('add-tag-btn-top-container')
    // Diğer elementleriniz de benzer şekilde...

    // Event listener'ları burada tanımlayın
    this.realTagDefiner.addEventListener('input', () => {
      this.updateAddButton(this.realTagDefiner.value)
    })
  }

  // Burada, önceki <script> etiketi içindeki fonksiyonları yerleştirin.
  initializeTags () {
    console.log('DOM loaded')
    const tagsFromDb = [
      'Surreal art', 'Abstract painting', 'Neon lights', 'Glowing sunset', 'Digital artwork'
    ]

    let usableTags = [...new Set(tagsFromDb)]
    let selectedTags = []
    const preTagTopContainer = document.getElementById('pre-tag-top-container')
    const preTagContainer = document.getElementById('pre-tag-container')
    const realTagContainer = document.getElementById('real-tag-container')
    const realTagDefiner = document.getElementById('real-tag-definer')
    const addNewTagBtnContainer = document.getElementById('add-tag-btn-top-container')

    preTagTopContainer.style.display = 'none'
    updateUsableTagsDisplay()

    realTagDefiner.addEventListener('input', function () {
      updateAddButton(this.value)
      updateUsableTagsDisplay()
    })

    function updateAddButton (value) {
      addNewTagBtnContainer.innerHTML = ''
      if (value.trim() !== '') {
        const addButton = document.createElement('button')
        addButton.textContent = `Click to add "${value}" (or press Tab)`
        addButton.onclick = function () {
          addOrSelectTag(value.trim())
        }
        addNewTagBtnContainer.appendChild(addButton)
      }
    }

    function resetFilter () {
      realTagDefiner.value = ''
      updateUsableTagsDisplay()
    }

    function addOrSelectTag (newTag) {
      const isNewTag = !usableTags.includes(newTag)
      const isNotSelected = !selectedTags.includes(newTag)

      if (isNewTag && newTag !== '') {
        usableTags.push(newTag)
      }

      if (isNewTag || isNotSelected) {
        selectedTags.push(newTag)
      }

      resetFilter()
      updateSelectedTagsDisplay()
      addNewTagBtnContainer.innerHTML = ''
    }

    function updateUsableTagsDisplay () {
      const filterText = realTagDefiner.value.toLowerCase().trim()
      const existingTags = preTagContainer.querySelectorAll('.pre-tag')
      existingTags.forEach(tag => tag.remove())

      usableTags.forEach(function (tag) {
        if (tag.toLowerCase().includes(filterText) || filterText === '') {
          const tagEl = document.createElement('div')
          tagEl.className = 'pre-tag'

          if (selectedTags.includes(tag)) {
            tagEl.classList.add('selected-tag')
          } else {
            tagEl.classList.remove('selected-tag')
          }

          const tagName = document.createElement('span')
          tagName.textContent = tag

          const deleteBtn = document.createElement('span')
          deleteBtn.classList.add('delete-btn')
          deleteBtn.onclick = function (event) {
            event.stopPropagation()
            usableTags = usableTags.filter(t => t !== tag)
            selectedTags = selectedTags.filter(t => t !== tag)
            updateUsableTagsDisplay()
            updateSelectedTagsDisplay()
          }

          const deleteBtnInner = document.createElement('span')
          deleteBtnInner.classList.add('delete-btn-inner')
          deleteBtn.appendChild(deleteBtnInner)

          tagEl.appendChild(tagName)
          tagEl.appendChild(deleteBtn)
          preTagContainer.appendChild(tagEl)

          tagEl.addEventListener('click', function () {
            const tagIndex = selectedTags.indexOf(tag)
            if (tagIndex === -1) {
              selectedTags.push(tag)
            } else {
              selectedTags.splice(tagIndex, 1)
            }
            updateSelectedTagsDisplay()
            updateUsableTagsDisplay()
          })

          tagEl.addEventListener('click', function (event) {
            event.stopPropagation()
          })

          deleteBtn.addEventListener('click', function (event) {
            event.stopPropagation()
          })
        }
      })
    }

    function updateSelectedTagsDisplay () {
      const existingTags = realTagContainer.querySelectorAll('.real-tag')
      existingTags.forEach(tag => tag.remove())

      selectedTags.forEach(function (tag) {
        const tagEl = document.createElement('div')
        tagEl.className = 'real-tag'
        const tagName = document.createElement('span')
        tagName.textContent = tag

        const deleteBtn = document.createElement('span')
        deleteBtn.classList.add('delete-btn')
        deleteBtn.onclick = function () {
          event.stopPropagation()
          selectedTags = selectedTags.filter(t => t !== tag)
          updateSelectedTagsDisplay()
          updateUsableTagsDisplay()
        }

        const deleteBtnInner = document.createElement('span')
        deleteBtnInner.classList.add('delete-btn-inner')
        deleteBtn.appendChild(deleteBtnInner)

        tagEl.appendChild(tagName)
        tagEl.appendChild(deleteBtn)
        realTagContainer.insertBefore(tagEl, realTagDefiner)
      })
    }

    realTagContainer.addEventListener('click', function (event) {
      if (event.target === realTagContainer) {
        realTagDefiner.focus()
      }
    })

    realTagContainer.addEventListener('click', function () {
      preTagContainer.style.display = 'flex'
      preTagTopContainer.style.display = 'block'
    })

    document.addEventListener('click', function (event) {
      if (!preTagTopContainer.contains(event.target) && !realTagContainer.contains(event.target)) {
        preTagTopContainer.style.display = 'none'
      }
    })

    realTagDefiner.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && this.value.trim() !== '') {
        event.preventDefault()
        addOrSelectTag(this.value.trim())
      }
    })
  }

  updateAddButton (value) {
    this.addNewTagBtnContainer.innerHTML = ''
    if (value.trim() !== '') {
      const addButton = document.createElement('button')
      addButton.textContent = `Click to add "${value}" (or press Tab)`
      addButton.onclick = () => {
        this.addOrSelectTag(value.trim())
      }
      this.addNewTagBtnContainer.appendChild(addButton)
    }
  }
}

customElements.define('tag-list', TagList)
