function initializeUlDropdown() {
    const inputs = document.querySelectorAll('.wrap-inner input.sd-auto-1 ');
    const dropdown = document.querySelector('.dropdown-menu');
    let activeInput = null;
    let dataSource = null;
    let dataSourceArr = [];
    var boundHandleDropDownClick = handleDropDownClick.bind(dropdown);
    
    inputs.forEach(input => {
        var boundHandleInputClick = handleInputClick.bind(input);        
        var boundHandleInputBlur = handleInputBlur.bind(input);

        input.removeEventListener('click', boundHandleInputClick);
        input.addEventListener('click', boundHandleInputClick);

        input.removeEventListener('blur', boundHandleInputBlur);
        input.addEventListener('blur', boundHandleInputBlur);

    });

    dropdown.removeEventListener('click', boundHandleDropDownClick);
    dropdown.addEventListener('click', boundHandleDropDownClick);

    document.body.addEventListener('click', function () {
        dropdown.style.display = 'none';
        activeInput = null; // Aktif input'u sıfırla
    });

    window.addEventListener('resize', positionDropdown, { capture: false, passive: true });    
    window.addEventListener('scroll', positionDropdown, { capture: false, passive: true });



    function handleInputBlur(event) {
        event.stopPropagation();
        dataSource = document.getElementsByName(this.id + 'Data')[0];
        dataSourceArr = dataSource.value.split(',');

        if (!!this.value && (this.value.length > 0) && !dataSourceArr.includes(this.value)){            
            dataSourceArr.push(this.value);
            dataSourceArr = [...new Set(dataSourceArr)];
            dataSource.value = dataSourceArr.join(',');
        }
    }

    function handleInputClick(event) {        
        event.stopPropagation();
        activeInput = this;
        dropdown.innerHTML = '';
        
        dataSource = document.getElementsByName(activeInput.id + 'Data')[0];
        dataSourceArr = dataSource.value.split(',');

        if (!!activeInput && document.getElementsByName(activeInput.id + 'Data') !== null) {
            document.getElementsByName(activeInput.id + 'Data')[0].value.split(',').forEach(option => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                span.className = 'dd-text-content';
                span.textContent = option;
                li.appendChild(span);
    
                const deleteSpan = document.createElement('span');
                deleteSpan.textContent = 'x';
                deleteSpan.className = 'delete-btn';
    
                const deleteSpanInner = document.createElement('span');
                deleteSpanInner.className = 'delete-btn-inner';
                deleteSpan.appendChild(deleteSpanInner);
    
                let dataSource = document.getElementsByName(activeInput.id + 'Data')[0];
                let dataSourceArr = dataSource.value.split(',');
    
                deleteSpan.addEventListener('click', function (event) {
                    event.stopPropagation();
                    const index = dataSourceArr.indexOf(option);
                    if (index > -1) {
                        dataSourceArr.splice(index, 1);
                    }
                    dataSource.value = dataSourceArr.join(',');
                    li.remove();
                });
    
                li.appendChild(deleteSpan);
                dropdown.appendChild(li);
            });
        }
        console.log('input click event fired');

        dropdown.removeEventListener('show', disableScroll);
        dropdown.removeEventListener('hide', enableScroll);
        
        // Dropdown gösterildiğinde kaydırmayı devre dışı bırak
        dropdown.addEventListener('show', disableScroll);
        
        // Dropdown gizlendiğinde kaydırmayı yeniden etkinleştir
        dropdown.addEventListener('hide', enableScroll);

        positionDropdown();
    }

    function handleDropDownClick (event) {
        event.stopPropagation();
        if ((event.target.tagName === 'LI') || ((event.target.tagName === 'SPAN') && (event.target.className === 'dd-text-content'))){
            const li = event.target.tagName === 'LI' ? event.target : event.target.parentElement;
            activeInput.value = li.querySelector('.dd-text-content').textContent;
            dropdown.style.display = 'none';            
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
    
            dropdown.style.left = `${rect.left + window.scrollX-17}px`;
            dropdown.style.width = `${rect.width+49}px`;
    
            // Hesaplamalar tamamlandıktan sonra dropdown'u tam olarak görünür hale getir
            dropdown.style.visibility = 'visible';
    
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
    }

};
