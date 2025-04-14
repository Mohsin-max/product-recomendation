// API Configuration
const API_URL = "https://dummyjson.com/products";

// DOM Elements
const categoryButtons = document.getElementById("categoryButtons");
const productGrid = document.getElementById("productGrid");
const darkModeToggle = document.getElementById("darkModeToggle");

// Dark Mode Toggle
darkModeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
});

// Fetch Products
async function fetchProducts(category = "all") {
    try {
        let url = API_URL;
        if (category !== "all") {
            url += `/category/${category}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

// Render Products
async function renderProducts(category) {
    productGrid.innerHTML = `
        <div class="loading-card h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse-slow"></div>
        <div class="loading-card h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse-slow"></div>
        <div class="loading-card h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse-slow"></div>
        <div class="loading-card h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse-slow"></div>
    `;
    
    const products = await fetchProducts(category);
    productGrid.innerHTML = "";

    if (products.length === 0) {
        productGrid.innerHTML = `<div class="col-span-4 text-center py-10 text-gray-500">No products found.</div>`;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "bg-white dark:bg-darkCard rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1";
        productCard.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}" 
                 class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300">
            <div class="p-4">
                <h3 class="font-semibold text-lg text-gray-800 dark:text-white truncate">${product.title}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-primary font-bold">$${product.price}</span>
                    <span class="flex items-center text-yellow-500">
                        ${product.rating} ★
                    </span>
                </div>
                <button class="mt-4 w-full bg-primary hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                    View Details
                </button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}

// Initial Load
renderProducts("all");

// Category Button Clicks
categoryButtons.addEventListener("click", (e) => {
    if (e.target.classList.contains("category-btn")) {
        document.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.remove("bg-primary", "text-white");
            btn.classList.add("bg-gray-200", "dark:bg-gray-700", "dark:text-white");
        });
        e.target.classList.add("bg-primary", "text-white");
        e.target.classList.remove("bg-gray-200", "dark:bg-gray-700");
        const category = e.target.dataset.category || "all";
        renderProducts(category);
    }
});