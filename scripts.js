import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

let page = 1;
let matches = books

// Utility function to create an element with attributes and inner HTML
function createElement(tag, attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    element.innerHTML = innerHTML;
    return element;
} 

// Function to render book previews
function renderBookPreviews(books, container) {
    const fragment = document.createDocumentFragment();
    for (const { author, id, image, title } of books) {
        const element = createElement('button', {
            class: 'preview',
            'data-preview': id,
        }, `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `);
        fragment.appendChild(element);
    }
    container.appendChild(fragment);
}

// Function to populate dropdown options
function populateDropdownOptions(container, options, defaultOptionText) {
    const fragment = document.createDocumentFragment();
    const firstOptionElement = createElement('option', { value: 'any' }, defaultOptionText);
    fragment.appendChild(firstOptionElement);
    for (const [id, name] of Object.entries(options)) {
        const optionElement = createElement('option', { value: id }, name);
        fragment.appendChild(optionElement);
    }
    container.appendChild(fragment);

}
// Utility function to set the theme
function setTheme(theme) {
    const darkColors = theme === 'night' ? '255, 255, 255' : '10, 10, 20';
    const lightColors = theme === 'night' ? '10, 10, 20' : '255, 255, 255';
    document.documentElement.style.setProperty('--color-dark', darkColors);
    document.documentElement.style.setProperty('--color-light', lightColors);
    document.querySelector('[data-settings-theme]').value = theme;
}


// Function to update the book list
function updateBookList(matches) {
    const bookList = document.querySelector('[data-list-items]');
    bookList.innerHTML = '';
    renderBookPreviews(matches.slice(0, BOOKS_PER_PAGE), bookList);

    const remainingBooks = matches.length - BOOKS_PER_PAGE;
    const showMoreButton = document.querySelector('[data-list-button]');
    showMoreButton.innerText = `Show more (${remainingBooks})`;
    showMoreButton.disabled = remainingBooks <= 0;
    showMoreButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remainingBooks})</span>
    `;
}

// Function to handle search form submission
function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const result = books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        const titleMatch = !filters.title.trim() || book.title.toLowerCase().includes(filters.title.toLowerCase());
        const authorMatch = filters.author === 'any' || book.author === filters.author;
        return genreMatch && titleMatch && authorMatch;
    });

    page = 1;
    matches = result;
    if (result.length < 1) {
        document.querySelector('[data-list-message]').classList.add('list__message_show');
    } else {
        document.querySelector('[data-list-message]').classList.remove('list__message_show');
    }
    updateBookList(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-search-overlay]').open = false;
}

// Function to initialize the search and settings form
function initializeForms() {
    document.querySelector('[data-search-form]').addEventListener('submit', handleSearch);

    document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const { theme } = Object.fromEntries(formData);
        setTheme(theme);
        document.querySelector('[data-settings-overlay]').open = false;
    });

    document.querySelector('[data-search-cancel]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = false;
    });

    document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = false;
    });

    document.querySelector('[data-header-search]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = true;
        document.querySelector('[data-search-title]').focus();
    });

    document.querySelector('[data-header-settings]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = true;
    });

    // Event listener to close the book details overlay
    document.querySelector('[data-list-close]').addEventListener('click', () => {
        document.querySelector('[data-list-active]').open = false;
    });
}

// Function to handle "Show more" button click
function handleShowMore() {
    const fragment = document.createDocumentFragment();
    const start = page * BOOKS_PER_PAGE;
    const end = start + BOOKS_PER_PAGE;
    renderBookPreviews(matches.slice(start, end), fragment);
    document.querySelector('[data-list-items]').appendChild(fragment);
    page += 1;
}

// Function to handle book preview click
function handleBookPreviewClick(event) {
    const pathArray = Array.from(event.path || event.composedPath());
    let active = null;

    for (const node of pathArray) {
        if (active) break;
        if (node?.dataset?.preview) {
            active = books.find(book => book.id === node.dataset.preview);
        }
    }

    if (active) {
        document.querySelector('[data-list-active]').open = true;
        document.querySelector('[data-list-blur]').src = active.image;
        document.querySelector('[data-list-image]').src = active.image;
        document.querySelector('[data-list-title]').innerText = active.title;
        document.querySelector('[data-list-subtitle]').innerText = `${authors[active.author]} (${new Date(active.published).getFullYear()})`;
        document.querySelector('[data-list-description]').innerText = active.description;
    }
}


// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Populate genre and author dropdowns
    populateDropdownOptions(document.querySelector('[data-search-genres]'), genres, 'All Genres');
    populateDropdownOptions(document.querySelector('[data-search-authors]'), authors, 'All Authors');

    // Set initial theme
    const initialTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    setTheme(initialTheme);

    // Initialize forms
    initializeForms();

    // Render initial book previews
    updateBookList(matches);

    // Attach event listeners
    document.querySelector('[data-list-button]').addEventListener('click', handleShowMore);
    document.querySelector('[data-list-items]').addEventListener('click', handleBookPreviewClick);
});
