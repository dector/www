/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./out/**/*.html"],
    theme: {
        colors: {
            background: "var(--color-background)",
            link1: "var(--color-link1-base)",
            link2: "var(--color-link2-base)",
            link3: {
                DEFAULT: "var(--color-link3-base)",
                darker: "var(--color-link3-darker)",
            },
            normal: "var(--color-normal)",
            "normal-lighter": "var(--color-normal-lighter)",
            muted: "var(--color-muted)",
        },
    },
    plugins: [],
};
