export function searchBar() {
    let searchBarDropdown = document.querySelector('.aa-dropdown-menu')
    let searchbar = document.querySelector('#aa-search-input')

    searchbar.addEventListener("keyup", (z) => {
        if (searchbar.value === "") {
            searchBarDropdown.style.opacity = 0
        } else {
            searchBarDropdown.style.opacity = 1
        }

    })
}