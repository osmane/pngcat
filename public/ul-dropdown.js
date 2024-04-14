function initializeUlDropdown() {
    const inputs = document.querySelectorAll('.wrap-inner input.sd-auto-1 ');
    const dropdown = document.querySelector('.dropdown-menu');
    let activeInput = null;
    //let dataSource = null;
    //let dataSourceArr = [];
    let deleteClicked = false;
    const wrapInnerDivs = document.querySelectorAll('div.wrap-inner');    
    const filteredDivs = Array.from(wrapInnerDivs).filter(div => {        
        return Array.from(div.children).some(child => child.classList.contains('dd-guide'));
    });

    inputs.forEach(input => {
        if (!input.eventListeners) {
            input.eventListeners = {
                click: null,
                blur: null,
                input: null
            };
        }

        if (input.eventListeners.click) {
            input.removeEventListener('click', input.eventListeners.click);
        }
        input.eventListeners.click = handleInputClick.bind(input);
        input.addEventListener('click', input.eventListeners.click);

        if (input.eventListeners.blur) {
            input.removeEventListener('blur', input.eventListeners.blur);
        }
        input.eventListeners.blur = handleInputBlur.bind(input);
        input.addEventListener('blur', input.eventListeners.blur);

        if (input.eventListeners.input) {
            input.removeEventListener('input', input.eventListeners.input);
        }
        input.eventListeners.input = handleInputFilter.bind(input);
        input.addEventListener('input', input.eventListeners.input);

    });

    filteredDivs.forEach(wrapper => {
        if (!wrapper.eventListeners) {
            wrapper.eventListeners = {
                click: null,
            };
        }

        if (wrapper.eventListeners.click) {
            wrapper.removeEventListener('click', wrapper.eventListeners.click);
        }
        wrapper.eventListeners.click = handleWrapperClick.bind(wrapper);
        wrapper.addEventListener('click', wrapper.eventListeners.click);
    });

    document.addEventListener('click', function (e) {        
        if (activeInput) {
            console.log('body click event fired in: ' + e.target.name + ' the dropdown display is: ' + dropdown.style.display + ' la olum adamı hasta etme be!');            
            if (!activeInput.parentNode.classList.contains('wrap-inner') || !e.target.closest('.wrap-inner')) {
                dropdown.style.display = 'none';
                activeInput = null;
            }
        } else {            
            dropdown.style.display = 'none';
            activeInput = null;
        }
    });

    function handleWrapperClick(event){           
        activeInput = this.querySelector('input');
        if(activeInput) {                        
            activeInput.focus();
            activeInput.click();
        }
        event.stopPropagation();
    }

    window.addEventListener('resize', positionDropdown, { capture: false, passive: true });
    window.addEventListener('scroll', positionDropdown, { capture: false, passive: true });

    function handleInputFilter(event) {
        const filterText = event.target.value.toLowerCase();
        const lis = dropdown.querySelectorAll('li');

        lis.forEach(li => {
            const textValue = li.textContent.toLowerCase(); 
            if (textValue.includes(filterText)) {
                li.style.display = ''; 
            } else {
                li.style.display = 'none'; 
            }
        });

        if (filterText.trim().length > 0) {
            removeMandatory(event.target)
        }

        
    }

    function removeMandatory(el) {
        el.closest('.wrap-inner').style.borderColor = '';

        if (el.name === 'subTargetDir[]') {
            relatedInput = el.closest('.flex-container').querySelector('.secondary-tag-list')
            relatedInput.closest('.wrap-inner').style.borderColor = '';
        } else if (el.name === 'targetDir') {
            relatedInput = el.closest('.flex-container').querySelector('.primary-tag-list')
            relatedInput.closest('.wrap-inner').style.borderColor = '';
        }
    }


    function handleInputBlur(event) {
        if (deleteClicked) {
            deleteClicked = false;
            return;
        }
        event.stopPropagation();
        let dataSource = document.getElementsByName(this.id + 'Data')[0];
        let dataSourceArr = dataSource.value.split(',');

        if (!!event.target.value && (event.target.value.trim().length > 0) && !dataSourceArr.includes(event.target.value.trim())) {
            dataSourceArr.push(event.target.value.trim());
            dataSourceArr = [...new Set(dataSourceArr)];
            dataSource.value = dataSourceArr.join(',');
            if (event.target.value.trim().length > 0) {
                removeMandatory(event.target)
            }
        }

        console.log('input click Blur fired in: ' + event.target.id + ' the dropdown display is: ' );

    }

    function handleInputClick(event) {
        event.stopPropagation();
        activeInput = this;

        if (!!activeInput && document.getElementsByName(activeInput.id + 'Data') !== null) {
            console.log('the first bariyer passed in: ' + activeInput.id);

            dropdown.innerHTML = '';
            let dataSource = document.getElementsByName(activeInput.id + 'Data')[0];
            let dataSourceArr = dataSource.value.split(',');

            var boundHandleDropDownClick = handleDropDownClick.bind(dropdown);
            dropdown.removeEventListener('click', boundHandleDropDownClick);
            dropdown.addEventListener('click', boundHandleDropDownClick);

            document.getElementsByName(activeInput.id + 'Data')[0].value.split(',').forEach(option => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                span.className = 'dd-text-content';
                span.textContent = option;
                li.appendChild(span);

                const deleteSpan = document.createElement('div');
                //deleteSpan.textContent = 'X';
                deleteSpan.className = 'delete-btn';

                var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svgElement.setAttribute("width", "16");
                svgElement.setAttribute("height", "16");
                svgElement.setAttribute("viewBox", "0 0 24 24");
                
                var pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathElement.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");                
                svgElement.appendChild(pathElement);

                deleteSpan.appendChild(svgElement);                

                deleteSpan.addEventListener('click', function (event) {
                    event.stopPropagation();
                    const index = dataSourceArr.indexOf(option);
                    if (index > -1) {
                        dataSourceArr.splice(index, 1);                    
                        dataSource.value = dataSourceArr.join(',');
                        li.remove();
                        deleteClicked = true;
                    }
                }, true);

                li.appendChild(deleteSpan);
                dropdown.appendChild(li);                
            });
            dropdown.removeEventListener('show', disableScroll);
            dropdown.removeEventListener('hide', enableScroll);

            // Dropdown gösterildiğinde kaydırmayı devre dışı bırak
            dropdown.addEventListener('show', disableScroll);

            // Dropdown gizlendiğinde kaydırmayı yeniden etkinleştir
            dropdown.addEventListener('hide', enableScroll);

            console.log('the second bariyer passed in: ' + activeInput.id);

            positionDropdown();
        }
        console.log('input click event fired in: ' + activeInput.id + ' the dropdown display is: ' + dropdown.style.display);
    }

    function handleDropDownClick(event) {
        event.stopPropagation();
        if (!!activeInput && (((event.target.tagName === 'LI') || ((event.target.tagName === 'SPAN')) && (event.target.className === 'dd-text-content')))) {
            const li = event.target.tagName === 'LI' ? event.target : event.target.parentElement;
            spanEl = li.querySelector('.dd-text-content');
            activeInput.value = spanEl.textContent.trim();
            dropdown.style.display = 'none';
            if (spanEl.textContent.trim().length > 0) {
                removeMandatory(activeInput);
            }
            activeInput = null;
        }
    }

    // Dropdown menünün konumunu ve boyutunu ayarlayan fonksiyon
    function positionDropdown() {
        if (activeInput) {
            // Dropdown'u geçici olarak görünmez ama hesaplanabilir hale getir
            dropdown.style.visibility = 'hidden';
            dropdown.style.display = 'block';

            const rect = activeInput.getBoundingClientRect();
            const dropdownHeight = dropdown.offsetHeight;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                // Üstte yeterli alan varsa ve altta yeterli alan yoksa
                dropdown.style.top = `${rect.top + window.scrollY - dropdownHeight}px`;
            } else {
                // Altta yeterli alan varsa veya üstte yeterli alan yoksa
                dropdown.style.top = `${rect.bottom + window.scrollY}px`;
            }

            dropdown.style.left = `${rect.left + window.scrollX - 17}px`;
            dropdown.style['min-width'] = `${rect.width + 49}px`;

            // Hesaplamalar tamamlandıktan sonra dropdown'u tam olarak görünür hale getir
            dropdown.style.visibility = 'visible';

            console.log('the third bariyer passed in: ' + dropdown.style.visibility + ' ' + dropdown.style.display);

            adjustDropdownHeight(); // Yüksekliği ve kaydırma çubuğunu ayarla
        }
    }

    function disableScroll() {
        document.body.style.overflow = 'hidden'; // Sayfanın geri kalanında kaydırmayı engelle
    }

    function enableScroll() {
        document.body.style.overflow = ''; // Sayfa kaydırmasını yeniden etkinleştir
    }

    // Dropdown menünün yüksekliğini ayarlayan fonksiyon
    function adjustDropdownHeight() {
        const dropdownRect = dropdown.getBoundingClientRect();
        const spaceBelow = window.innerHeight - dropdownRect.bottom;
        if (spaceBelow < 20) { // Yetersiz boşluk varsa, dropdown yüksekliğini ayarla
            dropdown.style.maxHeight = `${Math.max(dropdownRect.height + spaceBelow - 20, 100)}px`; // Minimum 100px yükseklik
        } else {
            dropdown.style.maxHeight = '200px'; // Yeterli boşluk varsa, varsayılan maksimum yüksekliği kullan
        }
        dropdown.style.overflowY = 'auto'; // Her durumda kaydırma çubuğunu etkinleştir

        console.log('the fourth bariyer passed for: ' + dropdown.style.top + ' the left' + dropdown.style.left + 
        ' the height' + dropdown.style.height + ' the width' + dropdown.style.width+ ' the overflow' + dropdown.style.overflowY + ' the display' + dropdown.style.display);
    }

};
