function initializeUlDropdown() {
    const inputs = document.querySelectorAll('.wrap-inner input.sd-auto-1 ');
    const dropdown = document.querySelector('.dropdown-menu');
    let activeInput = null;

    inputs.forEach(input => {
        input.addEventListener('click', function (event) {
            event.stopPropagation();
            activeInput = this;
            positionDropdown();
        });
    });

    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
        if (event.target.tagName === 'LI') {
            activeInput.value = event.target.textContent;
            dropdown.style.display = 'none';
            activeInput = null; // Aktif input'u sıfırla
        }
    });

    document.body.addEventListener('click', function () {
        dropdown.style.display = 'none';
        activeInput = null; // Aktif input'u sıfırla
    });

    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);

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
    
    // Dropdown gösterildiğinde kaydırmayı devre dışı bırak
    dropdown.addEventListener('show', disableScroll);
    
    // Dropdown gizlendiğinde kaydırmayı yeniden etkinleştir
    dropdown.addEventListener('hide', enableScroll);

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
