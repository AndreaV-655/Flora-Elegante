// Configuración de Tailwind (debe cargarse justo después del CDN)
tailwind.config = {
    theme: {
        extend: {
            colors: {
                cream: '#faf5ef',
                'cream-dark': '#f0e8dd',
                forest: '#1a3c2a',
                'forest-light': '#2a5a40',
                terra: '#c9584d',
                'terra-dark': '#b5473d',
                gold: '#c9a96e',
                'gold-light': '#e0c992',
                leaf: '#3d7a54',
                'leaf-light': '#5a9e72',
                charcoal: '#2d2d2d',
                muted: '#8a7e72',
                bord: '#e5ddd3',
            },
            fontFamily: {
                display: ['"Playfair Display"', 'serif'],
                body: ['Lato', 'sans-serif'],
            }
        }
    }
};
